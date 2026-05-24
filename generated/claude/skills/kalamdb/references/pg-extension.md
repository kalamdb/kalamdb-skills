# PostgreSQL Extension

Use this file for `pg_kalam`, FDW work, pgrx builds, Docker artifacts, transaction bridging, and PostgreSQL-facing examples.

## Sources

- `pg/README.md`
- `pg/src/lib.rs`
- `pg/src/fdw_*.rs`
- `pg/tests/`
- `docs/architecture/pg-extension-grpc-connectivity.md`
- `docs/security/grpc-security.md`

## Scope

`pg_kalam` provides:

- `CREATE EXTENSION pg_kalam;`
- `pg_kalam` foreign data wrapper
- PostgreSQL-side bridge to KalamDB over gRPC
- Docker images with `pgvector` preinstalled

Supported PostgreSQL versions: pg13 through pg18. Default build target: pg16. `cargo-pgrx` version: `0.18.0`.

## Native Development Build

```bash
PG_MAJOR=16
PG_FEATURE="pg${PG_MAJOR}"
PG_CONFIG="$(command -v pg_config)"

cargo install cargo-pgrx --version "=0.18.0" --locked
cargo pgrx init "--pg${PG_MAJOR}=${PG_CONFIG}"

cargo pgrx install \
  -p kalam-pg-extension \
  -c "${PG_CONFIG}" \
  --no-default-features \
  --profile release-pg \
  -F "${PG_FEATURE}"
```

Run `cargo pgrx` from `pg/` or pass `--manifest-path pg/Cargo.toml` from repo root. Do not run pgrx commands from another workspace member like `cli/`.

## Extension SQL Setup

```sql
CREATE EXTENSION IF NOT EXISTS pg_kalam;

CREATE SERVER kalam_server
  FOREIGN DATA WRAPPER pg_kalam
  OPTIONS (
    host '127.0.0.1',
    port '2910',
    auth_mode 'account_login',
    login_user 'pg_dba',
    login_password '<dba-password>'
  );
```

Legacy static-header mode remains available with `auth_mode 'static_header'` and `auth_header 'Bearer <token-or-shared-secret>'`.

Verify:

```sql
SELECT kalam_version(), kalam_compiled_mode();
```

## Docker

```bash
./pg/docker/build-fast.sh
cd pg/docker && docker compose up -d
psql "postgresql://kalamdb:kalamdb123@127.0.0.1:5433/kalamdb"
```

Production artifacts: `pg_kalam.so`, `pg_kalam.control`, and `pg_kalam--*.sql`.

## Type Notes

- PostgreSQL `JSON` and `JSONB` map to KalamDB `JSON`.
- `FILE` in KalamDB is mirrored locally as PostgreSQL `JSONB` containing a `FileRef` payload.
- KalamDB supports common PostgreSQL-style JSON operators `->`, `->>`, and `?`; do not assume full `jsonb` operator parity.