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