# Shared Tables And RLS

Use this file when choosing `USER` vs `SHARED`, writing `CREATE POLICY`, or explaining why a user sees zero rows on a shared table.

SQL syntax also lives in [sql-syntax.md](sql-syntax.md). Copy-paste cases: [sql-patterns.md](../examples/sql-patterns.md).

## Pick A Table Type First

| Type | Isolation | Policies | Use when |
|------|-----------|----------|----------|
| `USER` | Physical partition by authenticated / `EXECUTE AS` `user_id` | **None.** Do not `CREATE POLICY`. | Private per-user data: agent memory, preferences, that user's chat history, carts, private notes |
| `STREAM` | Same physical user partition; TTL | **None.** | Typing, presence, token streams, short-lived events |
| `SHARED` | One copy of rows in the namespace | **FORCE RLS.** Default-deny for `user` and `service` until `CREATE POLICY` | Data several principals must share: rooms, tickets, catalogs, memberships, published docs, orders |

`SYSTEM` tables are engine-owned. Anonymous sessions cannot open shared tables. `system` and `dba` bypass RLS.

There is no `ACCESS_LEVEL` table option. Grant shared rows with `CREATE POLICY`.

If neither a typed prefix nor `WITH (TYPE = ...)` is set, CREATE TABLE currently defaults to **SHARED** (then default-deny). Always declare the type:

```sql
CREATE USER TABLE app.memory (...);
CREATE SHARED TABLE app.documents (...);
CREATE STREAM TABLE app.typing (...) WITH (TTL_SECONDS = 60);
```

Stay on `USER` when only the signed-in principal should ever see the rows. Switching a private table to `SHARED` later means rewriting isolation as policies.

## FORCE RLS Rules

- Shared table with no matching policy → `user` / `service` see **zero rows** and cannot write.
- Policies are always **permissive** (`AS RESTRICTIVE` is rejected). Any matching policy that allows the row wins.
- `TO user` / `TO service` / `TO user, service` / `TO PUBLIC`. Named principals (`TO alice`) are not supported. Bind identity with `CURRENT_USER`.
- `TO PUBLIC` (or omit `TO`) means `user` and `service`, not anonymous.
- Policy DDL requires `system`, `dba`, or `service`. Regular `user` sessions cannot change policies.
- Client `WHERE` (including `OR true`) cannot bypass RLS. Authorized MVCC winners are selected first.
- RLS also applies to `FILE` downloads on shared tables.
- `user` / `service` `ON CONFLICT DO UPDATE` on shared tables is **rejected**. Use `INSERT` or `UPDATE`.
- `EXECUTE AS` does **not** change shared-table RLS. `CURRENT_USER` stays the session that opened the statement. Use `EXECUTE AS` for **USER** / **STREAM** writes on behalf of a user.

## When To Use What

| Product case | Tables | Policy / isolation |
|--------------|--------|--------------------|
| Private notes, agent memory, 1:1 AI chat | `USER` messages | None — auth already isolates |
| Multi-user Slack/room chat | `SHARED` members + `SHARED` messages | Membership `IN (SELECT … WHERE user_id = CURRENT_USER)` |
| Docs the owner can share | `SHARED` documents | `owner_id = CURRENT_USER` plus optional membership |
| Chat rooms + private history | `SHARED` rooms + `USER` messages | Rooms: owner or membership. Messages stay in the user partition |
| Support tickets + private agent notes | `SHARED` tickets + `USER` notes | Tickets: `account_id = CURRENT_USER` or membership. Notes: no policy |
| AI conversations + per-user memories | `SHARED` conversations + `USER` memories | Conversations: membership. Memories: `EXECUTE AS` from the worker |
| Cart vs placed order | `USER` carts + `SHARED` orders | Carts: none. Orders: `account_id = CURRENT_USER` |
| Product catalog / public FAQ | `SHARED` catalog | `FOR SELECT TO user USING (true)` or `published = TRUE` |
| Feature flags / app config | `SHARED` config | `USING (true)` for reads; writes `TO service` only |
| Tenant-as-principal events | `SHARED` events | `tenant_id = CURRENT_USER` for `TO user, service` |
| Typing / presence next to a room | `STREAM` typing | None — still per-user partition, not shared |
| Worker enrichment of **user** rows | `USER` + `EXECUTE AS '<user_id>'` | Not RLS. Service acts in that user's partition |
| Worker enrichment of **shared** rows | `SHARED` + `TO service` | `FOR ALL TO service USING (true)` or `status = 'published'` |
| Topic consumer / summarizer | `SHARED` source table | Service needs a write policy; `change.user` may be unset |

