# `kalam.toml` Reference

Project configuration for workflow commands (`kalam init`, `kalam dev`, `kalam migration`, `kalam schema`, `kalam db`, `kalam status`, `kalam link`). Secrets belong in `~/.kalam/` — not in this file.

Sources: `cli/src/workflow/project/config.rs`, `cli/templates/scaffold/default/kalam.toml.template`.

## Project layout

```text
my-app/
├── kalam.toml
├── schema.sql
├── .env / .env.example
├── kalam/
│   ├── migrations/           # default; override with project.kalam_dir
│   ├── .schema-baseline.sql
│   ├── .gitignore
│   ├── cli/logs/kalam.log    # workflow log when [logging].file = true
│   └── server/
│       ├── server.toml       # local server config (local mode)
│       ├── data/
│       └── logs/
├── src/generated/kalam.ts    # when TypeScript enabled
└── lib/generated/kalam.dart  # when Dart enabled
```

`project.kalam_dir` (default `kalam`) relocates the whole `kalam/` tree.

## Full example

```toml
[project]
name = "my-app"
default_env = "dev"
package_manager = "pnpm"   # TypeScript only: npm | pnpm | yarn | bun

[connection.dev]
url = "http://localhost:2900"
namespace = "my_app"

[connection.prod]
url = "https://db.example.com"
namespace = "my_app"

[schema]
mode = "sql"                 # sql | remote (remote init rejected today)
path = "schema.sql"
watch = true
languages = ["typescript", "dart"]

[schema.targets.typescript]
output = "src/generated/kalam.ts"

[schema.targets.dart]
output = "lib/generated/kalam.dart"

[migrations]
auto_create = true           # dir defaults to kalam/migrations (internal)

[dev]
auto_start_db = true         # false for remote-only projects
apply_schema = true
generate_types = true
watch = true

# Commands start automatically with `kalam dev`. Log prefix = key name ([app], [worker], …).
[dev.processes]
app = "pnpm dev"
worker = "cargo run --bin worker"

[logging]
file = true
capture_process_output = true  # path defaults to kalam/cli/logs/kalam.log (internal)
```

## Section reference

### `[project]`

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | yes | — | Project name |
| `default_env` | no | `dev` | Default environment for workflow commands |
| `package_manager` | no | — | `npm`, `pnpm`, `yarn`, or `bun` — set by `kalam init` when TypeScript is selected |
| `kalam_dir` | no | `kalam` | Relative path for migrations, server config, CLI logs, baselines |

### `[connection.<env>]`

| Field | Required | Description |
|-------|----------|-------------|
| `url` | yes | KalamDB HTTP URL for this environment |
| `namespace` | yes | Namespace id (normalized from project name at init) |

Add environments with `kalam link --env <name> --url <url> --namespace <ns>`.

### `[schema]`

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `mode` | yes | — | `sql` (local file) or `remote` |
| `path` | when `mode = "sql"` | — | Schema source file (usually `schema.sql`) |
| `watch` | no | `true` | Allow file-based schema watch (with `[dev].watch`) |
| `languages` | no | `["typescript"]` | Codegen targets: `typescript`, `dart` (`flutter` is accepted as an alias for `dart`) |

Each language in `languages` requires `[schema.targets.<language>].output`.

### `[schema.targets.<language>]`

| Field | Required | Description |
|-------|----------|-------------|
| `output` | yes | Generated artifact path (must be unique per language) |

### `[migrations]`

| Field | Default | Description |
|-------|---------|-------------|
| `auto_create` | `true` | Auto-maintain `_draft.sql` from schema diffs |
| `dir` | `kalam/migrations` | Internal; usually omitted from written `kalam.toml` |

### `[dev]`

| Field | Default | Description |
|-------|---------|-------------|
| `auto_start_db` | `true` | Start/reuse local `kalamdb-server` (`false` = remote URL only) |
| `apply_schema` | `true` | Run migration pipeline on startup and watch ticks |
| `generate_types` | `true` | Run `kalam schema gen` after schema apply |
| `watch` | `true` | Dev-side schema polling (requires `[schema].watch = true`) |

### `[dev.processes]`

Map of **process name → shell command**. Names become log prefixes (`[app]`, `[frontend]`, …).

| Behavior | Detail |
|----------|--------|
| Execution | Commands run from project root via system shell |
| Init default | TypeScript init writes `app = "<pm> dev"` (`npm run dev`, `pnpm dev`, `yarn dev`, `bun run dev`) |
| Dart-only | Init writes `app = "flutter run"`; `package_manager` is omitted |
| Multiple processes | Add any number of keys |
| Empty command | Validation error at `kalam dev` startup |

### `[logging]`

| Field | Default | Description |
|-------|---------|-------------|
| `file` | `true` | Append workflow + process logs to disk |
| `capture_process_output` | `true` | Mirror managed process stdout/stderr to log file |
| `path` | `kalam/cli/logs/kalam.log` | Internal; usually omitted from written `kalam.toml` |

## Log prefixes during `kalam dev`

| Prefix | Source |
|--------|--------|
| `[cli]` | Workflow status and CLI messages |
| `[server]` | Local `kalamdb-server` stdout/stderr |
| `[<process-key>]` | Each `[dev.processes]` entry |

## Environment resolution

Workflow commands resolve (first match wins):

| Setting | Order |
|---------|-------|
| Environment name | `--env` → `KALAM_ENV` → `[project].default_env` → `dev` |
| URL | `KALAM_URL` → `[connection.<env>].url` |
| Namespace | `--namespace` → `KALAM_NAMESPACE` → `[connection.<env>].namespace` |

Credentials: profile `kalam-<env>` in `~/.kalam/` (`.env` sets `KALAM_PROFILE=kalam-dev` after init).

## Validation rules

- `project.name` must be non-empty
- `project.kalam_dir` must be a relative in-project path
- `schema.path` required when `mode = "sql"`
- Each `languages` entry needs matching `[schema.targets.<lang>]`
- Target output paths must be unique
- Unknown `package_manager` values rejected

## Related

- Commands: [cli-init.md](cli-init.md), [cli-dev.md](cli-dev.md), [cli-lifecycle.md](cli-lifecycle.md)
- Example file: [kalam.toml](../examples/kalam.toml)
