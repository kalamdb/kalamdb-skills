# `kalam dev`

Long-running local dev orchestrator. Blocks until `Ctrl+C`. Requires `kalam.toml`.

Sources: `cli/DEV.md`, `cli/src/workflow/dev/orchestrator.rs`.

## Flags

| Flag | Purpose |
|------|---------|
| `--project-dir` | Project root |
| `--env` | Target env (default from `[project].default_env`) |
| `--namespace` | Override namespace |
| `--force` | Skip draft prompts; retry paused schema pipeline once at startup |
| `--progress` | Deprecated — ignored |

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
kalam dev --force
kalam dev --env prod   # caution: prod-linked config
```

## Agent Rules

- Prefer `kalam dev` over manual server + watchers after init.
- Do not hand-edit `src/generated/` or `lib/generated/`; let watch or `kalam schema gen` refresh.
- Config: [kalam-toml.md](kalam-toml.md). Migrations: [cli-lifecycle.md](cli-lifecycle.md).

## Errors

| Error | Fix |
|-------|-----|
| `kalamdb-server not found` | Install binary or `KALAMDB_SERVER_BIN` |
| `schema pipeline paused` | Fix error, then `kalam dev --force` |
| `migration failed previously` after reset | Namespace not dropped — run `kalam db reset --yes` or `kalam migration retry` |
| Empty `[dev.processes].*` command | Fix command in `kalam.toml` |
