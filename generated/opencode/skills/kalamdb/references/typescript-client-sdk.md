# TypeScript Client SDK

Use this file for `@kalamdb/client` work.

## Sources

- `link/sdks/typescript/client/`
- `link/sdks/typescript/client/README.md`
- `docs/sdk/sdk.md`

## Install

```bash
npm i @kalamdb/client
```

Runtime targets: Node.js 18+ and modern browsers.

## Owns

- `createClient()`
- `Auth.basic`, `Auth.jwt`, `Auth.none`
- SQL execution over HTTP
- FILE upload/download helpers
- materialized live rows through `live()` and `liveTable()`
- low-level `liveEvents()` raw protocol stream
- `executeAsUser()` for authorized USER/STREAM table delegation
- `SeqId` resume support

## Live Query Guidance

Prefer `live()` for app UI. It returns the current materialized row set and hides low-level protocol frames.

Use options intentionally:

- `batchSize`: server snapshot chunk size
- `lastRows`: initial rewind count
- `limit`: maximum client materialized row count
- `from`: resume from a `SeqId`
- `getKey`: row identity override when the query lacks an `id` column
- `onCheckpoint`: persist `lastSeqId`

Use `liveEvents()` only when the caller needs raw `subscription_ack`, `initial_data_batch`, `change`, and error frames.

## Tenant Boundary Rule

USER tables are scoped by authenticated user. Do not add app-side `WHERE user_id = ?` as a substitute for KalamDB isolation.

For service workers writing on behalf of a user, use `executeAsUser()` and only pass IDs authorized by the actor role.