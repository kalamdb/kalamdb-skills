---
name: kalamdb
description: KalamDB router skill — open ONE targeted reference after routing. Covers CLI (kalam init/dev), Rust/Dart/TypeScript SDKs, SQL, auth, ops, PG extension. Use for KalamDB contributor or app integration work.
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

## Task Router

| Task | Reference | API detail | Example |
|------|-----------|------------|---------|
| New project / `kalam init` | [cli-init.md](references/cli-init.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| Local dev / `kalam dev` | [cli-dev.md](references/cli-dev.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| Migrations, deploy, `kalam.toml` | [cli-lifecycle.md](references/cli-lifecycle.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| SQL shell, `kalam login`, flags | [cli.md](references/cli.md) | — | [cli-workflows.md](examples/cli-workflows.md) |
| Rust app / `kalam-client` | [rust-sdk.md](references/rust-sdk.md) | [rust-sdk-api.md](references/rust-sdk-api.md) | [rust-sdk.md](examples/rust-sdk.md) |
| Flutter / Dart / `kalam_link` | [dart-sdk.md](references/dart-sdk.md) | [dart-sdk-api.md](references/dart-sdk-api.md) | [dart-sdk.md](examples/dart-sdk.md) |
| TypeScript client | [typescript-client-sdk.md](references/typescript-client-sdk.md) | [typescript-client-api.md](references/typescript-client-api.md) | [typescript-client.md](examples/typescript-client.md) |
| TypeScript FILE columns | [typescript-files.md](references/typescript-files.md) | — | [typescript-files.md](examples/typescript-files.md) |
| TypeScript ORM / schema gen | [typescript-orm.md](references/typescript-orm.md) | — | [typescript-orm.md](examples/typescript-orm.md) |
| TypeScript React live UI | [typescript-react.md](references/typescript-react.md) | — | [typescript-react.md](examples/typescript-react.md) |
| Topic workers (TS) | [typescript-consumer.md](references/typescript-consumer.md) | — | [typescript-consumer.md](examples/typescript-consumer.md) |
| SQL syntax / DDL | [sql-syntax.md](references/sql-syntax.md) | — | [sql-patterns.md](examples/sql-patterns.md) |
| Auth / RBAC / JWT | [auth.md](references/auth.md) | — | — |
| Server `server.toml` | [server-configuration.md](references/server-configuration.md) | — | [server-configuration.toml](examples/server-configuration.toml) |
| REST / WebSocket protocol | [api-websocket.md](references/api-websocket.md) | — | — |
| Architecture / crate map | [architecture.md](references/architecture.md) | — | — |
| Ops / cluster | [operations.md](references/operations.md) | — | — |
| PostgreSQL extension | [pg-extension.md](references/pg-extension.md) | — | [pg-extension.md](examples/pg-extension.md) |
| Tests / benchmarks | [testing.md](references/testing.md) | — | — |
| Debugging | [troubleshooting.md](references/troubleshooting.md) | — | — |
| Choosing integration surface | [integrations.md](references/integrations.md) | — | — |
| Repo change checklist | — | — | [agent-change-checklist.md](examples/agent-change-checklist.md) |

## Quick Commands

```bash
cd backend && cargo run --bin kalamdb-server
cd cli && cargo build --release && cargo test --test smoke
cargo nextest run
```

New app: `kalam init` → `kalam dev`. See [cli-init.md](references/cli-init.md).

## Repo-Local Deep Skills

For internals after routing: `mvcc`, `raft`, `datafusion`, `rust-skills` in the main KalamDB repo.
