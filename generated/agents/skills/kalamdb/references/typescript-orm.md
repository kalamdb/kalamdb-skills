# TypeScript ORM

Use this file for `@kalamdb/orm`, Drizzle integration, schema generation, custom columns, and typed live tables. Language chooser: [orms.md](orms.md). Shared-table policies: [rls-policies.md](rls-policies.md).

## Sources

- `link/sdks/typescript/orm/`
- `link/sdks/typescript/orm/README.md`

## Install

```bash
npm i @kalamdb/client @kalamdb/orm drizzle-orm
```

This is the **only** TypeScript ORM. Do not add Prisma, TypeORM, or Kysely for KalamDB tables.

## Owns

- `kalamDriver(client)` with `drizzle(kalamDriver(client))` for Drizzle `pg-proxy`
- `kalamFile(name, blob)` for FILE uploads in `.values()` / `.set()` (driver routes to multipart SQL)
- `queryWithFiles()` and `compileQuery()` for raw SQL or advanced compile-only use cases
- `kTable.shared`, `kTable.user`, `kTable.stream`, `kTable.system`
- KalamDB-specific columns: `file()`, `bytes()`, `embedding()`
- `liveTable()`
- `executeAsUser()` for compiled Drizzle builders
- `configureKalamOrm({ namespace })` only when using **unqualified** hand-written table names
- `kalamdb-orm` schema generator (CLI `kalam schema gen` always emits namespaced `ns_table` / `"ns.table"` plus system columns)

## Table helpers vs SQL type

| Helper | SQL | Policies |
|--------|-----|----------|
| `kTable.user('app.messages', cols)` | `CREATE USER TABLE` | None — isolation is physical |
| `kTable.shared('app.docs', cols)` | `CREATE SHARED TABLE` | Required `CREATE POLICY` in `schema.sql` |
| `kTable.stream('app.events', cols)` | `CREATE STREAM TABLE` | None |
| `kTable.system(...)` | Engine tables | DBA/system only |

The helper only tags metadata for the driver. Shared tables with no policy still return zero rows to `user`/`service`.

## Schema Generation

For workflow apps, start from `schema.sql`, not hand-written TypeScript row models. Declare app table type directly:

```sql
CREATE USER TABLE messages (...);
CREATE STREAM TABLE message_streams (...) WITH (TTL_SECONDS = 300);
```

Then run `kalam dev` or `kalam schema gen` and import generated tables/types from the configured output (usually `src/generated/kalam.ts`). Treat generated ORM types as the source of truth in React components and consumer workers. Do not create separate `Message`, `User`, or stream row interfaces before generation; if a helper needs a type, use `Messages`, `MessageStreams`, etc. from generated output. Do not add `src/**/model.ts` files for table row factories, row interfaces, roles, statuses, or timestamp shapes that duplicate generated schema output.

```bash
kalamdb-orm \
  --url http://localhost:2900 \
  --user admin \
  --password AdminPass123! \
  --namespace app \
  --include-system-columns \
  --out src/db/schema.ts
```

Important options:

- `--namespace <name>` repeatable or comma-separated
- `--include-system`
- `--include-system-columns [all|_seq,_deleted]`
- `--bigint-mode <string|bigint|number>`
- `--no-type-aliases`

Generated exports stay namespaced (`chat_messages` / `"chat.messages"`) even for a single namespace. `kalam schema gen` also includes system columns (`_seq`, `_deleted`). Do not expect short names like `messages` unless you opt into unqualified generation. Import `chat_demo_messagesConfig.systemColumns` — it is always defined.

## Type Mapping Highlights

- `BIGINT` defaults to string to preserve Int64 precision.
- `TIMESTAMP`, `DATE`, and `TIME` normalize for Drizzle temporal columns.
- `FILE` maps to `FileRef | null` on read; pass `kalamFile()`, `File`, or `Blob` on write through `file()`.
- `BYTES` maps to `Uint8Array | null`.
- `EMBEDDING(n)` maps to `number[] | null`.

## FILE uploads through Drizzle

Normal queries use `db.select()`, `db.insert()`, and so on directly. For FILE bytes, pass `kalamFile(name, blob)` in `.values()` or `.set()`:

```typescript
import { drizzle } from 'drizzle-orm/pg-proxy';
import { kalamDriver, kalamFile } from '@kalamdb/orm';

const db = drizzle(kalamDriver(client));

await db.insert(attachments).values({
  id: 'att_1',
  file_data: kalamFile('upload', selectedFile),
});
```

`kalamDriver()` compiles the builder, normalizes SQL for KalamDB, rewrites upload params to `FILE("name")`, and calls `client.queryWithFiles()` when bytes are present. Upserts with `onConflictDoUpdate()` work the same way.

For raw SQL strings, use `queryWithFiles()` from `@kalamdb/orm` or `@kalamdb/client`. See [typescript-files.md](typescript-files.md).

Use generated schema types directly in React and consumer workers when sharing domain tables. USER-table data is scoped by authenticated KalamDB user; do not add fake `user_id` tenancy columns or app-level `users` tables for auth identity.

Workers writing into a USER table:

```typescript
import { executeAsUser } from '@kalamdb/orm';

await executeAsUser(
  client,
  db.insert(messages).values({ room: 'main', role: 'assistant', body: 'done' }),
  'user_123',
);
```

Signature is `(client, sqlOrDrizzleBuilder, userId)`. Do not pass a callback. `executeAsUser` does not rewrite shared-table `CURRENT_USER`. Shared writes need a `TO service` policy.

Example: [typescript-orm.md](../examples/typescript-orm.md).
