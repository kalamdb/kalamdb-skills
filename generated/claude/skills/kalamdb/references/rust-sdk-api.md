# Rust SDK API

Method tables for `kalam-client` / `KalamLinkClient`. Overview: [rust-sdk.md](rust-sdk.md).

## `KalamLinkClientBuilder`

| Method | Description |
|--------|-------------|
| `base_url(url)` | Required |
| `timeout(duration)` | HTTP receive timeout |
| `jwt_token(token)` | Static JWT |
| `auth(provider)` | Static `AuthProvider` |
| `auth_provider(ArcDynAuthProvider)` | Dynamic async auth |
| `max_retries(n)` | Idempotent query retries |
| `http_pool_max_idle_per_host(n)` | Pool sizing |
| `auth_refresher(callback)` | `TOKEN_EXPIRED` recovery |
| `timeouts(KalamLinkTimeouts)` | Full profile |
| `connection_options(ConnectionOptions)` | `ws_lazy_connect`, compression |
| `http_version(HttpVersion)` | `Http1`, `Http2`, `Auto` |
| `event_handlers(EventHandlers)` | Lifecycle callbacks |
| `build()` | `Result<KalamLinkClient>` |

## `AuthProvider`

| Constructor | Description |
|-------------|-------------|
| `basic_auth(user, password)` | Exchanged for JWT before use |
| `jwt_token(token)` | Bearer JWT |
| `system_user_auth(password)` | `root` + password |
| `none()` | Localhost bypass |

| Runtime | Description |
|---------|-------------|
| `set_auth(auth)` | `&mut self` |
| `update_shared_auth(auth)` | Shared update |
| `fresh_auth().await` | Resolve dynamic provider |
| `resolved_auth()` | Inspect source |

## SQL (`native-sdk`)

| Method | Feature | Description |
|--------|---------|-------------|
| `execute_query(sql, files, params, namespace)` | native | Primary SQL |
| `execute_query_with_progress(..., progress)` | native | With upload progress |
| `execute_query_with_tuples(...)` | native | Legacy upload tuples |
| `execute_with_files(...)` | file-uploads | Multipart `FILE("name")` |
| `execute_with_files_with_progress(...)` | file-uploads | With progress |

Args: `sql`, `Option<Vec<FileUpload>>`, `Option<Vec<QueryParam>>`, `Option<&str>` namespace.

## Files

| Method | Description |
|--------|-------------|
| `download_file(file_ref, namespace, table, target_user_id)` | Explicit table context |
| `download_bound_file(bound_file_ref, target_user_id)` | Bound context |

Types: `FileUpload`, `FileRef`, `BoundFileRef`, `FileDownload`, `TableId`, `QueryParam`, `KalamCellValue`.

## Live (`native-sdk`)

| Method | Returns | Description |
|--------|---------|-------------|
| `live(query)` | `LiveRowsSubscription` | Materialized rows |
| `live_with_config(SubscriptionConfig, LiveRowsConfig)` | `LiveRowsSubscription` | Full control |
| `live_events(query)` | `SubscriptionManager` | Raw `ChangeEvent` |
| `live_events_with_config(config)` | `SubscriptionManager` | Raw + options |

SQL shape: `SELECT ... FROM ... WHERE ...` only (no `ORDER BY`/`LIMIT`).

`SubscriptionOptions`: `with_batch_size`, `with_last_rows`, `with_from`.

`LiveRowsSubscription`: `next().await`, `close().await`, `subscription_id()`.

`SubscriptionManager`: `next().await`, `close().await`.

## Connection

| Method | Description |
|--------|-------------|
| `connect().await` | Open WebSocket; basic→JWT exchange |
| `disconnect().await` | Close WebSocket |
| `is_connected().await` | Ready (false during reconnect recovery) |
| `subscriptions().await` | Active `SubscriptionInfo` list |
| `cancel_subscription(id).await` | Unsubscribe |
| `event_handlers()` / `timeouts()` | Read config |

Default `ws_lazy_connect`: first `live()` auto-connects.

## Auth HTTP (`native-sdk`)

| Method | Description |
|--------|-------------|
| `login(user, password).await` | `/v1/api/auth/login` |
| `refresh_access_token(token).await` | `/v1/api/auth/refresh` |

## Optional Server

| Method | Feature |
|--------|---------|
| `health_check().await` | healthcheck |
| `cluster_health_check().await` | cluster |
| `check_setup_status().await` | setup |
| `server_setup(request).await` | setup |

## Consumer (`consumer` feature)

`client.consumer()` → `ConsumerBuilder` (needs `group_id`, `topic`).

| `TopicConsumer` | Description |
|-----------------|-------------|
| `poll().await` | Next batch |
| `poll_with_timeout(t).await` | Poll with timeout |
| `mark_processed(record)` | Pre-commit mark |
| `commit_sync().await` / `commit_async().await` | Commit offsets |
| `seek(offset)` / `position()` / `offsets()` | Offset control |
| `close().await` / `is_closed()` | Lifecycle |

Not `consume_batch` / `ack` — those names are outdated.
