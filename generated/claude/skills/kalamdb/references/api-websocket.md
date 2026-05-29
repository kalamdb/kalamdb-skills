# API And WebSocket

Use this file for REST routes, SQL API request/response shape, file uploads/downloads, topics HTTP API, and WebSocket protocol work.

## Sources

- `docs/api/api-reference.md`
- `docs/api/websocket-protocol.md`
- `backend/crates/kalamdb-api/`

## Route Map

Health:

- `GET /health`
- `GET /v1/api/healthcheck`
- `GET /v1/api/cluster/health`

SQL/files:

- `POST /v1/api/sql`
- `GET /v1/files/{namespace}/{table_name}/{subfolder}/{stored_name}`
- `POST /v1/api/table-exports`
- `GET /v1/api/table-exports/{job_id}`
- `GET /v1/table-exports/{export_id}`
- `POST /v1/api/table-imports`
- `GET /v1/api/table-imports/{job_id}`

WebSocket:

- `GET /v1/ws`

Auth:

- `POST /v1/api/auth/login`
- `POST /v1/api/auth/refresh`
- `POST /v1/api/auth/logout`
- `GET /v1/api/auth/me`
- `POST /v1/api/auth/setup`
- `GET /v1/api/auth/status`

Topics:

- `POST /v1/api/topics/consume`
- `POST /v1/api/topics/ack`

## SQL API

`POST /v1/api/sql` requires bearer auth and accepts JSON or multipart form data.

JSON body:

```json
{
  "sql": "SELECT * FROM default.users WHERE id = $1",
  "params": [123],
  "namespace_id": "default"
}
```

Multipart FILE uploads use SQL placeholders like `FILE("contract")` and multipart part names like `file:contract`.

Success response includes `status`, `results`, and `took`. Each result may contain `schema`, `rows`, `row_count`, `message`, and always `as_user`.

Errors include stable `error.code` values such as `INVALID_SQL`, `TABLE_NOT_FOUND`, `PERMISSION_DENIED`, `NOT_LEADER`, `FILE_TOO_LARGE`, `MISSING_FILE`, and `INTERNAL_ERROR`.

## Table Transfer API

Admin UI table editor transfer endpoints require bearer auth and role `service`, `dba`, or `system`.

- `POST /v1/api/table-exports` starts a `table_export` job for one user/shared table scope. User tables require `user_id`; shared tables omit it.
- `GET /v1/api/table-exports/{job_id}` polls export status. Completed exports include `download_url`.
- `GET /v1/table-exports/{export_id}` downloads the completed ZIP.
- `POST /v1/api/table-imports` accepts multipart `namespace_id`, `table_name`, `table_type`, optional `user_id`, and `file` ZIP, then starts a `table_import` job.
- `GET /v1/api/table-imports/{job_id}` polls import status.

Table export flushes hot RocksDB rows first, then writes a ZIP with committed Parquet segments and KalamDB manifest metadata. Table import accepts only that table-export ZIP format, requires matching target table columns, and registers imported Parquet through the manifest service.

## Topic HTTP API

Topic endpoints require bearer auth and role `service`, `dba`, or `system`.

Consume accepts `topic_id`, optional `group_id`, `start`, `limit`, optional `partition_id`, and `timeout_seconds`. `start` can be `Latest`, `Earliest`, or `{ "Offset": 123 }`.

Ack accepts `topic_id`, `group_id`, `partition_id`, and `upto_offset`.

## WebSocket Protocol

Endpoint: `ws://<host>:2900/v1/ws`.

The HTTP upgrade can happen before auth. The client must then send:

```json
{"type":"authenticate","method":"jwt","token":"<JWT_TOKEN>"}
```

Subscribe:

```json
{
  "type": "subscribe",
  "subscription": {
    "id": "orders_live",
    "sql": "SELECT id, status, _seq FROM app.orders WHERE status = 'open'",
    "options": {"batch_size": 500, "last_rows": 100, "from_seq_id": 12345}
  }
}
```

Client messages: `authenticate`, `subscribe`, `next_batch`, `unsubscribe`.

Server messages: `auth_success`, `auth_error`, `subscription_ack`, `initial_data_batch`, `change`, `error`.

Clients must handle text JSON and gzip-compressed binary JSON server frames. Clients must not send binary frames.