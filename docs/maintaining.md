# Maintaining KalamDB Skills

## Scope Matrix

The canonical KalamDB skill is expected to cover all of these contributor-facing surfaces:

- Architecture and crate ownership
- CLI commands, auth flows, cluster flows, and smoke tests
- SQL syntax, identifiers, timestamps, vectors, REST routes, and WebSocket protocol
- TypeScript and Dart SDKs plus versioning rules
- PostgreSQL extension build and test flows
- Operations, cluster setup, Docker, and health checks
- Performance constraints, security guardrails, and troubleshooting

## Supported Install Targets

| Tool | Project install | User install | Source target |
| --- | --- | --- | --- |
| Codex | `.agents/skills/kalamdb` | `~/.codex/skills/kalamdb` | `generated/agents/skills/kalamdb` |
| GitHub Copilot-compatible `.agents` consumers | `.agents/skills/kalamdb` | `~/.agents/skills/kalamdb` | `generated/agents/skills/kalamdb` |
| Claude Code | `.claude/skills/kalamdb` | `~/.claude/skills/kalamdb` | `generated/claude/skills/kalamdb` |
| OpenCode | `.agents/skills/kalamdb` with `npx skills`; `.opencode/skills/kalamdb` with local installer | `~/.config/opencode/skills/kalamdb` | `generated/opencode/skills/kalamdb` |

Preferred external install command:

```bash
npx skills add kalamdb/kalamdb-skills --skill kalamdb
```

Use direct paths when testing a branch or local checkout:

```bash
npx skills add ./kalamdb-skills --list
npx skills add ./kalamdb-skills --skill kalamdb -a codex -a claude-code -a opencode
```

## What Triggers A Skill Update

Update the skill whenever KalamDB changes:

- CLI subcommands, flags, environment variables, or setup commands
- SQL support, dialect behavior, system table behavior, or HTTP routes
- SDK APIs, package names, version compatibility, or local dev workflows
- PostgreSQL extension prerequisites, test flows, or transaction bridging behavior
- cluster scripts, benchmark entry points, or production/development runbooks
- security guidance, auth/bootstrap behavior, or documentation requirements

## Update Workflow

1. Edit the canonical files in `skills/kalamdb/`.
2. Keep `SKILL.md` concise and push details into `references/`.
3. Rebuild generated outputs:

```bash
npm run build
```

4. Verify the canonical skill and generated targets:

```bash
npm run verify
```

5. If you are validating installation locally, run one or more of:

```bash
node scripts/install.mjs install --tool codex --scope project --path /path/to/KalamDB
node scripts/install.mjs install --tool claude --scope user --force
node scripts/install.mjs install --tool opencode --scope project --path /path/to/KalamDB
```

## Upstream Source Map In The KalamDB Repo

When this repo is kept adjacent to the main repo, the most authoritative upstream sources are typically:

- `../KalamDB/AGENTS.md`
- `../KalamDB/server.toml`
- `../KalamDB/backend/server.toml`
- `../KalamDB/backend/server.example.toml`
- `../KalamDB/backend/crates/kalamdb-configs/src/config/types.rs`
- `../KalamDB/docs/reference/sql.md`
- `../KalamDB/docs/api/`
- `../KalamDB/docs/architecture/`
- `../KalamDB/cli/README.md`
- `../KalamDB/pg/README.md`
- `../KalamDB/link/sdks/typescript/README.md`
- `../KalamDB/docs/sdk/sdk.md`
- `../KalamDB/benchv2/README.md`