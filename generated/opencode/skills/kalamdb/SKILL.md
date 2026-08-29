---
name: kalamdb
description: KalamDB router skill — open ONE targeted reference after routing. Covers CLI, Rust/Dart (kalam_sync Drift/SQLite)/TypeScript (Drizzle ORM), SQL, shared-table RLS, auth, ops, and PG extension.
license: Apache-2.0
compatibility: codex, claude-code, opencode, agent-skills
metadata:
  repo: KalamDB
  audience: contributors
  scope: router
---

# KalamDB

Router only. **Do not preload all references.**

## Token Discipline

1. Read this file first.
2. Open **one** reference from the task table.
3. Open a second file only when the task clearly spans areas (e.g. init + Dart SDK).
4. For method signatures and flags, open the listed `*-api.md` file — not the whole SDK tree.
5. Open **one** example file when you need copy-paste patterns.
6. Full file list: [references/INDEX.md](references/INDEX.md) (use only when unsure).

## Working Rules

- Prefer owning crate/abstraction; follow storage boundaries and `TableId` conventions.
- No SQL rewrite passes in hot paths.
- Update this skill when user-facing CLI, SQL, SDK, or runbook behavior changes.
- **Template-first:** for new apps, pick the closest `kalam init --template` scaffold and extend it — do not build equivalent boilerplate from scratch when a template exists. Chat + agent apps: `--template chat-with-ai` or `react-ai-chat`. Catalog: [cli-templates.md](references/cli-templates.md).
- **Schema-first:** for app work, edit `schema.sql` before writing app/domain code, run generation, and treat generated SDK/ORM types as source of truth. Do not hand-write duplicate row models first.
- **USER vs SHARED:** default to `CREATE USER TABLE` for private data (no `CREATE POLICY`, no fake `user_id`). Use `CREATE SHARED TABLE` only when several principals must see the same rows, and add `CREATE POLICY` in the same change. There is no `ACCESS_LEVEL`. Details: [rls-policies.md](references/rls-policies.md).
- **AI assistant chat:** always include visible thinking/typing and frontend token streaming. Use direct `CREATE USER TABLE` for conversation/message rows, direct `CREATE STREAM TABLE` for token rows, and a topic/source from user message inserts for the agent. Do not add an app `users` table or fake `user_id` tenancy columns for authenticated USER-table data; KalamDB auth already supplies the user identity.
- PostgreSQL extension and PostgreSQL wire sessions use the shared backend session manager; HTTP SQL remains request-scoped. Do not add transport-specific transaction authorities or duplicate metadata stores for client catalog compatibility.

## Task Router

