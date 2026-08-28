# `kalam init` Templates

Use this file when choosing or extending a project scaffold. **Always prefer an existing template over building from scratch.**

Sources: `cli/templates/`, `cli/build.rs` (embedded at compile time), `cli/src/workflow/project/ts/init.rs`, `cli/src/workflow/project/dart/init.rs`.

## Agent Rule: Template First

1. **Match the user's goal to a template** before writing app boilerplate by hand.
2. Run `kalam init` with `--template <id>` (non-interactive) or pick from the interactive **Project template** menu.
3. **Extend the scaffolded project schema-first** — edit `schema.sql`, generate types, then add features and tweak `[dev.processes]` instead of replacing the whole layout.
4. **Only build from scratch** when no template is close enough; document why and prefer the smallest delta from the nearest template.
5. When KalamDB adds a new template, update this file's catalog in the same change window (see [Maintaining this catalog](#maintaining-this-catalog)).

## How to Discover Templates

| Method | When to use |
|--------|-------------|
| Interactive `kalam init` | TTY: **Project template** menu lists every built-in template with descriptions |
| `--template <id>` | CI, agents, non-TTY — pass explicit id with `--yes` |
| This catalog | Agents routing tasks before init — pick id from the table below |
| Source tree | Contributors adding templates: `cli/templates/<language>/<id>/info.toml` |

There is no separate `kalam init --list-templates` command today. Treat **this skill file** plus `cli/templates/**/info.toml` in the KalamDB repo as the catalog source of truth until a CLI list command exists.

Repository-loaded templates ("From repository") are planned but not available yet.

## Template Catalog

Templates are embedded in the CLI at build time from `cli/templates/<language>/<id>/`. Each folder needs an `info.toml` with at least `description`.

### TypeScript

| Template id | Description | Good for | `[dev.processes]` | Notes |
|-------------|-------------|----------|-------------------|-------|
| `simple-live` | Live subscription starter with sample inserts | Learning ORM live tables, minimal Node worker | `app` → package manager `dev` | Default with `--yes`. Node + `@kalamdb/orm`, not React. |

<!-- Add new TypeScript templates below as they ship. Example row:
| `react-agent` | React live UI + topic consumer agent | Full-stack chat, agents reacting to inserts | `app`, `agent` | Vite + `@kalamdb/react` + `@kalamdb/consumer` |
-->

### Dart / Flutter

| Template id | Description | Good for | `[dev.processes]` | Notes |
|-------------|-------------|----------|-------------------|-------|
| `simple-live` | Flutter local-first starter with `kalam_sync` | Flutter apps, local-first lists | `app` → `flutter run` | Default for Dart-only `--yes`. Writes `pubspec.yaml`, `lib/main.dart`, and generates `lib/generated/kalam.dart`. |

### Scaffold (always applied)

Every init also applies the `scaffold/default` template: `kalam.toml`, `kalam/migrations/`, `kalam/server/server.toml`, `.env.example`, etc. Language templates layer **on top** of this base.

## Choosing a Template by Task

| User goal | Start with | Then |
|-----------|------------|------|
| Full-stack React + topic agent | Closest React/agent template when available; until then extend `simple-live` or follow [full-stack-react-agent.md](../examples/full-stack-react-agent.md) | `kalam dev` |
| Browser live UI only | Future React templates; today: add Vite + `@kalamdb/react` to a TS init | [typescript-react.md](typescript-react.md) |
| Node worker / agent only | `simple-live` or future worker templates | [typescript-consumer.md](typescript-consumer.md) |
| Flutter / mobile | `kalam init --languages dart --template simple-live` | [dart-sync.md](dart-sync.md) |
| Minimal ORM demo | `simple-live` | `kalam dev` |

When a dedicated template exists for the task, **use it** — do not duplicate its file layout manually.

## Init with a Template

```bash
kalam init --yes \
  --name my-app \
  --schema-mode sql \
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
  --schema-mode sql \
  --languages dart \
  --template simple-live \
  --server-mode local
kalam schema gen --languages dart
```

Interactive init prompts for a TypeScript template when TypeScript is included, and for a Dart/Flutter template when Dart is the only language. Mixed TypeScript + Dart uses the TypeScript template plus a Dart overlay (`pubspec.yaml`, generated specs) without a second template prompt.

## What Templates Provide

A language template typically ships:

- `schema.sql` starter (tables and seeds; create topics/sources from setup scripts or idempotent worker startup SQL until workflow schema generation accepts topic DDL)
- App source (`src/`, `package.json`, framework config)
- npm scripts wired to `[dev.processes]` keys in `kalam.toml`
- Dependencies on the right `@kalamdb/*` packages

Init always **also** writes:

- `kalam.toml` with schema generation paths (e.g. `src/generated/kalam.ts`)
- Migration directory and server config (local mode)

After init, `kalam dev` applies schema and regenerates ORM types — templates should import from the generated path, not duplicate schema types by hand. For app-owned tables, prefer explicit `CREATE USER TABLE` / `CREATE STREAM TABLE` declarations in `schema.sql` over bare `CREATE TABLE` plus later assumptions.

## Extending a Template (Not Replacing)

After `kalam init --template <id>`:

1. Edit `schema.sql` first — add explicit `CREATE USER TABLE` / `CREATE STREAM TABLE` tables
2. Let `kalam dev` or `kalam schema gen` regenerate ORM output
3. Implement features against generated tables/types; do not create hand-written duplicate row models first
4. Create topics/sources from setup scripts or idempotent worker startup SQL
5. Add `[dev.processes]` keys for extra workers (e.g. `agent = "pnpm agent"`)
6. Keep generated output under `src/generated/` (or path in `kalam.toml`) read-only

Do **not** delete the template's `kalam.toml` / migration setup unless the user explicitly wants a non-workflow project.

## Maintaining This Catalog

When adding a template under `cli/templates/` in KalamDB:

1. Add `info.toml` with a clear `description` (shown in interactive init)
2. Wire `[dev.processes]` in the template's `kalam.toml` fragment or document expected keys
3. Update **this file** — new row in the catalog table and task-routing row if applicable
4. Update [cli-init.md](cli-init.md) if defaults or flags change
5. Add or update an example under `skills/kalamdb/examples/` if the template needs usage patterns beyond the scaffold
6. Rebuild kalamdb-skills: `npm run build && npm run verify`

## Related

- Init flags and layout: [cli-init.md](cli-init.md)
- Local orchestration: [cli-dev.md](cli-dev.md)
- Full-stack manual path (no template yet): [full-stack-react-agent.md](../examples/full-stack-react-agent.md)
- Example configs: [cli-templates.md](../examples/cli-templates.md)
