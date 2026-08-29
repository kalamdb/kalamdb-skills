# SQL Syntax

Use this file for KalamDB SQL, DDL, DML, storage commands, topics, live queries, backup/restore, and SQL compatibility questions.

## Sources

- `docs/reference/sql.md`
- `docs/reference/identifiers.md`
- `docs/reference/timestamp-formatting.md`
- `docs/reference/vector-embeddings.md`
- `backend/crates/kalamdb-dialect/`

## Namespaces

```sql
CREATE NAMESPACE [IF NOT EXISTS] <namespace>;
DROP NAMESPACE [IF EXISTS] <namespace> [CASCADE];
ALTER NAMESPACE <namespace> SET DESCRIPTION '<description>';
USE <namespace>;
USE NAMESPACE <namespace>;
SET NAMESPACE <namespace>;
SHOW NAMESPACES;
```

## Tables

KalamDB supports `USER`, `SHARED`, and `STREAM` tables.

```sql
CREATE [USER|SHARED|STREAM] TABLE [IF NOT EXISTS] [<namespace>.]<table_name> (
  <column_name> <data_type> [NOT NULL|NULL] [DEFAULT <expr>] [PRIMARY KEY],
  [CONSTRAINT <name> PRIMARY KEY (<column_name>)]
)
[WITH (
  TYPE = '<USER|SHARED|STREAM>',
  STORAGE_ID = '<storage_id>',
  USE_USER_STORAGE = <TRUE|FALSE>,
  FLUSH_POLICY = '<rows:N|interval:N|rows:N,interval:N>',
  TTL_SECONDS = <seconds>,
  EVICTION_STRATEGY = '<time_based|size_based|hybrid>',
  MAX_STREAM_SIZE_BYTES = <bytes>,
  COMPRESSION = '<none|snappy|zstd>'
)];
```

For app schemas, prefer direct table-type declarations so agents and reviewers cannot miss the storage boundary:

```sql
CREATE USER TABLE app.messages (...);
CREATE STREAM TABLE app.message_streams (...) WITH (TTL_SECONDS = 300);
```

Table options are type-specific: `USER` supports `STORAGE_ID`, `USE_USER_STORAGE`, `FLUSH_POLICY`, and `COMPRESSION`; `SHARED` supports `STORAGE_ID`, `FLUSH_POLICY`, and `COMPRESSION`; `STREAM` supports `TTL_SECONDS`, `EVICTION_STRATEGY`, and `MAX_STREAM_SIZE_BYTES`. `COMPRESSION` is a cold-tier Parquet setting for `USER` and `SHARED` tables only; `none` writes uncompressed Parquet, `snappy` is the default, and `zstd` uses Zstandard level 1.

Shared tables always use FORCE row-level security. Creating a shared table without `CREATE POLICY` is default-deny for User and Service. `ACCESS_LEVEL` is not a table option. Grant rows with `CREATE POLICY`. System and DBA bypass RLS.

When to use USER vs SHARED, policy shapes, and live routing: [rls-policies.md](rls-policies.md). Copy-paste cases: [sql-patterns.md](../examples/sql-patterns.md).

DDL:

```sql
ALTER TABLE [<namespace>.]<table> ADD COLUMN <name> <type> [NOT NULL|NULL] [DEFAULT <value>];
ALTER TABLE [<namespace>.]<table> DROP COLUMN <name>;
ALTER TABLE [<namespace>.]<table> MODIFY COLUMN <name> <type> [NOT NULL|NULL];
ALTER TABLE [<namespace>.]<table> SET TBLPROPERTIES (<table_option> = <value>, ...);
DROP [USER|SHARED|STREAM] TABLE [IF EXISTS] [<namespace>.]<table>;
CREATE POLICY <name> ON [<namespace>.]<table>
  FOR {ALL|SELECT|INSERT|UPDATE|DELETE}
  TO {PUBLIC|user|service}
  USING (<boolean_expr>)
  [WITH CHECK (<boolean_expr>)];
ALTER POLICY <name> ON [<namespace>.]<table> USING (<boolean_expr>);
DROP POLICY [IF EXISTS] <name> ON [<namespace>.]<table>;
CREATE VIEW [<namespace>.]<view> AS <select_query>;
SHOW TABLES [IN [NAMESPACE] <namespace>];
DESCRIBE TABLE [<namespace>.]<table> [HISTORY];
DESCRIBE [<namespace>.]<table>;   -- admin meta; Kalam types via information_schema
DESC [<namespace>.]<table>;
SHOW STATS FOR TABLE [<namespace>.]<table>;
```

