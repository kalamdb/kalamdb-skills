---
name: kalamdb
description: Comprehensive KalamDB guidance for architecture, operations, CLI, auth, performance, TypeScript client/ORM/consumer SDKs, Dart SDK, PostgreSQL extension, SQL syntax, server.toml configuration, API/WebSocket, integrations, testing, and troubleshooting. Use when working anywhere in KalamDB or when you need the correct build, run, test, query, config, or extension path.
license: Apache-2.0
compatibility: codex, claude-code, opencode, agent-skills
metadata:
  repo: KalamDB
  audience: contributors
  scope: architecture-operations-cli-auth-performance-typescript-dart-pg-sql-config-api-integrations-testing
---

# KalamDB

Use this skill whenever the task touches KalamDB behavior, contributor workflow, or repository conventions.

## Working Rules

- Treat repository performance constraints as first-class requirements.
- Prefer the owning crate or abstraction instead of spreading behavior across layers.
- Follow AppContext-first, type-safe wrapper, and storage-boundary rules.
- Do not add SQL rewrite passes in hot paths.
- Update the skill whenever KalamDB changes user-facing commands, syntax, SDK entry points, or runbooks.

## Route To The Right Reference

- Architecture and crate ownership: [references/architecture.md](references/architecture.md)
- Operations and cluster workflows: [references/operations.md](references/operations.md)
- Server runtime configuration: [references/server-configuration.md](references/server-configuration.md)
- CLI commands and workflows: [references/cli.md](references/cli.md)
- Auth and authorization: [references/auth.md](references/auth.md)
- Performance and security guardrails: [references/performance.md](references/performance.md)
- TypeScript client SDK: [references/typescript-client-sdk.md](references/typescript-client-sdk.md)
- TypeScript ORM: [references/typescript-orm.md](references/typescript-orm.md)
- TypeScript consumer runtime: [references/typescript-consumer.md](references/typescript-consumer.md)
- Dart SDK: [references/dart-sdk.md](references/dart-sdk.md)
- PostgreSQL extension: [references/pg-extension.md](references/pg-extension.md)
- SQL syntax: [references/sql-syntax.md](references/sql-syntax.md)
- REST and WebSocket APIs: [references/api-websocket.md](references/api-websocket.md)
- Integrations and examples: [references/integrations.md](references/integrations.md)
- Testing and benchmarks: [references/testing.md](references/testing.md)
- Troubleshooting: [references/troubleshooting.md](references/troubleshooting.md)

## Examples To Imitate

- CLI workflows: [examples/cli-workflows.md](examples/cli-workflows.md)
- SQL patterns: [examples/sql-patterns.md](examples/sql-patterns.md)
- TypeScript client: [examples/typescript-client.md](examples/typescript-client.md)
- TypeScript ORM: [examples/typescript-orm.md](examples/typescript-orm.md)
- TypeScript consumer: [examples/typescript-consumer.md](examples/typescript-consumer.md)
- Dart SDK: [examples/dart-sdk.md](examples/dart-sdk.md)
- PostgreSQL extension: [examples/pg-extension.md](examples/pg-extension.md)
- Server config template: [examples/server-configuration.toml](examples/server-configuration.toml)
- Change checklist: [examples/agent-change-checklist.md](examples/agent-change-checklist.md)

## Quick Commands

From the KalamDB repo root:

```bash
cd backend && cargo run --bin kalamdb-server
cd backend && cargo build --release --no-default-features --features embedded-ui,mimalloc  # dashboard metrics without traceability
cd cli && cargo build --release
cd cli && cargo test --test smoke
cargo nextest run
./scripts/test-all.sh
cd benchv2 && ./run-benchmarks.sh
cd pg && cargo build
```

## Companion Skills In The Main KalamDB Repo

When installed alongside the main repo, also consult the repo-local skills for deeper internals:

- `datafusion`
- `mvcc`
- `raft`
- `rust-skills`

Use those for subsystem-specific deep dives after this skill has routed the task to the correct slice.
