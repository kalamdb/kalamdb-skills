# SQL Patterns

## USER Table Chat Messages

```sql
CREATE NAMESPACE IF NOT EXISTS chat;

CREATE TABLE chat.messages (
  id BIGINT PRIMARY KEY DEFAULT SNOWFLAKE_ID(),
  room TEXT NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) WITH (TYPE = 'USER', FLUSH_POLICY = 'rows:1000,interval:60');

INSERT INTO chat.messages (room, role, body)
VALUES ('main', 'user', 'hello');

SELECT id, role, body, created_at
FROM chat.messages
WHERE room = 'main'
ORDER BY created_at ASC
LIMIT 100;
```

## Upsert With RETURNING

```sql
CREATE NAMESPACE IF NOT EXISTS app;

CREATE TABLE app.items (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL
) WITH (TYPE = 'SHARED', STORAGE_ID = 'local');

INSERT INTO app.items (id, name) VALUES (1, 'alpha');

-- Update existing row and return the final values
INSERT INTO app.items (id, name) VALUES (1, 'beta')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name AS returned_name;

-- Insert when the primary key is missing
INSERT INTO app.items (id, name) VALUES (42, 'gamma')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name;
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

## Shared Table Row-Level Security

Shared tables are FORCE RLS. System/DBA bypass. User and Service are default-deny until a policy exists.

```sql
CREATE SHARED TABLE app.documents (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  body TEXT
);

CREATE POLICY owner_read ON app.documents
  FOR SELECT TO user
  USING (owner_id = CURRENT_USER);

CREATE POLICY owner_write ON app.documents
  FOR ALL TO user
  USING (owner_id = CURRENT_USER)
  WITH CHECK (owner_id = CURRENT_USER);
```

Membership policies should use a covering primary key on `(principal, relation_key)`:

```sql
CREATE SHARED TABLE app.group_members (
  user_id TEXT,
  group_id TEXT,
  PRIMARY KEY (user_id, group_id)
);

CREATE POLICY member_read ON app.messages
  FOR SELECT TO user
  USING (
    group_id IN (
      SELECT group_id FROM app.group_members
      WHERE user_id = CURRENT_USER
    )
  );
```

## Worker Write Boundary

```sql
EXECUTE AS 'user_123' (
  INSERT INTO chat.messages (room, role, body)
  VALUES ('main', 'assistant', 'done')
);
```