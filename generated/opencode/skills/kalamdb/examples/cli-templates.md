# Template Quick Reference

**Agents: pick a template first.** Full rules: [cli-templates.md](../references/cli-templates.md).

## Current Built-in Templates (TypeScript)

| `--template` | Use when |
|--------------|----------|
| `simple-live` | Default. Node ORM live demo — not React. Good baseline to extend. |

## Current Built-in Templates (Dart / Flutter)

| `--template` | Use when |
|--------------|----------|
| `simple-live` | Default for `--languages dart`. Flutter local-first starter with `kalam_sync`. |

## Non-Interactive Init

```bash
kalam init --yes \
  --name my-app \
  --languages typescript \
  --template simple-live \
  --server-mode local \
  --package-manager pnpm
kalam dev
```

Dart / Flutter:

```bash
kalam init --yes \
  --name my-app \
  --languages dart \
  --template simple-live \
  --server-mode local
kalam schema gen --languages dart
```

## Full-Stack React + Agent

When a `react-agent` (or similar) template exists, use it:

```bash
kalam init --yes \
  --name my-chat \
  --languages typescript \
  --template react-agent \
  --server-mode local \
  --package-manager pnpm
kalam dev
```

Until that template ships, extend the closest match or follow [full-stack-react-agent.md](full-stack-react-agent.md) — but **do not** hand-roll an equivalent layout if a template covers the same stack.

## After Init

- Edit `schema.sql`, not generated ORM files
- Add processes in `kalam.toml` instead of running servers manually
- Run `kalam dev` once for server + schema gen + all `[dev.processes]`
