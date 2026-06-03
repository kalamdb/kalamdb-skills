# Integrations

Use this file when connecting KalamDB to apps, agents, workers, PostgreSQL, React, Flutter, browser clients, or AI workflows.

## Integration Surfaces

- Browser apps: `@kalamdb/client`, `@kalamdb/react`, Admin UI, WebSocket live rows
- Node services: `@kalamdb/client`, `@kalamdb/orm`
- Topic workers and agents: `@kalamdb/consumer`
- Flutter/Dart apps: `kalam_link`
- PostgreSQL: `pg_kalam` FDW and gRPC bridge
- AI/chat examples: `examples/react-ai-chat`, `examples/chat-with-ai`, `examples/summarizer-agent`

## Integration Rules

- Preserve USER-table isolation; do not fake it with app-side filters.
- Use service accounts and `executeAsUser()` for workers acting on behalf of users.
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
- `link/sdks/dart/example/`
- `pg/local_test.sql`