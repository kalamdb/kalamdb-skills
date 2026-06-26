# Agent Change Checklist

When changing KalamDB, answer these before finalizing work:

1. Did a user-facing CLI command, flag, SQL syntax, API route, SDK entry point, config key, or runbook change?
2. If yes, update `../kalamdb-skills/skills/kalamdb/` in the same change window.
3. Did you add or change a `kalam init` template under `cli/templates/`?
4. If yes, update `references/cli-templates.md` and `examples/cli-templates.md` in kalamdb-skills (new catalog row + task routing).
5. Did the change touch architecture, transaction flow, storage boundaries, execution paths, or cross-system integration?
6. If yes, update `docs/architecture/` or `docs/architecture/decisions/` in the main repo.
7. Did an SDK change happen under `link/sdks/**` or a bridge crate?
8. If yes, update the matching KalamSite SDK docs and tests.
9. Did a performance test or benchmark run?
10. If yes, report runtime in seconds.
11. Rebuild and verify the skills repo:

```bash
cd ../kalamdb-skills
npm run build
npm run verify
```