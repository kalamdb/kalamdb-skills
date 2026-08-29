# CLI Lifecycle

Schema, migrations, environments, status. Pair with [cli-init.md](cli-init.md) / [cli-dev.md](cli-dev.md). Full config: [kalam-toml.md](kalam-toml.md).

## Mental Model

- Workflow commands need `kalam.toml`; secrets in `~/.kalam/` (`dev` → `kalam-dev`, `prod` → `kalam-prod`).
- Env resolution: CLI flag → `KALAM_ENV`/`KALAM_URL`/`KALAM_NAMESPACE` → `kalam.toml` → `dev`.

## Commands

| Command | Purpose |
|---------|---------|
| `kalam link --env --url --namespace` | Add/update environment (both url + namespace required) |
| `kalam schema gen [--languages]` | Generate TS/Dart artifacts |
| `kalam schema pull` | Placeholder — not fully implemented |
| `kalam migration create <name>` | Ordered migration from schema diff |
| `kalam migration status [--env]` | Pending/applied/failed on server |
| `kalam migration seal` | Numbered migration from `_draft.sql` (rename only) |
| `kalam migration retry <id>` | Re-queue failed migration |
| `kalam migration repair <id> --mark-applied` | Manual state repair |
| `kalam db migrate [--env]` | Apply pending numbered migrations |
| `kalam db reset [--env] [--yes]` | Clear local `kalam/server` + baseline; drop namespace on server when safe/confirmed |
| `kalam status [--env] [--namespace]` | Resolved project/env status |
| `kalam deploy --env` | **Not supported yet** — use `kalam db migrate` + own rollout |

## Lifecycles

**New local app:** `kalam init --list-templates --json` → `kalam init --template <id>` → edit `schema.sql` → `kalam dev start --agent`

**Full-stack React + agent:** `--template chat-with-ai` (SHARED rooms) or `react-ai-chat` (USER assistant) → `kalam dev start --agent` (manual delta: [full-stack-react-agent.md](../examples/full-stack-react-agent.md))

**Schema change:** edit `schema.sql` → `kalam schema gen` → `kalam migration create <name>` → `kalam db migrate` (or let `kalam dev` watch)

**Prod promotion:** `kalam link --env prod ...` → seal migrations → `kalam db migrate --env prod` → your rollout (deploy command not available yet)

## `kalam db reset`

Clears local dev project files and can drop the linked namespace on the server so migrations re-apply cleanly.

```bash
kalam db reset
kalam db reset --yes   # skip confirmation for remote/reused server
kalam dev
```

**Removes locally (when present):** entire `kalam/server/` directory and `kalam/.schema-baseline.sql`.

**Keeps:** `kalam/migrations/` SQL files on disk.

**Namespace drop** (when the linked server is reachable):

| Server | Drop namespace? |
|--------|-----------------|
| This project's `kalam/server` on localhost (existed before reset) | Yes — automatic |
| Another server on localhost (reused `:2900`, no local `kalam/server`) | Prompt (default No); use `--yes` |
| Remote (non-loopback) URL | Prompt (default No); use `--yes` |

`DROP NAMESPACE ... CASCADE` clears tables and server-side migration history for that namespace (including failed records in `system.migrations`).

If reset skips the namespace drop (declined prompt or non-interactive without `--yes`), the next `kalam dev` may still report `migration failed previously` until you run `kalam db reset --yes` or repair manually.

Stop `kalam dev` before reset when deleting `kalam/server/` so RocksDB files are not locked.

## v1 Limitations

- `schema pull` placeholder
- `kalam deploy` returns "not supported yet"
- `remote` schema mode incomplete at init

## Agent Rules

- Commit migration files with schema changes.
- Use `kalam status` before prod migrate/debug.
- Dart `kalam schema gen` writes `KalamTableSpec` row codecs from `schema.sql` (no live server). Action codegen stays with `kalam_sync_generator`.
- Do not reference `kalam deploy` as available.
