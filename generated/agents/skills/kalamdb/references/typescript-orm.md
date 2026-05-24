# TypeScript ORM

Use this file for `@kalamdb/orm`, Drizzle integration, schema generation, custom columns, and typed live tables.

## Sources

- `link/sdks/typescript/orm/`
- `link/sdks/typescript/orm/README.md`

## Install

```bash
npm i @kalamdb/client @kalamdb/orm drizzle-orm
```

## Owns

- `kalamDriver(client)` for Drizzle `pg-proxy`
- `kTable.shared`, `kTable.user`, `kTable.stream`, `kTable.system`
- KalamDB-specific columns: `file()`, `bytes()`, `embedding()`
- `liveTable()`
- `executeAsUser()` for compiled Drizzle builders
- `kalamdb-orm` schema generator

## Schema Generation

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

## Type Mapping Highlights

- `BIGINT` defaults to string to preserve Int64 precision.
- `TIMESTAMP`, `DATE`, and `TIME` normalize for Drizzle temporal columns.
- `FILE` maps to `FileRef | null`.
- `BYTES` maps to `Uint8Array | null`.
- `EMBEDDING(n)` maps to `number[] | null`.

Use generated schema types directly in React and consumer workers when sharing domain tables.