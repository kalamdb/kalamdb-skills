# CLI Workflow Examples

## New Project (Interactive)

```bash
mkdir my-app && cd my-app
kalam init
kalam dev
```

`kalam init` scaffolds `kalam.toml`, `schema.sql`, migration directory, and generated SDK output paths. `kalam dev` starts (or reuses) a local KalamDB server, runs the schema pipeline, and supervises `[dev.processes]`.

## New Project (Non-Interactive / Agents)

```bash
mkdir my-app && cd my-app
kalam init --yes \
  --name my-app \
  --schema-mode sql \
  --languages typescript,dart \
  --server-mode local \
  --package-manager pnpm
kalam dev
```

Use `--yes` in CI, piped shells, or any non-TTY environment. Pass every choice explicitly.

## TypeScript App Against Existing Server

```bash
kalam init --yes \
  --name my-app \
  --languages typescript \
  --template simple-live \
  --server-mode remote \
  --server-url http://localhost:2900
kalam dev
```

Set `dev.auto_start_db = false` in `kalam.toml` when the server is managed externally.

## Schema Change Loop

```bash
# edit schema.sql
kalam schema gen
kalam migration create add_comments_table
kalam db migrate
```

With `kalam dev` running and `dev.watch = true`, schema edits trigger regeneration and draft migration updates automatically.

## Link Production Environment

```bash
kalam link --env prod --url https://db.example.com --namespace my-app
kalam status --env prod
kalam deploy --env prod
```

## First Query (Ad-Hoc SQL)

```bash
kalam --url http://127.0.0.1:2900 --user admin --password AdminPass123! \
  --command "SELECT * FROM system.namespaces LIMIT 10"
```

## File Execution

```bash
kalam --url http://127.0.0.1:2900 --file setup.sql --format json
```

## Live Query

```bash
kalam --subscribe "SUBSCRIBE TO app.messages WHERE room = 'main' OPTIONS (last_rows=50, batch_size=100)"
```

## Credential Flow

```bash
kalam login --instance local --user admin --password AdminPass123!
kalam whoami --instance local
kalam --instance local --command "SHOW TABLES IN app"
kalam logout --instance local
```

Workflow environments use credential instances `kalam-dev` and `kalam-prod` by default.
