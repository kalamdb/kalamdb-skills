# CLI Lifecycle

Schema, migrations, environments, deploy. Pair with [cli-init.md](cli-init.md) / [cli-dev.md](cli-dev.md).

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
| `kalam migration status` | Pending/applied (local state) |
| `kalam migration seal` | Numbered migration from `_draft.sql` |
| `kalam db migrate` | Apply pending (v1: local tracking, not remote SQL exec) |
| `kalam status [--env]` | Resolved project/env status |
| `kalam deploy --env` | Guardrails + migrate + health `GET {url}/ui` |

## Lifecycles

**New local app:** `kalam init` → edit `schema.sql` → `kalam dev`

**Schema change:** edit `schema.sql` → `kalam schema gen` → `kalam migration create <name>` → `kalam db migrate` (or let `kalam dev` watch)

**Prod promotion:** `kalam link --env prod ...` → migration → `kalam status --env prod` → `kalam deploy --env prod`

## `kalam.toml` Sketch

```toml
[project]
name = "my-app"
default_env = "dev"

[connection.dev]
url = "http://localhost:2900"
namespace = "my-app"

[schema]
mode = "sql"
path = "schema.sql"
watch = true
languages = ["typescript", "dart"]

[migrations]
dir = "kalam/migrations"
auto_create = true

[dev]
auto_start_db = true
apply_schema = true
generate_types = true
watch = true

[dev.processes]
frontend = "pnpm dev"
```

## v1 Limitations

- `schema pull` placeholder; `db migrate` local-only; `deploy` guarded wrapper not full rollout; `remote` schema mode incomplete.

## Deploy Guardrails

Blocked when pending migrations or prod-like env (`prod`/`production`/`staging`) has schema drift without committed migrations.

## Agent Rules

- Commit migration files with schema changes.
- Use `kalam status` before deploy/debug.
- Dart `kalam schema gen` is placeholder output today.
