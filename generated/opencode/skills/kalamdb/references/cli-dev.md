# `kalam dev`

Long-running local dev orchestrator. Blocks until `Ctrl+C`. Requires `kalam.toml`.

Sources: `cli/DEV.md`, `cli/src/workflow/dev/orchestrator.rs`.

## Flags

| Flag | Purpose |
|------|---------|
| `--project-dir` | Project root |
| `--env` | Target env (default `dev`) |
| `--namespace` | Override namespace |
| `--force` | Retry paused schema pipeline once at startup |

## Behavior

1. Resolve environment (`flag` → `KALAM_*` env → `kalam.toml` → `dev`)
2. Start/reuse local server if `dev.auto_start_db = true`
3. Run schema pipeline if `dev.apply_schema` or `dev.generate_types`
4. Start `[dev.processes]` commands
5. Watch `schema.sql` if enabled
6. Stream prefixed, colorized process logs
7. Shutdown children on exit

## Server Modes

**Local** (`auto_start_db = true`): reuse healthy URL or start `kalamdb-server` via `.kalam/server.toml`. Needs `kalamdb-server` on `PATH` or `KALAMDB_SERVER_BIN`. Data: `.kalam/data`.

**Remote** (`auto_start_db = false`): never starts server; uses linked URL.

## Schema Pipeline

Runs `kalam db migrate` + `kalam schema gen` + baseline update. On failure: pipeline pauses only; processes keep running. Retry: `kalam dev --force`. May prompt on `kalam/migrations/_draft.sql`.

## Examples

```bash
cd my-app && kalam dev
kalam dev --force
kalam dev --env prod   # caution: prod-linked config
```

## Agent Rules

- Prefer `kalam dev` over manual server + watchers after init.
- Do not hand-edit `src/generated/` or `lib/generated/`; let watch or `kalam schema gen` refresh.
- Migrations/deploy: [cli-lifecycle.md](cli-lifecycle.md). Init: [cli-init.md](cli-init.md).

## Errors

| Error | Fix |
|-------|-----|
| `kalamdb-server not found` | Install binary or `KALAMDB_SERVER_BIN` |
| `schema pipeline paused` | Fix error, then `kalam dev --force` |
