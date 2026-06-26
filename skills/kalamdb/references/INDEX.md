# Reference Index

One-line map. Agents: pick **one** file from [SKILL.md](../SKILL.md) task router; use this only when the task spans multiple areas.

## CLI

| File | Open when |
|------|-----------|
| [cli.md](cli.md) | Interactive SQL shell, login, flags, env vars |
| [cli-init.md](cli-init.md) | `kalam init`, scaffolding, `--yes` automation |
| [cli-templates.md](cli-templates.md) | Built-in init templates — **pick before building from scratch** |
| [cli-dev.md](cli-dev.md) | `kalam dev`, local server, schema watch, processes |
| [cli-lifecycle.md](cli-lifecycle.md) | `kalam link`, schema gen, migrations, status |
| [kalam-toml.md](kalam-toml.md) | Full `kalam.toml` field reference |

## SDKs

| File | Open when |
|------|-----------|
| [rust-sdk.md](rust-sdk.md) | Rust install, features, patterns |
| [rust-sdk-api.md](rust-sdk-api.md) | `KalamLinkClient` method tables |
| [dart-sdk.md](dart-sdk.md) | Flutter boot rules, design notes |
| [dart-sdk-api.md](dart-sdk-api.md) | `KalamClient` method tables |
| [typescript-client-sdk.md](typescript-client-sdk.md) | `@kalamdb/client` overview, errors, live rules |
| [typescript-client-api.md](typescript-client-api.md) | `KalamDBClient` method tables |
| [typescript-files.md](typescript-files.md) | FILE upload/download, `queryWithFiles`, `KalamRow` |
| [typescript-orm.md](typescript-orm.md) | `@kalamdb/orm` |
| [typescript-react.md](typescript-react.md) | `@kalamdb/react` |
| [typescript-consumer.md](typescript-consumer.md) | `@kalamdb/consumer` |

## Server & Platform

| File | Open when |
|------|-----------|
| [architecture.md](architecture.md) | Crate ownership, boundaries |
| [operations.md](operations.md) | Cluster, ops runbooks |
| [server-configuration.md](server-configuration.md) | `server.toml` keys |
| [auth.md](auth.md) | JWT, RBAC, login flows |
| [sql-syntax.md](sql-syntax.md) | Kalam SQL dialect, upsert, `RETURNING` |
| [api-websocket.md](api-websocket.md) | HTTP/WS protocol |
| [pg-extension.md](pg-extension.md) | `pg_kalam` FDW |
| [performance.md](performance.md) | Perf/security guardrails |
| [testing.md](testing.md) | Test commands |
| [troubleshooting.md](troubleshooting.md) | Common failures |
| [integrations.md](integrations.md) | Pick TS/Rust/Dart/PG surface |
