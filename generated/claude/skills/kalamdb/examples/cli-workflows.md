# CLI Workflow Examples

## Template-First (Agents)

Before scaffolding manually, check [cli-templates.md](../references/cli-templates.md) and init with the closest `--template`:

```bash
kalam init --yes --name my-app --languages typescript --template simple-live --server-mode local --package-manager pnpm
kalam dev
```

Extend the template (`schema.sql`, `src/`, `[dev.processes]`) instead of rebuilding the same layout. Quick catalog: [cli-templates.md](cli-templates.md).

## New Project (Interactive)

```bash
mkdir my-app && cd my-app
kalam init
kalam dev
```

`kalam init` scaffolds `kalam.toml`, `schema.sql`, migration directory, generated SDK output paths, and (for TypeScript) `[dev.processes].app` with the package manager's dev command. `kalam dev` starts (or reuses) a local KalamDB server, runs the schema pipeline, and supervises `[dev.processes]`.

## Full-Stack React + Topic Agent

When a matching template exists (e.g. future `react-agent`), use `--template` and extend. Otherwise see [full-stack-react-agent.md](full-stack-react-agent.md) for the delta from the nearest template.

```bash
kalam init --yes \
  --name my-chat \
  --languages typescript \
  --template simple-live \
  --server-mode local \
  --package-manager pnpm
kalam dev
```

Configure `[dev.processes]` with both frontend and agent when the template does not already:

```toml
[dev.processes]
app = "pnpm dev"
agent = "pnpm agent"
```

Details: [full-stack-react-agent.md](full-stack-react-agent.md). Example config: [kalam-fullstack.toml](kalam-fullstack.toml). Reference app: `examples/react-ai-chat/` in the KalamDB repo.

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

## Fresh Local Database

When migrations or namespaces look wrong after many dev iterations:

```bash
# Stop kalam dev first (Ctrl+C)
kalam db reset
kalam dev
```

If the project has no `kalam/server` directory but `kalam dev` reuses an existing localhost server, reset prompts before dropping the namespace. Use `--yes` to confirm without prompting (required in CI/non-TTY):

```bash
kalam db reset --yes
kalam dev
```

See [cli-lifecycle.md](../references/cli-lifecycle.md) for local vs server behavior.

## Link Production Environment

```bash
kalam link --env prod --url https://db.example.com --namespace my-app
kalam status --env prod
kalam db migrate --env prod
# kalam deploy is not supported yet — use your own rollout after migrate
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
