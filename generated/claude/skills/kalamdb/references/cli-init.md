# `kalam init`

Scaffold a KalamDB project. Requires empty target dir (no existing `kalam.toml`).

Sources: `cli/DEV.md`, `cli/src/workflow/project/init.rs`, `cli/src/args/workflow.rs`.

## Layout Created

```text
my-app/
├── kalam.toml
├── schema.sql
├── .env.example
├── .kalam/server.toml      # local server mode
├── kalam/migrations/
├── src/generated/kalam.ts  # if typescript
└── lib/generated/kalam.dart # if dart
```

TypeScript also gets `simple-live` template (`src/index.ts`, package manifest).

## Interactive (TTY)

Prompts: name → schema mode → languages → server mode → URL (if remote) → package manager (if TS).

Menus: `Up`/`Down`, `Space` (multi-select), `Enter`, `Esc`.

## Flags

| Flag | Purpose |
|------|---------|
| `--name` | Project + default namespace |
| `--schema-mode sql\|remote` | Prefer `sql`; `remote` not fully available |
| `--languages typescript,dart` | Generation targets |
| `--template simple-live` | TS template id |
| `--package-manager npm\|pnpm\|yarn\|bun` | Required for TS when multiple on PATH |
| `--server-mode local\|remote` | Whether `kalam dev` starts server |
| `--server-url` | Dev URL (remote mode) |
| `--project-dir` | Scaffold target directory |
| `--yes` | Non-interactive; defaults for omitted choices |

## `--yes` Defaults

`sql` schema, `typescript,dart`, `local` server, `http://localhost:2900`, name = cwd or `my-app`.

## Examples

```bash
kalam init
kalam init --yes --name my-app --schema-mode sql --languages typescript --server-mode local
kalam init --yes --name my-app --languages typescript --server-mode remote \
  --server-url http://localhost:2900 --package-manager pnpm
```

## Agent Rules

- CI/non-TTY: always `--yes` + every flag explicit.
- TS needs npm/pnpm/yarn/bun on `PATH` unless deps installed manually after.
- Next step: [cli-dev.md](cli-dev.md).

## Errors

| Error | Fix |
|-------|-----|
| `interactive init requires a TTY` | `kalam init --yes ...` |
| `project already exists` | `cd` project + `kalam dev`, or `--project-dir` |
| No package manager | Install one or `--package-manager` |
