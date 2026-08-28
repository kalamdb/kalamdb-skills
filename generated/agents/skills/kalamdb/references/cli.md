# CLI

Use this file for `kalam` CLI command work, shell examples, smoke tests that use the CLI, credential handling, and schema watch flows.

## Sources

- `cli/README.md`
- `cli/DEV.md`
- `docs/getting-started/cli.md`
- `cli/src/args.rs`
- `cli/src/args/workflow.rs`
- `cli/src/commands/`
- `cli/src/workflow/`
- `cli/tests/`

## Install And Build

```bash
npm install -g @kalamdb/cli
curl -fsSL https://kalamdb.org/install.sh | sh
cd cli && cargo build --release
```

The source build binary is `cli/target/release/kalam`.

## Primary Commands

Interactive and one-shot SQL:

- `kalam` (interactive shell)
- `kalam update`
- `kalam version`
- `kalam doctor`
- `kalam login`
- `kalam logout`
- `kalam whoami`
- `kalam token create --name <name>`

Project workflow (require `kalam.toml`):

- `kalam init` — scaffold a new project
- `kalam dev` — local dev orchestration (server, schema pipeline, processes)
- `kalam link` — add/update environment entries
- `kalam schema gen` / `kalam schema pull`
- `kalam migration create` / `kalam migration status` / `kalam migration seal`
- `kalam db migrate`
- `kalam db reset [--yes]`
- `kalam status`
- `kalam deploy` — **not supported yet**

Project workflow (split for tokens): [cli-init.md](cli-init.md), [cli-dev.md](cli-dev.md), [cli-lifecycle.md](cli-lifecycle.md), [kalam-toml.md](kalam-toml.md).

## Important Flags

Connection and auth:

- `--url <url>`, `--host <host>`, `--port <port>`
- `--token <jwt>`
- `--user <user>`, `--password [password]`
- `--oidc`, `--no-browser`, `--brokered`
- `--instance <name>`
- `--save-credentials`

Execution:

- `--command <sql>`
- `--file <path>`
- `--subscribe <sql>`
- `--list-subscriptions`
- `--format table|json|csv`, `--json`, `--csv` — table format expands multi-line `EXPLAIN` plans to terminal width; JSON for full plan text
- timeout controls: `--timeout`, `--connection-timeout`, `--receive-timeout`, `--auth-timeout`, `--subscription-timeout`, `--initial-data-timeout`
- timeout presets: `--fast-timeouts`, `--relaxed-timeouts`

## Interactive Meta-Commands

- `\help` / `\?`
- `\quit` / `\q`
- `\info` / `\session`
- `\sessions`
- `\format <table|json|csv>`
- `\dt` / `\tables`
- `\d <table>` / `\describe <table>` — column list via `information_schema.columns` (Kalam `data_type`)
- `\format <table|json|csv>` — use `json` for full `EXPLAIN` plan strings
- `\as <user_id> <sql>`
- `\stats` / `\metrics`
- `\health`
- `\flush`
- `\export <namespace.table> [--user-id <id>] [--output <file.zip>]`
- `\import <namespace.table> <file.zip> [--user-id <id>]`
- `\refresh-tables` / `\refresh`
- `\live <sql>` / `\subscribe <sql>`
- credential commands: `\show-credentials`, `\update-credentials`, `\delete-credentials`
- `\cluster ...`

Table transfer notes:

- `\export` waits for job completion and downloads the resulting ZIP archive locally.
- `\import` uploads a ZIP archive and waits for the import job to complete.
- Backend infers table type from table metadata; no table type flag is required.
- For user tables, `--user-id` is required and the backend returns a validation error if missing.
- CLI progress indicators are shown during upload/download and while waiting for OIDC verification or query responses (unless `--no-spinner` is set).
- `kalam invite --email <email> --role <user|service|dba|system> [--expires-in-days 7]` creates a pending OIDC email invite through `CREATE USER INVITE`; it requires stored or supplied DBA/system credentials.

## Env Vars

- `KALAMDB_SERVER_URL`
- `KALAMDB_ROOT_PASSWORD`
- `KALAMDB_ADMIN_USER`

## OIDC Login

`kalam login --oidc` uses browser Authorization Code with PKCE and exchanges the callback code through KalamDB. `kalam login --oidc --no-browser` uses direct provider device flow when available, then exchanges the provider ID token through KalamDB. `--brokered` keeps the provider device code on the server and polls KalamDB. All successful OIDC modes should persist KalamDB access and refresh tokens. When `kalam login` is run from an interactive terminal, successful local and OIDC logins should continue straight into the SQL shell; non-interactive invocations should still exit after the login result so automation stays one-shot.

## Schema Watch

The ORM generator can be driven from CLI schema watching:

```bash
kalam --watch-schema --namespace app --run "npm run schema:gen" --run-on-start
kalam --watch-schema --table app.messages --run "npm run schema:gen"
```

Use `--interval 2s` or `--interval 500ms` for faster local loops.

## Quick Start: New Project

```bash
mkdir my-app && cd my-app
kalam init --yes
kalam dev --agent
# or, when a foreground process is inconvenient:
# kalam dev start --agent
# kalam dev status
# kalam -c "SELECT 1;" --json
# kalam dev stop
kalam -c "SELECT table_schema, table_name FROM information_schema.tables;" --json
```

## Database discovery

Prefer querying KalamDB when you need the current schema or state.

Use:

```bash
kalam -c "<SQL>" --json
```

Tables:

```sql
SELECT table_schema, table_name
FROM information_schema.tables;
```

Columns:

```sql
SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
ORDER BY table_schema, table_name, ordinal_position;
```

Do not infer the current database schema solely from generated application code if the live database is available. Prefer `LIMIT`, `WHERE`, `COUNT`, and `EXISTS` instead of dumping large tables.

Non-interactive (CI/agents):

```bash
kalam init --yes --name my-app --schema-mode sql --languages typescript --server-mode local
kalam dev --agent
```

See [cli-init.md](cli-init.md) / [cli-dev.md](cli-dev.md) / [cli-lifecycle.md](cli-lifecycle.md) for workflow detail.
