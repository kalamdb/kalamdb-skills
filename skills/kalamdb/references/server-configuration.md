# Server Configuration

Use this file when editing `server.toml`, `backend/server.toml`, `backend/server.example.toml`, config structs, env overrides, or deployment runbooks.

## Source Of Truth

- Schema and defaults: `backend/crates/kalamdb-configs/src/config/types.rs`
- Example template: `backend/server.example.toml`
- Backend dev config: `backend/server.toml`
- Root/local config: `server.toml`

Runtime config only belongs in TOML. Namespace and storage entity metadata belongs in system tables.

## Top-Level Keys

| Key | Purpose |
| --- | --- |
| `transaction_timeout_secs` | Maximum lifetime for an open transaction before abort. |
| `max_transaction_buffer_bytes` | Maximum in-memory transaction overlay size before rejecting new writes. |

## `[server]`

| Key | Purpose |
| --- | --- |
| `host` | HTTP bind address. Use `127.0.0.1` for local-only, `0.0.0.0` for container/listen-all. |
| `port` | HTTP port, default `2900`. |
| `public_origin` | Browser-visible origin for Admin UI API and WebSocket traffic. Empty means `http://localhost:{port}`. |
| `workers` | Actix workers; `0` means auto. Each worker costs idle memory. |
| `api_version` | Version prefix, normally `v1`. |
| `enable_http2` | Enable cleartext HTTP/2 negotiation. |
| `ui_path` | Optional static Admin UI build path. |

## `[storage]`

| Key | Purpose |
| --- | --- |
| `data_path` | Base path for RocksDB, Parquet storage, streams, snapshots, exports, and temp data. |
| `shared_tables_template` | Local storage path template for shared tables. Placeholders: `{namespace}`, `{tableName}`. |
| `user_tables_template` | Local storage path template for user tables. Placeholders: `{namespace}`, `{tableName}`, `{userId}`. |

`[storage.remote_timeouts]`: `request_timeout_secs`, `connect_timeout_secs`.

`[storage.rocksdb]`: `block_cache_size`, `max_background_jobs`, `max_open_files`, `sync_writes`, `disable_wal`, `compact_on_startup`.

`[storage.rocksdb.cf_profiles.<profile>]`: `write_buffer_size`, `max_write_buffers` for `system_meta`, `system_index`, `hot_data`, `hot_index`, and `raft`.

## Query, Flush, Retention, Streams

`[datafusion]`: `memory_limit`, `query_parallelism`, `max_partitions`, `batch_size`.

`[flush]`: `default_row_limit`, `default_time_interval`, `flush_batch_size`, `check_interval_seconds`.

`[flush.compaction]`: `enabled`, `min_eligible_segments`, `max_segments_per_run`, `user_max_segment_rows`, `shared_max_segment_rows`.

`[retention]`: `enable_dba_stats`, `dba_stats_retention_days`.

`[stream]`: `default_ttl_seconds`, `default_max_buffer`, `eviction_interval_seconds`.

`[manifest_cache]`: `eviction_interval_seconds`, `max_entries`, `eviction_ttl_days`.

`[topics]`: `visibility_timeout_secs`, `default_retention_seconds`, `default_retention_max_bytes`, `retention_check_interval_seconds`, `retention_batch_size`.

## Limits And Execution

`[limits]`: `max_message_size`, `max_query_limit`, `default_query_limit`.

`[execution]`: `handler_timeout_seconds`, `max_parameters`, `max_parameter_size_bytes`, `sql_plan_cache_max_entries`, `sql_plan_cache_ttl_seconds`.

`[files]`: `max_size_bytes`, `max_files_per_request`, `max_files_per_folder`, `staging_path`, `allowed_mime_types`.

## Logging And Tracing

`[logging]`: `level`, `logs_path`, `log_to_console`, `format`, `slow_query_threshold_ms`.

`[logging.targets]`: optional per-target log levels such as `datafusion = "info"`, `arrow = "warn"`, `parquet = "warn"`.

