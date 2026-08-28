# Dart Sync API

Method tables for `kalam_sync` / `Kalam`. Overview: [dart-sync.md](dart-sync.md).

## `Kalam`

| Method | Returns | Description |
|--------|---------|-------------|
| `Kalam.open({url, subject, ...})` | `Future<Kalam>` | Open account-scoped Drift cache; lazy socket |
| `Kalam.catchUp({...})` | `Future<KalamCatchUpResult>` | Bounded headless replay from checkpoint |
| `Kalam.id()` | `String` | RFC 4122 v4 id |
| `table(spec)` | `KalamTableBinding<T>` | Bind generated `KalamTableSpec` |
| `subscribe(consumer)` | `Future<KalamSyncSubscription>` | Start widget/service-scoped live consumer |
| `pause()` / `resume()` | `Future<void>` | Lifecycle; resume from SQLite checkpoint |
| `dispose()` | `Future<void>` | Close sync, transport, database |

`open()` params: `url`, `subject` (required), `authProvider`, `namespace` (default `default`), `actionDefinitions`, `keepaliveInterval`.

## `KalamTableBinding<T>`

| Method | Description |
|--------|-------------|
| `consumer({sql, batchSize, params})` | Durable live consumer for this table |
| `insert` / `update` / `delete` | Bidirectional only; local write + DML outbox |
| `optimisticInsert` / `optimisticDelete` | Overlay for custom actions |
| `watch()` | Local decoded rows |
| `watchWithSyncState()` | Rows + `KalamSyncedRow.sync` |

`replicaOnly` → `insert`/`update`/`delete` throw.

## `KalamScope`

| Method | Use |
|--------|-----|
| `KalamScope(kalam:, child:)` | Provide session; pauses on background |
| `KalamScope.of(context)` | Depend on session (rebuilds) |
| `KalamScope.read(context)` | `initState` — no rebuild |

## Actions

`kalam_sync_generator`: `@KalamActionPayload()`, `@KalamActionModule(namespace:)`, `@KalamAction(name:)`.

`build_runner` emits `<module>ActionsDefinitions` and `<Module>Queue`.

| `KalamActionContext` | Description |
|----------------------|-------------|
| `idempotencyKey` | Action UUID |
| `step(name, run:, encode:, decode:)` | At-most-once named step |
| `queryWithFiles(stepName, {sql, files, params})` | FILE upload as a step |

Queue `enqueue` / generated methods: `orderingKey`, `optimistic: table.optimisticInsert(row)`.
