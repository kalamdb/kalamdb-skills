# TypeScript Client API

Method tables for `@kalamdb/client` / `KalamDBClient`. Overview: [typescript-client-sdk.md](typescript-client-sdk.md).

## `createClient(options)`

| Option | Default | Description |
|--------|---------|-------------|
| `url` | required | Server base URL |
| `authProvider` | required | `async () => Auth.basic \| Auth.jwt \| Auth.none` |
| `namespace` | — | Default namespace for SQL + file context |
| `wsLazyConnect` | `true` | Defer WebSocket until first live call |
| `pingIntervalMs` | `5000` | App-level WS keepalive (`0` = off) |
| `disableCompression` | `false` | `?compress=false` on WebSocket |
| `wasmUrl` | bundled | Override WASM URL/buffer |
| `authProviderMaxAttempts` | `3` | Retries resolving `authProvider` |
| `authProviderInitialBackoffMs` | `250` | First retry delay |
| `authProviderMaxBackoffMs` | `2000` | Retry cap |
| `onConnect` | — | Socket healthy |
| `onDisconnect` | — | `(reason: DisconnectReason)` |
| `onConnectionError` | — | Preferred connection/auth errors |
| `onError` | — | Alias of `onConnectionError` |
| `onReceive` / `onSend` | — | Debug raw WS frames |

## `Auth`

| Export | Description |
|--------|-------------|
| `Auth.basic(user, password)` | Exchanged for JWT before WebSocket |
| `Auth.jwt(token)` | Bearer access token |
| `Auth.none()` | Localhost unauthenticated mode |
| `buildAuthHeader(auth)` | `Authorization` header value |
| `resolveAuthProviderWithRetry` | Standalone retry helper |

## SQL

| Method | Returns | Notes |
|--------|---------|-------|
| `query(sql, params?)` | `QueryResponse` | Check `status`; does not throw on SQL error |
| `executeAsUser(sql, userId, params?)` | `QueryResponse` | Wraps `EXECUTE AS USER '...' (...)` |
| `queryWithFiles(sql, files, params?, onProgress?)` | `QueryResponse` | Multipart; **throws** on failure |
| `insert(table, data)` | `QueryResponse` | Convenience INSERT |
| `update(table, rowId, data)` | `QueryResponse` | Convenience UPDATE by `id` |
| `delete(table, rowId)` | `void` | Convenience DELETE by `id` |
| `queryOne(sql, params?)` | `RowData \| null` | **Ignores** `response.error` |
| `queryAll(sql, params?)` | `RowData[]` | **Ignores** `response.error` |
| `queryRows<T>(sql, tableName, params?)` | `KalamRow<T>[]` | FILE-aware rows; check `query` errors via raw `query` if needed |

`QueryResponse`: `{ status: 'success' | 'error', results?, took?, error?: { code, message, details? } }`.

Row cells in `queryOne` / `queryAll` are `KalamCellValue` (`.asString()`, `.asInt()`, `.asFile()`, `.asFileUrl(baseUrl, namespace, table)`, …).

## Live

| Method | Returns | Description |
|--------|---------|-------------|
| `live(sql, callback, options?)` | `Unsubscribe` | Materialized rows; strict subscription SQL |
| `liveTable(table, callback, options?)` | `Unsubscribe` | `SELECT * FROM table` |
| `liveEvents(sql, callback, options?)` | `Unsubscribe` | Raw protocol events |
| `createLiveQueryController(descriptor, options?)` | `LiveQueryController` | ORDER BY/LIMIT via descriptor |
| `unsubscribe(id)` | `Promise<void>` | By subscription id |
| `getSubscriptions()` | `SubscriptionInfo[]` | Active subscriptions |
| `getLastSeqId(id)` | `SeqId \| undefined` | Resume checkpoint |
| `requestNextBatch(id)` | `Promise<void>` | Manual batch fetch |

`LiveOptions`: `batchSize`, `lastRows`, `limit`, `from` (`SeqId`), `getKey`, `mapRow`, `onCheckpoint`, `onError`, `autoFetchBatches`.

Descriptor helpers: `createRawSqlLiveDescriptor`, `createLiveQueryDescriptor`, `normalizeLiveSql`, `projectLiveRows`, `parseLiveOrderBy`.

`LiveQueryController`: `start()`, `stop()`, `subscribe(listener)`, `getSnapshot()`.

## Connection

| Method | Description |
|--------|-------------|
| `initialize()` | Load WASM + wire handlers |
| `connect()` | Eager WebSocket (when `wsLazyConnect: false`) |
| `disconnect()` | Close socket; clear subscriptions |
| `destroy()` | Disconnect + free WASM |
| `isConnected()` | WebSocket active |
| `login(user, password)` | Basic → JWT |
| `refreshToken(refreshToken)` | Rotate access token |
| `onConnect` / `onDisconnect` / `onConnectionError` / … | Register handlers at runtime |

## Files

See [typescript-files.md](typescript-files.md). Key exports: `FileRef`, `BoundFileRef`, `KalamRow`, `parseFileRef`, `wrapRows`, `client.wrapRow`, `client.queryRows`.

**No `downloadFile()` on TS client** — use `BoundFileRef.downloadUrl()` or `fetch(url)`.

## Types (common)

`SeqId`, `UserId`, `KalamCellValue`, `RowData`, `Unsubscribe`, `UploadProgress`, `SubscriptionErrorEvent`, `LiveCheckpoint`, `ConnectionError`, `ErrorDetail`.
