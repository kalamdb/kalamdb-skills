# Template Quick Reference

**Agents: `kalam init --list-templates --json` first.** Full rules: [cli-templates.md](../references/cli-templates.md).

## Current Built-in Templates (TypeScript)

| `--template` | Use when |
|--------------|----------|
| `simple-live` | Default. Node ORM live demo — not React. Good baseline to extend. |
| `chat-with-ai` | Multi-user React chat: SHARED rooms, RLS, STREAM agent events. |
| `react-ai-chat` | Personal AI assistant: USER tables, STREAM tokens, approvals. |
| `summarizer-agent` | Worker-only topic consumer that enriches rows. |
| `realtime-ops-feed` | Small browser app with live SQL subscriptions. |
| `live-okf-context-sync` | OKF folder sync with live FILE columns. |

## Current Built-in Templates (Dart / Flutter)

| `--template` | Use when |
|--------------|----------|
| `simple-live` | Default for `--languages dart`. Flutter local-first starter with `kalam_sync`. |

## Non-Interactive Init

```bash
kalam init --list-templates --json
kalam init --yes \
  --name my-app \
  --languages typescript \
  --template simple-live \
  --server-mode local \
  --package-manager npm
kalam dev start --agent
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

Multi-user rooms (SHARED + RLS):

```bash
kalam init --yes \
  --name my-chat \
  --languages typescript \
  --template chat-with-ai \
  --server-mode local \
  --package-manager npm
kalam dev start --agent
```

Personal assistant (USER + STREAM): `--template react-ai-chat`. Manual assembly is [full-stack-react-agent.md](full-stack-react-agent.md) only when no example matches.

## After Init

- Edit `schema.sql`, not generated ORM files
- Add processes in `kalam.toml` instead of running servers manually
- Run `kalam dev --agent` once for server + schema gen + all `[dev.processes]`
