# Agent Change Checklist

When changing KalamDB, answer these before finalizing work:

1. Did a user-facing CLI command, flag, SQL syntax, API route, SDK entry point, config key, or runbook change?
2. If yes, update `../kalamdb-skills/skills/kalamdb/` in the same change window.
3. Did the change touch architecture, transaction flow, storage boundaries, execution paths, or cross-system integration?
4. If yes, update `docs/architecture/` or `docs/architecture/decisions/` in the main repo.
5. Did an SDK change happen under `link/sdks/**` or a bridge crate?
6. If yes, update the matching KalamSite SDK docs and tests.
7. Did a performance test or benchmark run?
8. If yes, report runtime in seconds.
9. Rebuild and verify the skills repo:

```bash
cd ../kalamdb-skills
npm run build
npm run verify
```