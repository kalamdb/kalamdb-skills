# KalamDB Skills Repo Guidance

## Core Rules

1. The canonical source of truth is `skills/kalamdb/`.
2. Anything under `generated/` is derived output. Do not hand-edit it.
3. Keep `skills/kalamdb/SKILL.md` short and discovery-focused. Put detailed guidance in `references/`.
4. When KalamDB changes commands, syntax, SDK entry points, auth/bootstrap flows, testing flows, or operational runbooks, update the skill in the same change window.
5. When a new `kalam init` template is added under `cli/templates/`, update `skills/kalamdb/references/cli-templates.md` and `examples/cli-templates.md` in the same change window.
6. After editing the canonical skill, run:

```bash
npm run build
npm run verify
```

7. Preserve cross-tool compatibility in the canonical skill frontmatter. Tool-specific metadata belongs in companion files such as `agents/openai.yaml`, not in the core skill body unless the field is part of the shared format.