`[logging.otlp]`: `enabled`, `endpoint`, `protocol`, `service_name`, `timeout_ms`.

## Performance And Rate Limiting

`[performance]`: `request_timeout`, `keepalive_timeout`, `max_connections`, `backlog`, `tokio_worker_threads`, `worker_max_blocking_threads`, `client_request_timeout`, `client_disconnect_timeout`, `max_header_size`.

`[rate_limit]`: `max_queries_per_sec`, `max_messages_per_sec`, `max_subscriptions_per_user`, `max_auth_requests_per_ip_per_sec`, `max_connections_per_ip`, `max_requests_per_ip_per_sec`, `request_body_limit_bytes`, `ban_duration_seconds`, `enable_connection_protection`, `cache_max_entries`, `cache_ttl_seconds`.

## Security, CORS, WebSocket

`[security]`: `max_request_body_size`, `max_ws_message_size`, `strict_ws_origin_check`, `trusted_proxy_ranges`.

`[security.cors]`: `allowed_origins`, `allowed_methods`, `allowed_headers`, `expose_headers`, `allow_credentials`, `max_age`, `allow_private_network`.

`[websocket]`: `client_timeout_secs`, `auth_timeout_secs`, `heartbeat_interval_secs`.

Important CORS rule: do not combine wildcard origins with credentialed browser auth in production. Bind-to-all-interface deployments need explicit browser allowlists.

## Auth, OIDC, Users

Canonical auth config lives under `[auth]`. Older local files may still deserialize the legacy authentication table, but new examples and docs should use `[auth]`.

`[auth]` keys: `root_password`, `bcrypt_cost`, `min_password_length`, `max_password_length`, `jwt_expiry_hours`, `cookie_secure`, `enforce_password_complexity`, `jwt_secret`, `allow_remote_setup`, `jwt_trusted_issuers`, `pg_auth_token`.

`[auth.local]`: `enabled`. When false, password login and password setup are rejected server-side.

`[auth.oidc]`: `enabled`, `display_name`, `issuer`, `client_id`, optional `client_secret`, `scopes`, `auto_provision`, `default_role`, `broker_device_flow_enabled`, optional `device_authorization_endpoint`. KalamDB supports one configured OIDC provider per server. Use the IdP redirect URIs `/ui/oauth/callback` for Admin UI browser login and `http://127.0.0.1:8787/callback` for CLI browser login.

Local Dex development config should keep `[auth.local].enabled = true`, set `[auth.oidc]` to issuer `http://127.0.0.1:5556`, public client `client`, scopes `openid`, `email`, `profile`, and `auto_provision = true`.

Clients discover local/OIDC login capability with `GET /v1/api/auth/login-options`; avoid documenting provider-specific client endpoints.

`[user_management]`: `deletion_grace_period_days`, `cleanup_job_schedule`.

If older local config files contain keys not present in `types.rs`, verify behavior before documenting them as supported.

## Shutdown, Jobs, Cluster, TLS

`[shutdown.flush]`: `timeout`.

`[jobs]`: `max_concurrent`, `max_retries`, `retry_backoff_ms`, `wal_cleanup_interval_seconds`.

`[rpc_tls]`: `enabled`, `ca_cert`, `server_cert`, `server_key`, `require_client_cert`. Values may be file paths or inline PEM strings.

`[cluster]`: `cluster_id`, `node_id`, `rpc_addr`, `api_addr`, `user_shards`, `shared_shards`, `heartbeat_interval_ms`, `election_timeout_ms`, `snapshot_policy`, `max_snapshots_to_keep`, `replication_timeout_ms`, `reconnect_interval_ms`, `peer_wait_max_retries`, `peer_wait_initial_delay_ms`, `peer_wait_max_delay_ms`.

`[[cluster.peers]]`: `node_id`, `rpc_addr`, `api_addr`, `rpc_server_name`.

Prefer top-level `[rpc_tls]` over older nested cluster TLS examples.