# `kalam init`

Scaffold a KalamDB project. Requires empty target dir (no existing `kalam.toml`).

Sources: `cli/DEV.md`, `cli/src/workflow/project/init.rs`, `cli/templates/`.

## Template-First (Agents)

**Pick the closest built-in template and extend it** — do not hand-build an equivalent project layout when a template already covers the stack.

1. Read the catalog: [cli-templates.md](cli-templates.md)
2. Init with `--template <id>` (or choose in the interactive menu)
3. Customize `schema.sql`, source files, and `[dev.processes]`
4. Run `kalam dev`

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

Prompts: name → schema mode → languages → **template** → package manager (if TS) → server mode → URL (if remote).

Language menu includes **TypeScript** and **Dart / Flutter**. `--languages flutter` is accepted and stored as `dart`.

Menus: `Up`/`Down`, `Space` (multi-select), `Enter`, `Esc`.

## Flags

| Flag | Purpose |
|------|---------|
| `--name` | Project + default namespace |
| `--schema-mode sql\|remote` | Prefer `sql`; `remote` rejected at init today |
| `--languages typescript,dart` | Generation targets (`ts` and `flutter` aliases accepted) |
| `--template <id>` | Built-in template id — see [cli-templates.md](cli-templates.md) |
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

When a dedicated template exists (e.g. future `react-agent`), use `--template` and extend from there.

Until then: init with the closest template, then follow [full-stack-react-agent.md](../examples/full-stack-react-agent.md) for the delta (React, consumer, extra `[dev.processes].agent`). Do not ignore templates and recreate the same structure manually.

## Agent Rules

- **Template-first:** [cli-templates.md](cli-templates.md) before writing boilerplate.
- CI/non-TTY: always `--yes` + every flag explicit, including `--template`.
- TS needs npm/pnpm/yarn/bun on `PATH` unless deps installed manually after.
- Next step: `kalam dev --agent`. Details: [cli-dev.md](cli-dev.md). Config reference: [kalam-toml.md](kalam-toml.md).
- New CLI template shipped → update [cli-templates.md](cli-templates.md) in the same change window.

## Errors

| Error | Fix |
|-------|-----|
| `interactive init requires a TTY` | `kalam init --yes ...` |
| `project already exists` | `cd` project + `kalam dev`, or `--project-dir` |
| No package manager | Install one or `--package-manager` |
| Unknown template | Check [cli-templates.md](cli-templates.md) for valid ids |
