# Troubleshooting

## Common Failure Patterns

### Smoke tests fail immediately

- Check whether the backend server is already running.
- Confirm the target URL and root/admin credentials match the running server.

### CLI or SDK auth looks wrong

- Check for stale local server state, stale JWT caches, or mismatched bootstrap passwords.
- Verify whether you are talking to an already-running server instead of a fresh local instance.

### TypeScript SDK local linking behaves strangely

- Check sibling package versions and local `file:` dependency wiring.
- Rebuild local SDK packages before debugging higher-level examples.

### PostgreSQL extension build or test issues

- Check pgrx/PostgreSQL version alignment.
- Re-read `pg/README.md` before changing build commands or test expectations.

### Cluster and ports

- Watch for local port exhaustion or stale node processes.
- Prefer the existing cluster scripts and documented health checks.

### Generated code boundaries

- Do not hand-edit generated Dart files.
- Treat generated skill targets as derived output.