Copy-paste SQL for these shapes: [sql-patterns.md](../examples/sql-patterns.md).

## Policy SQL

```sql
CREATE POLICY <name> ON [<namespace>.]<table>
  [AS PERMISSIVE]
  FOR { ALL | SELECT | INSERT | UPDATE | DELETE }
  TO { PUBLIC | user | service | user, service }
  [USING (<boolean_expr>)]
  [WITH CHECK (<boolean_expr>)];

ALTER POLICY <name> ON [<namespace>.]<table> USING (<boolean_expr>);
ALTER POLICY <name> ON [<namespace>.]<table> RENAME TO <new_name>;
DROP POLICY [IF EXISTS] <name> ON [<namespace>.]<table>;
```

`DROP POLICY CASCADE` is not supported.

| Command | `USING` | `WITH CHECK` |
|---------|---------|--------------|
| `SELECT` | Required | Not allowed |
| `INSERT` | Not allowed | Required |
| `UPDATE` | Existing row | New row |
| `DELETE` | Existing row | Not allowed |
| `ALL` | Existing row | New row for insert/update |

## Supported USING shapes (live-safe)

| Shape | Example | Live routing |
|-------|---------|--------------|
| Column = current user | `owner_id = CURRENT_USER` | Keyed on that column |
| Column = literal | `status = 'published'` | Keyed on that literal |
| Membership `IN` / `EXISTS` | `conversation_id IN (SELECT … WHERE user_id = CURRENT_USER)` | Keyed on membership values |
| Allow all | `true` | Broadcast — avoid on large tables |
| Deny all | `false` | No live candidates |

`IN (SELECT …)` and correlated `EXISTS` compile to the same membership relation. Membership subqueries may add **static** predicates on the relation (`AND role = 'editor'`). That is not the rejected row-local `AND`.

Rejected at `CREATE POLICY`: row-local `AND` / `OR` / `NOT` (`owner_id = CURRENT_USER OR is_public = true`), negated `IN`/`EXISTS`, aggregates in membership subqueries, `TO <user_id>` lists.

Put extra filters in the client `WHERE`, not in the policy, unless they are a bounded equality or membership key.

Give membership tables a covering PK on `(principal, relation_key)`:

```sql
CREATE SHARED TABLE app.conversation_members (
  user_id TEXT,
  conversation_id TEXT,
  role TEXT NOT NULL,
  PRIMARY KEY (user_id, conversation_id)
);
```

## Live subscriptions

Shared live queries bind RLS at subscribe time and route by policy keys. Prefer owner/membership keys over `USING (true)`. New policies do not apply to existing subscriptions until the client resubscribes. Fail-closed on grant/revoke races — client should resubscribe after a gap.

Dart `kalam_sync` and TypeScript `live()` / `liveTable()` still hit these policies. The local Drift cache and the React live set only contain rows the server already allowed.

## Empty-result checklist

`user`/`service` `SELECT` on a shared table returns zero rows when:

1. No `CREATE POLICY` exists (default deny).
2. Policies exist but none match `TO user` / `TO service` for this session.
3. `USING` does not match (`owner_id` is another principal, unpublished row, not a member).
4. The client is anonymous.

Writes fail for the same reasons. `dba`/`system` bypassing RLS is not a substitute for app policies.

## Agent Rules

- Default new app tables to `USER` unless several users must see the same rows.
- After `CREATE SHARED TABLE`, always add `CREATE POLICY` in the same `schema.sql` change.
- Do not emit `ACCESS_LEVEL`.
- Do not add fake `user_id` tenancy columns on `USER` tables.
- Workers writing USER data: `EXECUTE AS '<user_id>'` or SDK `executeAsUser(client, drizzleBuilder, userId)`. Workers reading/writing SHARED: a `TO service` policy — impersonation does not rewrite `CURRENT_USER`.
- TypeScript: `kTable.shared(...)` still needs matching `CREATE POLICY` in SQL.
- Dart sync: shared tables generate as bidirectional; the **server** still enforces RLS. The local Drift cache only holds rows the live SQL + policies already allowed.
