# Dart SDK API

Method tables for `kalam_link` / `KalamClient`. Overview: [dart-sdk.md](dart-sdk.md).

## Static

| Method | Returns | Description |
|--------|---------|-------------|
| `KalamClient.init()` | `Future<void>` | Rust runtime (idempotent) |
| `KalamClient.connect({...})` | `Future<KalamClient>` | Create client |
| `resolveAuthWithRetry(provider, {...})` | `Future<Auth>` | Auth retry helper |

## `connect()` Params

| Param | Default | Notes |
|-------|---------|-------|
| `url` | required | Base URL |
| `authProvider` | `Auth.none()` | No separate `auth:` param |
| `wsLazyConnect` | `true` | WS on first live call |
| `timeout` | `30s` | HTTP timeout |
| `maxRetries` | `3` | Idempotent queries |
| `connectionHandlers` | null | Lifecycle hooks |
| `keepaliveInterval` | server | `Duration.zero` disables |
| `logLevel` / `logListener` | — | Diagnostics |
| `authProviderMaxAttempts` | `3` | Provider retries |
| `authProviderInitialBackoff` | `250ms` | |
| `authProviderMaxBackoff` | `2s` | |

## `Auth`

| Factory | Use |
|---------|-----|
| `Auth.basic(user, password)` | Auto JWT exchange |
| `Auth.jwt(token)` | Bearer |
| `Auth.none()` | Local bypass |

| Instance | Description |
|----------|-------------|
| `login(user, password)` | Login + switch to JWT |
| `refreshToken(refreshToken)` | Refresh access token |
| `refreshAuth({...})` | Re-run `authProvider` |

## Queries

| Method | Description |
|--------|-------------|
| `query(sql, {params, namespace})` | HTTP SQL `$1..$n` |
| `queryWithFiles(sql, {files, params, namespace})` | `FILE("ph")` + `KalamFileUpload` |
| `downloadFile(fileRef, {namespace, table, targetUserId})` | File bytes |

`QueryResponse`: `success`, `results`, `rows`, `columns`, `tookMs`, `error`. Cells: `KalamCellValue` (`asString()`, `asInt()`, `asFile()`, …).

`TOKEN_EXPIRED` → one `refreshAuth()` retry.

## Live (all return `Stream`)

| Method | Returns | Description |
|--------|---------|-------------|
| `liveEvents(sql, {...})` | `Stream<ChangeEvent>` | Raw events |
| `live<T>(sql, {...})` | `Stream<List<T>>` | Materialized rows |
| `liveTable<T>(name, {...})` | `Stream<List<T>>` | `SELECT * FROM name` |

Options: `batchSize`, `lastRows`, `from`/`SeqId`, `subscriptionId`, `limit`, `keyColumns`, `mapRow`, `onCheckpoint`, `onError` (events only).

Cancel via `StreamSubscription.cancel()` — no `.stop()`.

`live()` has **no** `params` arg; bind in SQL `WHERE` or use `query()` for parameterized reads.

## Connection

| Method | Description |
|--------|-------------|
| `isConnected` | `Future<bool>` |
| `disconnectWebSocket()` | Close WS |
| `reconnectWebSocket()` | Refresh auth + reopen |
| `getSubscriptions()` | Active subs |
| `dispose()` | Release client |

`ConnectionHandlers`: `onConnect`, `onDisconnect`, `onError`, `onReceive`, `onSend`.
