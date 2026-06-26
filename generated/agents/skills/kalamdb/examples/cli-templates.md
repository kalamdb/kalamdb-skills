# Template Quick Reference

**Agents: pick a template first.** Full rules: [cli-templates.md](../references/cli-templates.md).

## Current Built-in Templates (TypeScript)

| `--template` | Use when |
|--------------|----------|
| `simple-live` | Default. Node ORM live demo — not React. Good baseline to extend. |

More templates will appear here as they ship under `cli/templates/typescript/<id>/`.

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
