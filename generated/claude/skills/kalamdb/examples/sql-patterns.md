# SQL Patterns

Prefer `CREATE USER TABLE` / `CREATE SHARED TABLE` / `CREATE STREAM TABLE`. After any `CREATE SHARED TABLE`, add `CREATE POLICY` in the same change. Full RLS rules: [rls-policies.md](../references/rls-policies.md).

## USER Table: Private Agent Memory (no policy)

Use `USER` when each signed-in principal should only ever see their own rows. Do not add `user_id` columns or `CREATE POLICY`.

```sql
CREATE NAMESPACE IF NOT EXISTS chat;

CREATE USER TABLE chat.messages (
  id BIGINT PRIMARY KEY DEFAULT SNOWFLAKE_ID(),
  room TEXT NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) WITH (FLUSH_POLICY = 'rows:1000,interval:60');

INSERT INTO chat.messages (room, role, body)
VALUES ('main', 'user', 'hello');

SELECT id, role, body, created_at
FROM chat.messages
WHERE room = 'main'
ORDER BY created_at ASC
LIMIT 100;
```

## SHARED Table: Owner Documents

Use `SHARED` when several users may see the same row. Default-deny until policies exist.

```sql
CREATE SHARED TABLE app.documents (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE POLICY owner_read ON app.documents
  FOR SELECT TO user
  USING (owner_id = CURRENT_USER);

CREATE POLICY owner_write ON app.documents
  FOR ALL TO user
  USING (owner_id = CURRENT_USER)
  WITH CHECK (owner_id = CURRENT_USER);

CREATE POLICY service_published_read ON app.documents
  FOR SELECT TO service
  USING (status = 'published');
```

When: personal docs that the owner can later share; CMS drafts; files with an owner column.

## SHARED Table: Conversation Membership

When: Slack/chat rooms where members see the same message stream.

```sql
CREATE SHARED TABLE app.conversation_members (
  user_id TEXT,
  conversation_id TEXT,
  role TEXT NOT NULL,
  PRIMARY KEY (user_id, conversation_id)
);

CREATE POLICY members_self ON app.conversation_members
  FOR ALL TO user
  USING (user_id = CURRENT_USER)
  WITH CHECK (user_id = CURRENT_USER);

CREATE SHARED TABLE app.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL
);

CREATE POLICY member_read ON app.messages
  FOR SELECT TO user
  USING (
    conversation_id IN (
      SELECT conversation_id FROM app.conversation_members
      WHERE user_id = CURRENT_USER
    )
  );

CREATE POLICY member_insert ON app.messages
  FOR INSERT TO user
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM app.conversation_members
      WHERE user_id = CURRENT_USER
    )
  );
```

## SHARED Table: Public Catalog / Feature Flags

When: every authenticated user should read the same config; only services write.

```sql
CREATE SHARED TABLE app.catalog (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE POLICY catalog_read ON app.catalog
  FOR SELECT TO user, service
  USING (published = TRUE);

CREATE POLICY catalog_write ON app.catalog
  FOR ALL TO service
  USING (true)
  WITH CHECK (true);
```

`USING (true)` broadcasts every live change. Fine for small config tables; do not use it on high-churn message tables.

## SHARED Table: Tenant-As-Principal

When: the authenticated subject **is** the tenant (B2B events, account-scoped orders). Same `CURRENT_USER` for `user` and `service`.

```sql
CREATE SHARED TABLE app.orders (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL,
  total TEXT NOT NULL
);

CREATE POLICY order_tenant ON app.orders
  FOR ALL TO user, service
  USING (account_id = CURRENT_USER)
  WITH CHECK (account_id = CURRENT_USER);
```

Do not combine that equality with a row-local `OR is_public = true` in the policy — that shape is rejected. Filter extras in the client `WHERE`.

## Mixed: SHARED Team Object + USER Private Rows

When: a ticket/room/conversation is shared, but notes, memories, or carts stay private.

```sql
CREATE SHARED TABLE support.tickets (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE POLICY ticket_account ON support.tickets
  FOR ALL TO user
  USING (account_id = CURRENT_USER)
  WITH CHECK (account_id = CURRENT_USER);

CREATE USER TABLE support.private_notes (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  body TEXT NOT NULL
);
```

Workers writing `private_notes` use `EXECUTE AS`. Workers updating `tickets` need a `TO service` policy (impersonation does not change shared `CURRENT_USER`).

## STREAM Table: Typing Next To A Room

When: ephemeral per-user presence. Still physically isolated — not a shared feed.

```sql
CREATE STREAM TABLE chat.typing (
  conversation_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  PRIMARY KEY (conversation_id)
) WITH (TTL_SECONDS = 15);
```

No `CREATE POLICY`. Other users do not see this partition. For a shared typing indicator, use a `SHARED` table with a membership policy instead.

## SHARED Table: Worker Enrichment

When: a topic consumer (summarizer, fulfillment) updates the same shared row every user can see.

```sql
CREATE POLICY blogs_read ON blog.blogs
  FOR SELECT TO user
  USING (true);

CREATE POLICY blogs_service ON blog.blogs
  FOR ALL TO service
  USING (true)
  WITH CHECK (true);
```

`change.user` on a shared-table topic event may be unset. Do not wrap the shared `UPDATE` in `EXECUTE AS`.

## SHARED FILE Column

RLS applies to `FILE` downloads. Grant the parent row first:

```sql
CREATE SHARED TABLE app.docs (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  attachment FILE
);

CREATE POLICY docs_owner ON app.docs
  FOR ALL TO user
  USING (owner_id = CURRENT_USER)
  WITH CHECK (owner_id = CURRENT_USER);
```

## Upsert With RETURNING (USER or DBA on SHARED)

`user` / `service` cannot `ON CONFLICT DO UPDATE` on **shared** tables (RLS). Use this on `USER` tables, or as `dba`/`system` on shared tables.

```sql
CREATE USER TABLE app.items (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO app.items (id, name) VALUES (1, 'alpha');

INSERT INTO app.items (id, name) VALUES (1, 'beta')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name AS returned_name;
```

## Upsert Inside A Transaction

```sql
BEGIN;

INSERT INTO app.items (id, name) VALUES (2, 'alpha');

INSERT INTO app.items (id, name) VALUES (2, 'gamma')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name;

COMMIT;
```

## Topic Source And Consumer

```sql
CREATE TOPIC chat.message_events PARTITIONS 1;

ALTER TOPIC chat.message_events
ADD SOURCE chat.messages
ON INSERT
WITH (payload = 'full');

CONSUME FROM chat.message_events GROUP 'worker' FROM EARLIEST LIMIT 25;

ACK chat.message_events GROUP 'worker' PARTITION 0 UPTO OFFSET 24;
```

## Worker Write Boundary (USER tables)

`EXECUTE AS` scopes USER/STREAM writes to that `user_id`. It does **not** change `CURRENT_USER` for shared-table RLS. For shared tables, add a `TO service` policy instead.

```sql
EXECUTE AS 'user_123' (
  INSERT INTO chat.messages (room, role, body)
  VALUES ('main', 'assistant', 'done')
);
```