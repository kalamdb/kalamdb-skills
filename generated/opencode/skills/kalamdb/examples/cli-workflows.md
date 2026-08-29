# CLI Workflow Examples

## Template-First (Agents)

Before scaffolding manually, check [cli-templates.md](../references/cli-templates.md) and init with the closest `--template`:

```bash
kalam init --yes --name my-app --languages typescript --template simple-live --server-mode local --package-manager pnpm
kalam dev --agent
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

```bash
kalam init --yes \
  --name my-chat \
  --languages typescript \
  --template chat-with-ai \
  --server-mode local \
  --package-manager pnpm
kalam dev --agent
```

Use `--template react-ai-chat` for approvals and attachments. The [full-stack-react-agent.md](full-stack-react-agent.md) guide is only the manual delta when no example matches.

## New Project (Non-Interactive / Agents)

```bash
mkdir my-app && cd my-app
kalam init --yes \
  --name my-app \
  --schema-mode sql \
  --languages typescript \
  --server-mode local \
  --package-manager pnpm
kalam dev start --agent
kalam -c "SELECT table_name FROM information_schema.tables LIMIT 20;" --json
kalam dev stop
```

Use `--yes` in CI, piped shells, or any non-TTY environment. Pass every choice explicitly. `kalam dev --agent` is the preferred coding-agent development command when you can keep a foreground process; `kalam dev start --agent` detaches that same loop.

## New Flutter / Dart Project

```bash
mkdir my-app && cd my-app
kalam init --yes \
  --name my-app \
  --schema-mode sql \
  --languages dart \
  --template simple-live \
  --server-mode local
kalam schema gen --languages dart
```

`--languages flutter` is accepted and stored as `dart`. Init writes `pubspec.yaml`, `lib/main.dart`, `schema.sql`, and `lib/generated/kalam.dart` (`KalamTableSpec` codecs). If Flutter is on `PATH`, init also runs `flutter create` and `flutter pub get`.

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
