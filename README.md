# KalamDB Skills

Canonical Agent Skills content for KalamDB.

This repo is the source of truth for the reusable KalamDB skill that should work across Codex, Claude Code, OpenCode, GitHub Copilot-compatible `.agents` consumers, and other tools that follow the Agent Skills layout.

## What This Repo Contains

- One canonical skill at `skills/kalamdb/`
- Reference docs that cover architecture, operations, server configuration, CLI, auth, performance, TypeScript SDKs, Dart SDK, PostgreSQL extension, SQL syntax, REST/WebSocket APIs, integrations, testing, and troubleshooting
- Build tooling that emits ready-to-install targets under `generated/`
- Install tooling for project-scope and user-scope installs

## Quick Start

Preferred install path with the open `skills` CLI:

```bash
npx skills add kalamdb/kalamdb-skills
```

Useful variants:

```bash
# List skills without installing
npx skills add kalamdb/kalamdb-skills --list

# Install only KalamDB for Codex, Claude Code, and OpenCode
npx skills add kalamdb/kalamdb-skills --skill kalamdb -a codex -a claude-code -a opencode

# Install globally for all detected agents
npx skills add kalamdb/kalamdb-skills --skill kalamdb -g --all
```

The repo also ships a local installer for environments that do not use the `skills` CLI.

Build generated targets:

```bash
npm run build
```

Verify the canonical skill and generated targets:

```bash
npm run verify
```

Install into a KalamDB checkout for Codex or other `.agents` consumers with the local installer:

```bash
node scripts/install.mjs install --tool codex --scope project --path /path/to/KalamDB
```

Install for Claude Code at user scope:

```bash
node scripts/install.mjs install --tool claude --scope user
```

Install for OpenCode at project scope:

```bash
node scripts/install.mjs install --tool opencode --scope project --path /path/to/KalamDB
```

You can also use the shell wrappers:

```bash
./install.sh install --tool codex --scope project --path /path/to/KalamDB
pwsh ./install.ps1 install --tool claude --scope user
```

## Layout

```text
kalamdb-skills/
  README.md
  AGENTS.md
  package.json
  install.sh
  install.ps1
  docs/
    maintaining.md
  skills/
    kalamdb/
      SKILL.md
      manifest.json
      agents/
        openai.yaml
      references/
        architecture.md
        operations.md
        cli.md
        auth.md
        performance.md
        typescript-client-sdk.md
        typescript-orm.md
        typescript-consumer.md
        dart-sdk.md
        pg-extension.md
        sql-syntax.md
        api-websocket.md
        server-configuration.md
        testing.md
        troubleshooting.md
        integrations.md
      examples/
        agent-change-checklist.md
        cli-workflows.md
        dart-sdk.md
        pg-extension.md
        server-configuration.toml
        sql-patterns.md
        typescript-client.md
        typescript-consumer.md
        typescript-orm.md
  scripts/
    build-targets.mjs
    install.mjs
    verify-targets.mjs
  generated/
    agents/skills/kalamdb/
    claude/skills/kalamdb/
    opencode/skills/kalamdb/
```

## Install Targets

- `codex`, `agents`, `copilot` -> `.agents/skills/kalamdb`
- `claude` -> `.claude/skills/kalamdb`
- `opencode` -> `.agents/skills/kalamdb` for `npx skills` project installs, and `~/.config/opencode/skills/kalamdb` for user installs

## Maintenance Rules

This repo must be updated whenever KalamDB changes any user-facing surface the skill teaches, including:

- CLI commands or flags
- SQL syntax or type behavior
- REST or WebSocket routes
- SDK entry points or versioning rules
- PostgreSQL extension behavior or build steps
- test commands, smoke prerequisites, or benchmark flows
- auth, bootstrap, or operational runbooks

See `docs/maintaining.md` for the full sync and release workflow.