Schema and plan diagnostics (full reference: KalamSite `/docs/server/sql-reference/diagnostics`):

```sql
-- Native DESCRIBE TABLE: column_id, is_primary_key, schema_version, Kalam data_type, ...
DESCRIBE TABLE app.messages;

-- EXPLAIN keyword order: ANALYZE before VERBOSE (not EXPLAIN VERBOSE ANALYZE)
EXPLAIN SELECT id FROM app.messages WHERE user_id = 'alice' LIMIT 10;
EXPLAIN ANALYZE SELECT id FROM app.messages WHERE user_id = 'alice' LIMIT 10;
EXPLAIN ANALYZE VERBOSE SELECT id FROM app.messages WHERE user_id = 'alice' LIMIT 10;
```

- `DESCRIBE TABLE` — elevated role; rich schema-registry columns.
- `DESCRIBE <table>` / `DESC <table>` — DBA/System meta command; rewritten to `information_schema.columns` with `kdb_data_type`.
- `EXPLAIN` — DBA/System; returns `logical_plan` + `physical_plan` rows.
- `EXPLAIN ANALYZE` — executes query; returns `Plan with Metrics` plus hot/cold scan metrics on `DeferredBatchExec` (`hot_rows_scanned`, `cold_rows_scanned`, `cold_files_scanned`, …).
- `EXPLAIN ANALYZE VERBOSE` — adds `Plan with Full Metrics`, `Output Rows`, `Duration` rows.

## DML

```sql
INSERT INTO [<namespace>.]<table> (<columns>) VALUES (<values>);
INSERT INTO [<namespace>.]<table> (<columns>) VALUES (...), (...);
UPDATE [<namespace>.]<table> SET <column> = <value> WHERE <condition>;
DELETE FROM [<namespace>.]<table> WHERE <condition>;
SELECT <columns> FROM [<namespace>.]<table> [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...];
```

### Upsert (`ON CONFLICT DO UPDATE`)

PostgreSQL-style upsert for literal `INSERT ... VALUES` on `USER`, `SHARED`, and `STREAM`
tables:

```sql
INSERT INTO [<namespace>.]<table> (<columns>) VALUES (<values>)
ON CONFLICT (<primary_key_column>)
DO UPDATE SET
  <column1> = EXCLUDED.<column1>,
  <column2> = <literal>;
```

Behavior:

- Primary key exists → apply `DO UPDATE SET`.
- Primary key missing → insert the `VALUES` row.
- Outside explicit transactions, KalamDB wraps each upsert in its own internal transaction.
- Inside `BEGIN` / `COMMIT`, upsert sees rows staged earlier in the same transaction
  (including on `SHARED` tables).

`DO UPDATE SET` assignments support:

- `EXCLUDED.<column>` — value from the attempted insert
- literals such as `'published'`, `42`, or `NULL`

Limits:

- Single-column primary key only; conflict target must be that PK column.
- Literal `VALUES` only — `INSERT ... SELECT` upserts are not supported on this path.
- `ON CONFLICT DO NOTHING`, `ON CONFLICT ON CONSTRAINT`, `ON CONFLICT DO UPDATE WHERE`, and
  tuple assignments in `DO UPDATE SET` are not supported.
- `system.*` tables are rejected.
- `user` / `service` cannot `ON CONFLICT DO UPDATE` on **shared** tables (FORCE RLS).
  Use plain `INSERT`/`UPDATE`, or upsert as `dba`/`system`. See [rls-policies.md](rls-policies.md).

### `RETURNING` on upsert

Add `RETURNING` to upsert to get back the inserted or updated row instead of only
`rows_affected`:

```sql
INSERT INTO [<namespace>.]<table> (<columns>) VALUES (<values>)
ON CONFLICT (<primary_key_column>) DO UPDATE SET <assignments>
RETURNING <column> [, <column> AS <alias> ...];
```

Response shape over `POST /v1/api/sql`:

- Without `RETURNING` → insert result with `rows_affected`.
- With `RETURNING` → query result with `schema`, `rows`, and `row_count` (same as `SELECT`).

Not supported yet:

- Plain `INSERT ... RETURNING` without `ON CONFLICT`.
- `UPDATE ... RETURNING` and `DELETE ... RETURNING`.

## Execute As

```sql
EXECUTE AS '<user_id>' (
  <single_statement>
);
```

