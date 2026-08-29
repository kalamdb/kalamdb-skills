# `kalam dev`

Long-running local dev orchestrator. Blocks until `Ctrl+C`. Requires `kalam.toml`.

Sources: `cli/DEV.md`, `cli/src/workflow/dev/orchestrator.rs`.

## Agent Mode

```bash
kalam dev --agent
```

Runs the local KalamDB development environment in deterministic, non-interactive mode optimized for AI coding agents and automation.

`--agent` never waits for stdin. It auto-downloads a missing compatible server, reuses a healthy server before resolving a local binary, auto-applies ordinary `schema.sql` changes, and prints compact `KALAM_*` events. Destructive changes return `KALAM_ERROR code=DESTRUCTIVE_SCHEMA_CHANGE` unless `--force` is also passed.

Preferred agent workflow: `kalam init --list-templates --json` → `kalam init --yes --template <id> ...` → `kalam dev start --agent` → `kalam -c "<SQL>" --json --url http://127.0.0.1:2900 --user root --password kalamdb123`.

## Flags

| Flag | Purpose |
|------|---------|
| `--project-dir` | Project root |
| `--env` | Target env (default from `[project].default_env`) |
| `--namespace` | Override namespace |
| `--force` | Skip draft prompts in human mode; allow destructive apply in `--agent` |
| `--agent` | Deterministic non-interactive agent/automation mode |
| `--progress` | Deprecated — ignored |

## Background session

```bash
kalam dev start --agent
kalam dev status
kalam dev logs [--follow|-F] [--lines|-n N]
kalam dev stop
```

Foreground `kalam dev` is unchanged. `start` spawns a detached `kalam dev --agent` child (never recursive `dev start`), waits for `KALAM_READY`, and writes `kalam/cli/dev.session.json`. It reuses a live session instead of starting a second one. `status`/`stop` are idempotent. This is a PID/session file, not a machine-wide daemon.

Ready/error scanning uses only the **current** start: the CLI writes `--- kalam dev start ---` and ignores older `KALAM_ERROR` / `KALAM_READY` lines above that marker. Do not truncate the log by hand; retry `kalam dev start --agent`.

Compact events: `KALAM_DEV_STARTED`, `KALAM_DEV_REUSED`, `KALAM_DEV_STATUS`, `KALAM_DEV_STOPPED`, plus foreground `KALAM_READY`, `KALAM_SERVER_REUSED`, `KALAM_SCHEMA_APPLIED`, and `KALAM_APP_STARTED`. Startup failures may surface the child's `KALAM_ERROR` or `DEV_START_FAILED`. Logs live at `kalam/cli/logs/kalam.log`.

## Behavior

1. Resolve environment (`flag` → `KALAM_*` env → `kalam.toml` → `dev`)
2. Prechecks (schema source, target dirs, auth, server binary)
3. Start/reuse local server if `dev.auto_start_db = true`
4. Run schema pipeline if `dev.apply_schema` or `dev.generate_types`
5. Start `[dev.processes]` commands
6. Watch `schema.sql` when `[dev].watch` and `[schema].watch` are true
7. Stream prefixed logs; shutdown children on exit

## Server Modes

**Local** (`auto_start_db = true`): reuse healthy URL or start `kalamdb-server` with `kalam/server/server.toml`. Needs `kalamdb-server` on `PATH`, `KALAMDB_SERVER_BIN`, or managed download to `~/.kalam/bin`. Data: `kalam/server/data`.

When `kalam dev` **reuses** an existing server on localhost (no `kalam/server` in the project), `kalam db reset` still clears local files but **prompts** before dropping the namespace on that server. Use `kalam db reset --yes` to confirm, or in non-interactive shells.

**Remote** (`auto_start_db = false`): never starts server; uses linked URL. `kalam db reset` prompts before dropping the namespace on a remote URL unless `--yes` is passed.

## `[dev.processes]`

Map of name → shell command. TypeScript init writes `app = "<pm> dev"` by default. Add more keys for agents and workers — for example `agent = "pnpm agent"` for a `@kalamdb/consumer` process running beside a React app. Log prefix = key name (`[app]`, `[agent]`, …) vs `[cli]` and `[server]`.

Full-stack React + agent setup: [full-stack-react-agent.md](../examples/full-stack-react-agent.md).

## Schema Pipeline

Runs migrations + `kalam schema gen` + baseline update. On failure: pipeline pauses only; processes keep running. Retry: `kalam dev --force`. May prompt on `kalam/migrations/_draft.sql`.

## Examples

```bash
cd my-app && kalam dev
kalam dev --agent
kalam dev --force
kalam dev start --agent
kalam dev --env prod   # caution: prod-linked config
```

## Agent Rules

- Prefer `kalam dev --agent` or `kalam dev start --agent` over interactive `kalam dev` from coding-agent shells.
- Do not hand-edit `src/generated/` or `lib/generated/`; let watch or `kalam schema gen` refresh.
- Config: [kalam-toml.md](kalam-toml.md). Migrations: [cli-lifecycle.md](cli-lifecycle.md).

## Errors

| Error | Fix |
|-------|-----|
| `kalamdb-server not found` / `SERVER_BINARY_MISSING` | Install binary, set `KALAMDB_SERVER_BIN`, or use `kalam dev --agent` to auto-download |
| `KALAM_ERROR code=DESTRUCTIVE_SCHEMA_CHANGE` | Rerun `kalam dev --force` only if you intend to rebuild development data |
| `KALAM_ERROR code=DEV_START_FAILED` | Inspect `kalam dev logs`; retry `kalam dev start --agent` |
| `KALAM_ERROR code=AUTH_REQUIRED` | `kalam login` for the reported profile |
| `KALAM_ERROR code=PORT_IN_USE` | Stop the other listener or init with `--server-url http://localhost:2933` |
| `KALAM_ERROR code=SERVER_DOWNLOAD_FAILED` | Check network or set `KALAMDB_SERVER_BIN` |
| `KALAM_ERROR code=MIGRATION_FAILED` / `SCHEMA_FAILED` | Fix `schema.sql` or the failed migration, then retry `kalam dev --agent` |
| `schema pipeline paused` | Fix error, then `kalam dev --force` |
| `migration failed previously` after reset | Namespace not dropped — run `kalam db reset --yes` or `kalam migration retry` |
| Empty `[dev.processes].*` command | Fix command in `kalam.toml` |
