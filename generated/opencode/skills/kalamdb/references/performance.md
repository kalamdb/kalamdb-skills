# Performance

Use this file for hot-path design, compile-time restraint, benchmarks, connection scale, DataFusion tuning, RocksDB memory, and security/performance tradeoffs.

## Core Rules

- Keep runtime cost, allocation count, binary size, and compile cost visible.
- Use `Arc<T>` for shared data instead of cloning large structures.
- Memoize expensive schema/provider construction.
- Keep providers cheap and reusable.
- Use DashMap or local established concurrent structures where appropriate.
- Avoid SQL rewrite passes in hot paths.
- Batch compile feedback instead of running `cargo check` after every tiny edit.

## Config Knobs

Performance-critical config sections:

- `[performance]`
- `[rate_limit]`
- `[storage.rocksdb]`
- `[storage.rocksdb.cf_profiles.*]`
- `[datafusion]`
- `[flush]`
- `[manifest_cache]`
- `[websocket]`

See [server-configuration.md](server-configuration.md) for all keys.

## Benchmarks

Benchmark harness: `benchv2/`.

Commands:

```bash
cd benchv2 && ./run-benchmarks.sh
cd benchv2 && ./run-connection-scale.sh
```

Whenever reporting performance tests or benchmarks, include runtime in seconds for each relevant test.

## Security Guardrails That Affect Performance

- Keep pre-auth rate limiting enabled.
- Keep auth endpoints throttled.
- Keep health endpoints localhost-only unless explicitly authenticated.
- Validate paths and file limits before expensive file operations.
- Reject abusive request sizes early.

## Profiling Sources

- `docs/development/performance-optimizations.md`
- `docs/development/docker-idle-resource-baseline.md`
- `.agents/tasks/performance-profiling.md`
- `benchv2/README.md`