Rules: exactly one statement, target ID must be single-quoted, valid for USER and STREAM table boundaries, and role authorization is required. Legacy inline `AS USER` syntax is not supported.

## Users

```sql
CREATE USER '<username>' WITH <PASSWORD '<password>' | OIDC '<auth_json>'> ROLE <user|service|dba|system> [EMAIL '<email>'] [STORAGE_MODE <table|region>] [STORAGE_ID '<storage_id>'];
CREATE USER INVITE '<email>' ROLE <user|service|dba|system> [EXPIRES_AT <unix_ms>] [STORAGE_MODE <table|region>] [STORAGE_ID '<storage_id>'];
ALTER USER '<username>' SET PASSWORD '<new_password>';
ALTER USER '<username>' SET ROLE <user|service|dba|system>;
ALTER USER '<username>' SET EMAIL '<new_email>';
DROP USER [IF EXISTS] '<username>';
```

## Storage

```sql
CREATE STORAGE <storage_id> TYPE '<filesystem|s3|gcs|azure>' [PATH '<path>'] [BUCKET '<bucket>'] [REGION '<region>'] [CREDENTIALS '<json>'] [CONFIG '<json>'];
ALTER STORAGE <storage_id> SET NAME '<name>';
ALTER STORAGE <storage_id> SET DESCRIPTION '<description>';
DROP STORAGE [IF EXISTS] <storage_id>;
SHOW STORAGES;
STORAGE CHECK <storage_id> [EXTENDED];
STORAGE FLUSH TABLE <namespace>.<table>;
STORAGE FLUSH ALL [IN [NAMESPACE] <namespace>];
STORAGE COMPACT TABLE <namespace>.<table>;
STORAGE COMPACT ALL [IN [NAMESPACE] <namespace>];
SHOW MANIFEST;
```

## Live Queries And Topics

```sql
SUBSCRIBE TO <namespace>.<table> [WHERE <condition>] [OPTIONS (last_rows=<n>, batch_size=<n>, from=<n>)];
KILL LIVE QUERY '<subscription_id>';
CREATE TOPIC <topic> [PARTITIONS <count>];
DROP TOPIC <topic>;
CLEAR TOPIC <topic>;
ALTER TOPIC <topic> ADD SOURCE <table> ON <INSERT|UPDATE|DELETE> [WHERE <filter>] [WITH (payload = '<key|full|diff>')];
ALTER TOPIC <topic> SET RETENTION WITH (retention_seconds = <seconds|NULL>, retention_max_bytes = <bytes|NULL>);
ALTER TOPIC <topic> CLEAR RETENTION;
CONSUME FROM <topic> [GROUP '<group_id>'] [FROM <LATEST|EARLIEST|offset>] [LIMIT <count>];
ACK <topic> GROUP '<group_id>' [PARTITION <partition_id>] UPTO OFFSET <offset>;
RESET CONSUMER GROUP '<group_id>' ON <topic> [PARTITION <partition_id>] TO <next_offset>;
```

## DataFusion Query Surface

KalamDB uses DataFusion for query planning/execution.

```sql
SELECT ... FROM ...;
SELECT ... FROM ... INNER JOIN ... ON ...;
WITH cte AS (SELECT ...) SELECT ... FROM cte;
SELECT ... FROM a UNION ALL SELECT ... FROM b;
```

Treat DataFusion SQL docs as the canonical reference for advanced query syntax
(window functions, advanced expressions, and planner behavior).

## Cluster, Backup, Functions

```sql
SELECT * FROM system.cluster ORDER BY is_leader DESC, node_id ASC;
SELECT * FROM system.cluster_groups ORDER BY group_id ASC;

EXPORT USER DATA;
SHOW EXPORT;
BACKUP DATABASE TO '<backup_path>';
RESTORE DATABASE FROM '<backup_path>';

SELECT SNOWFLAKE_ID();
SELECT UUID_V7();
SELECT ULID();
SELECT CURRENT_USER();
SELECT NOW();
```

Use CLI cluster meta-commands for cluster operations (`\cluster ...`).
`CLUSTER LIST` / `CLUSTER STATUS` SQL forms are deprecated.

Admin UI table editor data transfer is API-backed, not a SQL statement: user/shared tables can be exported as table-export ZIPs and imported from those ZIPs. User tables require a `user_id`; shared tables omit it. Export flushes hot RocksDB rows before packaging committed Parquet segments and manifest metadata. Import requires the target table to already exist with matching columns.
