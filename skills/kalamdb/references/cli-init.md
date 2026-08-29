# `kalam init`

Scaffold a KalamDB project. Requires empty target dir (no existing `kalam.toml`).

Sources: `cli/DEV.md`, `cli/src/workflow/project/init.rs`, `cli/templates/`.

## Template-First (Agents)

**List templates, then init.** Do not hand-build an equivalent project layout when a template already covers the stack.

```bash
kalam init --list-templates --json
```

JSON shape: `{ ok, cli_version, default_template, next, templates: [{ id, kind, language, description }] }`. Use `next` with the chosen `id`.

1. Match the goal: `chat-with-ai` (SHARED rooms) vs `react-ai-chat` (USER assistant) vs `simple-live`
2. Init with `--yes --template <id> --languages ... --package-manager ...`
3. Customize `schema.sql`, source files, and `[dev.processes]`
4. Run `kalam dev start --agent`

Quick lookup: [cli-templates.md](../examples/cli-templates.md).

## Layout Created

```text
my-app/
├── kalam.toml
├── schema.sql
├── .env / .env.example
├── kalam/
│   ├── migrations/
│   ├── .gitignore
│   ├── cli/logs/
│   └── server/server.toml   # local server mode
├── src/generated/kalam.ts   # if typescript
├── package.json             # if typescript template selected
├── pubspec.yaml             # if dart
├── lib/main.dart            # dart simple-live
└── lib/generated/kalam.dart # if dart
```

TypeScript templates (e.g. `simple-live`) add app source, starter `schema.sql`, and `package.json` with a `dev` script.

Dart/Flutter `simple-live` adds `pubspec.yaml`, `lib/main.dart` (`kalam_sync`), and generates `lib/generated/kalam.dart` from `schema.sql`.

## `[dev.processes]` on init

When TypeScript is selected, init writes `[dev.processes].app` automatically:

| Package manager | Command |
|-----------------|---------|
| npm | `npm run dev` |
| pnpm | `pnpm dev` |
| yarn | `yarn dev` |
| bun | `bun run dev` |

Dart-only projects write `app = "flutter run"` (no `package_manager` field). Mixed TypeScript + Dart keeps the TypeScript `app` command. Future templates may add more keys (e.g. `agent`). Full config: [kalam-toml.md](kalam-toml.md).

## Interactive (TTY)

Prompts: name → schema mode → languages → **template** (embedded starters + repository examples) → package manager (if TS) → server mode → URL (if remote).

Language menu includes **TypeScript** and **Dart / Flutter**. `--languages flutter` is accepted and stored as `dart`.

Menus: `Up`/`Down`, `Space` (multi-select), `Enter`, `Esc`.

## Flags

| Flag | Purpose |
|------|---------|
| `--name` | Project + default namespace |
| `--schema-mode sql\|remote` | Prefer `sql`; `remote` rejected at init today |
| `--languages typescript,dart` | Generation targets (`ts` and `flutter` aliases accepted) |
| `--template <id>` | Built-in template or repository example id — see [cli-templates.md](cli-templates.md) |
| `--list-templates` | Print catalog and exit (use `--json` for agents) |
| `--package-manager npm\|pnpm\|yarn\|bun` | Required for TS when multiple on PATH |
| `--server-mode local\|remote` | Whether `kalam dev` starts server |
| `--server-url` | Dev URL (remote mode) |
| `--project-dir` | Scaffold target directory |
| `--yes` | Non-interactive; defaults for omitted choices |

## `--yes` Defaults

`sql` schema, `typescript`, template `simple-live`, `local` server, `http://localhost:2900`, name = cwd or `my-app`. Package manager: invoking tool from `npm_config_user_agent` when present, else first of pnpm → bun → yarn → npm on PATH.

Dart-only `--yes` (`--languages dart` or `flutter`) still uses template `simple-live`, writes `app = "flutter run"`, and skips JavaScript package-manager detection. If `flutter` is on `PATH`, init runs `flutter create . --platforms macos,web` then `flutter pub get` (best-effort; missing Flutter does not fail init).

Override the template explicitly when a better match exists:

```bash
kalam init --yes --name my-app --languages typescript --template simple-live ...
```

## Examples

```bash
kalam init
kalam init --yes --name my-app --schema-mode sql --languages typescript --template simple-live --server-mode local
kalam init --yes --name my-app --languages typescript --template simple-live --server-mode remote \
  --server-url http://localhost:2900 --package-manager pnpm
kalam init --yes --name my-app --schema-mode sql --languages dart --template simple-live --server-mode local
```

## Full-Stack React + Agent

Use a repository example instead of assembling the stack by hand:

```bash
kalam init --yes --name my-chat --languages typescript --template chat-with-ai --server-mode local --package-manager npm
kalam dev start --agent
```

`chat-with-ai` is SHARED rooms + RLS for multi-user chat. Prefer `react-ai-chat` for a personal assistant (USER + STREAM, approvals/attachments). The [full-stack-react-agent.md](../examples/full-stack-react-agent.md) guide is the manual delta only when no example matches.

Init of a repository example rewrites `file:` `@kalamdb/*` dependencies to the CLI version and copies `.env.example` to `.env`.

## Agent Rules

- **Template-first:** [cli-templates.md](cli-templates.md) before writing boilerplate.
- CI/non-TTY: always `--yes` + every flag explicit, including `--template`.
- TS needs npm/pnpm/yarn/bun on `PATH` unless deps installed manually after.
- Next step: `kalam dev start --agent`. Details: [cli-dev.md](cli-dev.md). Config reference: [kalam-toml.md](kalam-toml.md).
- Unknown template → `kalam init --list-templates --json`.
- New CLI template shipped → update [cli-templates.md](cli-templates.md) in the same change window.

## Errors

| Error | Fix |
|-------|-----|
| `interactive init requires a TTY` | `kalam init --yes ...` |
| `project already exists` | `cd` project + `kalam dev`, or `--project-dir` |
| No package manager | Install one or `--package-manager` |
| Unknown template | Check [cli-templates.md](cli-templates.md) for valid ids |