| Task | Reference | API detail | Example |
|------|-----------|------------|---------|
| New project / `kalam init` | [cli-init.md](references/cli-init.md) + [cli-templates.md](references/cli-templates.md) | — | [cli-templates.md](examples/cli-templates.md) |
| Local dev / `kalam dev` | [cli-dev.md](references/cli-dev.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| Full-stack React + agent | [cli-templates.md](references/cli-templates.md) + [cli-dev.md](references/cli-dev.md) | — | [full-stack-react-agent.md](examples/full-stack-react-agent.md) |
| Migrations, link, status | [cli-lifecycle.md](references/cli-lifecycle.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| `kalam.toml` config | [kalam-toml.md](references/kalam-toml.md) | — | [kalam.toml](examples/kalam.toml) |
| SQL shell, `kalam login`, flags | [cli.md](references/cli.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| Rust app / `kalam-client` | [rust-sdk.md](references/rust-sdk.md) | [rust-sdk-api.md](references/rust-sdk-api.md) | [rust-sdk.md](examples/rust-sdk.md) |
| Flutter / Dart / `kalam_link` (no cache) | [dart-sdk.md](references/dart-sdk.md) | [dart-sdk-api.md](references/dart-sdk-api.md) | [dart-sdk.md](examples/dart-sdk.md) |
| Flutter local-first / `kalam_sync` (Drift + SQLite) | [dart-sync.md](references/dart-sync.md) | [dart-sync-api.md](references/dart-sync-api.md) | [dart-sync.md](examples/dart-sync.md) |
| Which ORM (Drizzle vs Drift vs none) | [orms.md](references/orms.md) | — | [typescript-orm.md](examples/typescript-orm.md) / [dart-sync.md](examples/dart-sync.md) |
| Python client (no ORM) | [orms.md](references/orms.md) | — | — |
| TypeScript ORM / Drizzle | [typescript-orm.md](references/typescript-orm.md) | — | [typescript-orm.md](examples/typescript-orm.md) |
| TypeScript client | [typescript-client-sdk.md](references/typescript-client-sdk.md) | [typescript-client-api.md](references/typescript-client-api.md) | [typescript-client.md](examples/typescript-client.md) |
| TypeScript FILE columns | [typescript-files.md](references/typescript-files.md) | — | [typescript-files.md](examples/typescript-files.md) |
| TypeScript React live UI | [typescript-react.md](references/typescript-react.md) | — | [typescript-react.md](examples/typescript-react.md) |
| Topic workers (TS) | [typescript-consumer.md](references/typescript-consumer.md) | — | [typescript-consumer.md](examples/typescript-consumer.md) |
| SQL syntax / DDL | [sql-syntax.md](references/sql-syntax.md) | — | [sql-patterns.md](examples/sql-patterns.md) |
| Shared tables / `CREATE POLICY` / RLS | [rls-policies.md](references/rls-policies.md) | — | [sql-patterns.md](examples/sql-patterns.md) |
| Auth / RBAC / JWT | [auth.md](references/auth.md) | — | — |
| Server `server.toml` | [server-configuration.md](references/server-configuration.md) | — | [server-configuration.toml](examples/server-configuration.toml) |
| REST / WebSocket protocol | [api-websocket.md](references/api-websocket.md) | — | — |
| Architecture / crate map | [architecture.md](references/architecture.md) | — | — |
| Ops / cluster | [operations.md](references/operations.md) | — | — |
| PostgreSQL extension | [pg-extension.md](references/pg-extension.md) | — | [pg-extension.md](examples/pg-extension.md) |
| PostgreSQL wire / client catalog / `pg_catalog` | [server-configuration.md](references/server-configuration.md) + [architecture.md](references/architecture.md) | — | — |
| Tests / benchmarks | [testing.md](references/testing.md) | — | — |
| Debugging | [troubleshooting.md](references/troubleshooting.md) | — | — |
| Choosing integration surface | [integrations.md](references/integrations.md) | — | — |
| Repo change checklist | — | — | [agent-change-checklist.md](examples/agent-change-checklist.md) |

## Quick Commands

Preferred coding-agent workflow:

```bash
kalam init --list-templates --json
kalam init --yes --template <id> --languages typescript --package-manager npm
kalam dev start --agent
kalam -c "<SQL>" --json --url http://127.0.0.1:2900 --user root --password kalamdb123
```

Do not guess template ids. `--list-templates --json` is the catalog. Next command is in the `next` field.

`chat-with-ai` = multi-user rooms (SHARED + `CREATE POLICY`). `react-ai-chat` = personal assistant (USER + STREAM). `simple-live` = minimal Node/Flutter demo.

Inspect live schema with `information_schema` rather than inferring it from generated code.

```bash
cd backend && cargo run --bin kalamdb-server
cd cli && cargo build --release && cargo test --test smoke
cargo nextest run
```

New app: `kalam init --list-templates --json` → pick id → `kalam init --yes --template <id> ...` → `kalam dev start --agent`. Extend the scaffold; avoid rebuilding from scratch.

## Repo-Local Deep Skills

For internals after routing: `mvcc`, `raft`, `datafusion`, `rust-skills` in the main KalamDB repo.
