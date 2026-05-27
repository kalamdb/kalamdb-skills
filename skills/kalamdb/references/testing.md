# Testing

Use this file for test command selection, smoke/e2e expectations, nextest behavior, UI tests, SDK tests, PG tests, and benchmark validation.

## Sources

- `AGENTS.md`
- `nextest.toml`
- `scripts/test-all.sh`
- `docs/development/testing-strategy.md`
- `cli/tests/`
- `pg/tests/`
- `link/sdks/typescript/**`
- `ui/`

## Core Rules

- Use `cargo nextest run` unless explicitly told otherwise.
- Start a KalamDB server before smoke tests.
- For CLI e2e tests, do not pass `--no-fail-fast` unless explicitly instructed.
- Fix the first e2e failure, rerun, then continue.
- Add `#[ntest::timeout(time)]` to async tests using observed runtime times 1.5.
- Do not increase timeouts to hide hangs or races.
- Report performance test and benchmark runtimes in seconds.

## Commands

```bash
cargo nextest run
cd backend && cargo run --bin kalamdb-server
cd cli && cargo test --test smoke -- --nocapture
cd /path/to/KalamDB && ./scripts/test-all.sh
cd benchv2 && ./run-benchmarks.sh
```

CLI e2e guidance:

```bash
cargo nextest run --features e2e-tests
cd cli && ./run-tests.sh --package kalam-cli --test oidc_cli_
```

OIDC CLI/Admin UI tests use the shared Dex utility at `http://127.0.0.1:5556`. `cli/run-tests.sh` starts `docker/utils` Dex automatically for auth/OIDC-shaped runs unless `KALAMDB_SKIP_DOCKER_DEX=true` is set.

TypeScript SDK release lane:

```bash
./scripts/test-typescript-sdk-release.sh
TS_SDK_PACKAGES="client react cli" ./scripts/test-typescript-sdk-release.sh
```

PG extension tests should use the dedicated PG lane rather than being folded into generic workspace nextest when the extension is excluded.

## Full Matrix

`./scripts/test-all.sh` runs the Rust workspace tests, FDW import test, PostgreSQL extension e2e tests, TypeScript SDK tests, admin UI tests, and Dart SDK tests. It requires a running server.