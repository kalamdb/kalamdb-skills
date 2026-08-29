# ORMs And Typed Tables

KalamDB does **not** ship Prisma, TypeORM, Kysely, Diesel, SeaORM, SQLAlchemy, or sqflite models. Use the official typed layer for the language:

| Language | Typed layer | Underlying store | Use when |
|----------|-------------|------------------|----------|
| TypeScript | `@kalamdb/orm` | Drizzle `pg-proxy` over HTTP SQL | Node/browser apps, React live tables, generated `schema.ts`, topic workers that compile Drizzle DML |
| Dart / Flutter | `kalam_sync` | Drift + SQLite on device | Local-first Flutter. App schema is `KalamTableSpec`, not hand-written Drift tables |
| Dart live SQL only | `kalam_link` | None (no local DB) | One-shot queries / live streams without an offline cache |
| Rust | **None** — `kalam-client` | SQL strings | Services and workers |
| Python | **None** — `kalamdb` (`pip install kalamdb`) | SQL strings | Scripts and services |
| PostgreSQL | **None** — `pg_kalam` FDW | Foreign tables | Query Kalam from Postgres; not an app ORM |

Not ORMs: `@kalamdb/react` (live UI hooks on the client/ORM), `@kalamdb/consumer` (topic workers), Admin UI.

Schema-first for every ORM path: edit `schema.sql` → `kalam schema gen` / `kalam dev` → import generated types. Do not invent a second row model.

## TypeScript (`@kalamdb/orm` + Drizzle)

- Driver: `drizzle(kalamDriver(client))` from `drizzle-orm/pg-proxy`.
- Table helpers: `kTable.user` / `kTable.shared` / `kTable.stream` / `kTable.system` (not raw `pgTable`).
- Shared tables still need `CREATE POLICY` in SQL — the helper only tags the Drizzle table type.
- FILE writes: `kalamFile(name, blob)` in `.values()` / `.set()`.
- Workers: `executeAsUser(client, db.insert(...), userId)` for **USER**-table writes. Signature is `(client, sqlOrBuilder, user)` — not a callback.
- Shared-table worker writes: Drizzle `db.update(...)` under a `TO service` policy. `executeAsUser` does not rewrite shared `CURRENT_USER`.
- Namespace: single-namespace gen uses `configureKalamOrm({ namespace: 'app' })`.
- Typical mix in one schema: `kTable.shared` rooms/tickets/orders + `kTable.user` messages/notes/carts + `kTable.stream` events. Policies only on the shared ones.
- Details: [typescript-orm.md](typescript-orm.md). Example: [typescript-orm.md](../examples/typescript-orm.md).

Do not add Prisma, Kysely, or a second HTTP client for the same tables.

## Dart (`kalam_sync` + Drift/SQLite)

`kalam_sync` **is** the Flutter ORM/cache. It opens one Drift database per `(serverUrl, namespace, subject)` via `drift_flutter` (`KalamFlutterDatabaseFactory`, `shareAcrossIsolates: true`). SQLite holds:

- cached row JSON (`kalam_cached_rows`)
- DML / custom-action outbox (`kalam_actions`, `kalam_action_steps`)
- live checkpoints (`kalam_checkpoints`)
- per-row sync state (`kalam_row_states`)

App tables are **not** Drift `@DataClassName` tables. `kalam schema gen --languages dart` writes `KalamTables.*` + row codecs. Bind with `kalam.table(KalamTables.todos)`.

Import `package:kalam_sync/kalam_sync.dart` in app code. Import `package:kalam_sync/drift.dart` only if you need Drift types (`KalamSyncDatabase`, `NativeDatabase`) for tests or a custom `KalamDatabaseFactory`.

Do not add `sqflite`, `hive`, or a second Drift `@DriftDatabase` for the same Kalam rows.

When to pick `kalam_sync` vs `kalam_link`: [dart-sync.md](dart-sync.md). Live-only: [dart-sdk.md](dart-sdk.md).

## Rust / Python

Issue SQL with `kalam-client` / `from kalamdb import KalamClient`. Keep USER isolation on the server. No generated ORM in those SDKs today.

```python
from kalamdb import Auth, KalamClient

async with KalamClient(url, Auth.basic("admin", "password")) as client:
    rows = await client.query_rows("SELECT * FROM app.messages LIMIT 20")
```

Shared tables still need `CREATE POLICY` — the Python/Rust clients do not add a policy layer.
