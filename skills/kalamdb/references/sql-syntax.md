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
  DELETED_RETENTION_HOURS = <hours>,
  TTL_SECONDS = <seconds>,
  ACCESS_LEVEL = '<PUBLIC|PRIVATE|RESTRICTED>'
)];
```

DDL:

```sql
ALTER TABLE [<namespace>.]<table> ADD COLUMN <name> <type> [NOT NULL|NULL] [DEFAULT <value>];
ALTER TABLE [<namespace>.]<table> DROP COLUMN <name>;
ALTER TABLE [<namespace>.]<table> MODIFY COLUMN <name> <type> [NOT NULL|NULL];
ALTER TABLE [<namespace>.]<table> SET TBLPROPERTIES (ACCESS_LEVEL = '<PUBLIC|PRIVATE|RESTRICTED>');
DROP [USER|SHARED|STREAM] TABLE [IF EXISTS] [<namespace>.]<table>;
CREATE VIEW [<namespace>.]<view> AS <select_query>;
SHOW TABLES [IN [NAMESPACE] <namespace>];
DESCRIBE TABLE [<namespace>.]<table> [HISTORY];
SHOW STATS FOR TABLE [<namespace>.]<table>;
```

## DML

```sql
INSERT INTO [<namespace>.]<table> (<columns>) VALUES (<values>);
INSERT INTO [<namespace>.]<table> (<columns>) VALUES (...), (...);
UPDATE [<namespace>.]<table> SET <column> = <value> WHERE <condition>;
DELETE FROM [<namespace>.]<table> WHERE <condition>;
SELECT <columns> FROM [<namespace>.]<table> [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...];
```

## Execute As

```sql
EXECUTE AS '<user_id>' (
  <single_statement>
);
```

Rules: exactly one statement, target ID must be single-quoted, valid for USER and STREAM table boundaries, and role authorization is required. Legacy inline `AS USER` syntax is not supported.

## Users

```sql
CREATE USER '<username>' WITH <PASSWORD '<password>' | OAUTH | INTERNAL> ROLE <user|service|dba|system> [EMAIL '<email>'] [STORAGE_MODE <table|region>] [STORAGE_ID '<storage_id>'];
ALTER USER '<username>' SET PASSWORD '<new_password>';
ALTER USER '<username>' SET ROLE <user|service|dba|system>;
DROP USER [IF EXISTS] '<username>';
```

## Storage

```sql
CREATE STORAGE <storage_id> TYPE '<filesystem|s3|gcs|azure>' [PATH '<path>'] [BUCKET '<bucket>'] [REGION '<region>'] [CREDENTIALS '<json>'] [CONFIG '<json>'];
ALTER STORAGE <storage_id> SET NAME '<name>';
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
SUBSCRIBE TO <namespace>.<table> [WHERE <condition>] [OPTIONS (last_rows=<n>, batch_size=<n>, from_seq_id=<n>)];
KILL LIVE QUERY '<subscription_id>';
CREATE TOPIC <topic> [PARTITIONS <count>];
DROP TOPIC <topic>;
CLEAR TOPIC <topic>;
ALTER TOPIC <topic> ADD SOURCE <table> ON <INSERT|UPDATE|DELETE> [WHERE <filter>] [WITH (payload = '<key|full|diff>')];
CONSUME FROM <topic> [GROUP '<group_id>'] [FROM <LATEST|EARLIEST|offset>] [LIMIT <count>];
ACK <topic> GROUP '<group_id>' [PARTITION <partition_id>] UPTO OFFSET <offset>;
RESET CONSUMER GROUP '<group_id>' ON <topic> [PARTITION <partition_id>] TO <next_offset>;
```

## Cluster, Backup, Functions

```sql
CLUSTER LIST;
CLUSTER STATUS;
CLUSTER SNAPSHOT;
CLUSTER PURGE --UPTO <index>;
CLUSTER TRIGGER ELECTION;
CLUSTER TRANSFER LEADER <node_id>;
CLUSTER STEPDOWN;
CLUSTER CLEAR;

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