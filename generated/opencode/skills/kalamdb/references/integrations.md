# Integrations

Use this file when connecting KalamDB to apps, agents, workers, PostgreSQL, React, Flutter, browser clients, or AI workflows.

## Full-Stack React + Agent (recommended path)

1. Pick template — [cli-templates.md](cli-templates.md) → `kalam init --yes --template chat-with-ai` (or `react-ai-chat`)
2. Extend scaffold — edit `schema.sql`, app source, `[dev.processes]` as needed
3. `kalam dev --agent` — one command for server, schema auto-gen, and all managed processes

Do not hand-build project layout when a template already covers the stack. Manual fallback: [full-stack-react-agent.md](../examples/full-stack-react-agent.md).

## Integration Surfaces

- Browser apps: `@kalamdb/client`, `@kalamdb/react`, Admin UI, WebSocket live rows
- Node services: `@kalamdb/client`, `@kalamdb/orm`
- Rust services and workers: `kalam-client` (`KalamLinkClient`)
- Topic workers and agents: `@kalamdb/consumer` (TypeScript) or `kalam-client` with `consumer` feature (Rust). Shared topic sources still need `TO service` policies.
- Flutter/Dart: `kalam init --languages dart` then `kalam_sync` (`Kalam.open`, Drift + SQLite). Live SQL only: `kalam_link` (`KalamClient`). Custom actions: `kalam_sync_generator`. Typed-layer map: [orms.md](orms.md).
- Shared tables: `CREATE POLICY` — [rls-policies.md](rls-policies.md). Default new tables to `USER`. Mixed apps often pair `SHARED` rooms/tickets/orders with `USER` messages/notes/carts.
- PostgreSQL: `pg_kalam` FDW and gRPC bridge
- AI/chat examples: `examples/react-ai-chat`, `examples/chat-with-ai`, `examples/summarizer-agent`

## Integration Rules

- Preserve USER-table isolation; do not fake it with app-side filters.
- Use service accounts and `executeAsUser()` for workers acting on behalf of users.
- TypeScript: check `QueryResponse.status` on `query()`; for FILE uploads use `kalamFile()` with `@kalamdb/orm` or `queryWithFiles` + `FILE("key")` for raw SQL; read FILE columns via `queryRows` / `row.file()` (no `downloadFile()` helper). See [typescript-files.md](typescript-files.md).
- For browsers, prefer materialized live rows over raw events unless the app needs protocol-level frames.
- For browser frameworks, make sure `@kalamdb/client` is not prebundled away from its companion WASM asset, and verify that `.wasm` files are emitted and served as binaries rather than HTML fallbacks.
- For topic workers, ACK only after successful processing.
- For PostgreSQL, prefer `auth_mode 'account_login'` for session-based bridge auth.
- Keep SDK docs in the KalamSite repo aligned when SDK entry points change.

## Example Sources

- `examples/react-ai-chat/`
- `examples/chat-with-ai/`
- `examples/simple-typescript/`
- `examples/summarizer-agent/`
- `link/sdks/rust/examples/`
- `link/sdks/dart/example/`
- `link/sdks/dart/sync/example/`
- `pg/local_test.sql`