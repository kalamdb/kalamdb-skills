# Architecture And Ownership

## Core Repository Rules

- Keep one model per file.
- Prefer `Arc<AppContext>` over passing loose fields through call stacks.
- Use `TableId` instead of passing namespace and table name separately when both are required.
- Use `EntityStore`, not the old `EntityStorev2` alias.
- Import shared types at the top of the file, not inside methods.
- Use type-safe enums and wrappers like `NamespaceId`, `TableId`, `UserId`, `Role`, and `TableType` instead of raw strings.

## Hot Ownership Boundaries

- `backend/crates/kalamdb-core`: orchestration, DDL/DML handlers, jobs, live query coordination
- `backend/crates/kalamdb-store`: RocksDB and key-value storage abstractions
- `backend/crates/kalamdb-filestore`: Parquet files, filesystem and object-store lifecycle logic
- `backend/crates/kalamdb-raft`: replication, leader election, snapshots, membership
- `backend/crates/kalamdb-session`: permission-aware session and provider boundaries
- `backend/crates/kalamdb-system`: system tables and metadata providers
- `backend/crates/kalamdb-tables`: shared/user/stream table providers

## Architecture Documents To Prefer

- `AGENTS.md`
- `docs/architecture/decisions/adr-003-storage-trait.md`
- `docs/architecture/decisions/adr-009-three-layer-architecture.md`
- `docs/architecture/decisions/adr-014-type-safe-wrappers.md`
- `docs/architecture/decisions/adr-018-transaction-architecture-and-postgres-bridge.md`
- `docs/architecture/raft-replication.md`
- `docs/architecture/transactions.md`
- `docs/architecture/job-system.md`
- `docs/architecture/websocket-server.md`

## Specialized Internal Domains

For deeper subsystem-specific work in the main KalamDB repo:

- Use the `datafusion` skill for SQL planning, logical and physical plan issues, and provider wiring.
- Use the `mvcc` skill for visibility rules, snapshots, and record versioning.
- Use the `raft` skill for replication, membership, and snapshot behavior.

## Architectural Guardrails

- Do not put filesystem or object-store details in `kalamdb-core`.
- Do not put RocksDB-specific logic outside `kalamdb-store` unless it is a store API boundary.
- Do not introduce SQL rewrite passes in hot execution paths.
- When behavior changes architecture, update architecture docs with the code change.