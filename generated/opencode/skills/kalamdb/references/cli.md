# CLI

Use this file for `kalam` CLI command work, shell examples, smoke tests that use the CLI, credential handling, and schema watch flows.

## Sources

- `cli/README.md`
- `docs/getting-started/cli.md`
- `cli/src/args.rs`
- `cli/src/commands/`
- `cli/tests/`

## Install And Build

```bash
npm install -g @kalamdb/cli
curl -fsSL https://kalamdb.org/install.sh | sh
cd cli && cargo build --release
```

The source build binary is `cli/target/release/kalam`.

## Primary Commands

- `kalam update`
- `kalam version`
- `kalam doctor`
- `kalam login`
- `kalam logout`
- `kalam whoami`
- `kalam token create --name <name>`

## Important Flags

Connection and auth:

- `--url <url>`, `--host <host>`, `--port <port>`
- `--token <jwt>`
- `--user <user>`, `--password [password]`
- `--instance <name>`
- `--save-credentials`

Execution:

- `--command <sql>`
- `--file <path>`
- `--subscribe <sql>`
- `--list-subscriptions`
- `--format table|json|csv`, `--json`, `--csv`
- timeout controls: `--timeout`, `--connection-timeout`, `--receive-timeout`, `--auth-timeout`, `--subscription-timeout`, `--initial-data-timeout`
- timeout presets: `--fast-timeouts`, `--relaxed-timeouts`

## Interactive Meta-Commands

- `\help` / `\?`
- `\quit` / `\q`
- `\info` / `\session`
- `\sessions`
- `\format <table|json|csv>`
- `\dt` / `\tables`
- `\d <table>` / `\describe <table>`
- `\as <user_id> <sql>`
- `\stats` / `\metrics`
- `\health`
- `\flush`
- `\refresh-tables` / `\refresh`
- `\live <sql>` / `\subscribe <sql>`
- credential commands: `\show-credentials`, `\update-credentials`, `\delete-credentials`
- `\cluster ...`

## Env Vars

- `KALAMDB_SERVER_URL`
- `KALAMDB_ROOT_PASSWORD`
- `KALAMDB_ADMIN_USER`

## Schema Watch

The ORM generator can be driven from CLI schema watching:

```bash
kalam --watch-schema --namespace app --run "npm run schema:gen" --run-on-start
kalam --watch-schema --table app.messages --run "npm run schema:gen"
```

Use `--interval 2s` or `--interval 500ms` for faster local loops.