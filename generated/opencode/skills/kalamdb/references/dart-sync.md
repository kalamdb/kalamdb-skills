# Dart Sync (`kalam_sync`)

Local-first Flutter runtime on `kalam_link`. Type: `Kalam`. Uses **Drift + SQLite** as the on-device cache. This is the Dart typed/ORM path — not `kalam_link` alone.

**API tables:** [dart-sync-api.md](dart-sync-api.md) (open only when calling methods).
Live client (no cache): [dart-sdk.md](dart-sdk.md).
ORM map: [orms.md](orms.md).

Sources: `link/sdks/dart/sync/`, `link/sdks/dart/generator/`.

## Install

```yaml
kalam_sync: ^0.6.0-rc.0
```

Import: `package:kalam_sync/kalam_sync.dart`.

Starter: `kalam init --yes --languages dart --template simple-live` then `kalam schema gen --languages dart`.

`kalam_sync` already depends on `kalam_link`. Do not add `sqflite`, Hive, or a second Drift `@DriftDatabase` for the same Kalam rows.

## When To Use

| Use `kalam_sync` | Use `kalam_link` instead |
|------------------|--------------------------|
| Offline-capable Flutter lists (todos, notes, settings) | One-shot HTTP SQL or a live stream with no cache |
| Local-first chat that must keep working without a socket | Debug/protocol demos, CLI-style Dart scripts |
| Headless isolate catch-up into the same SQLite file | No on-device database at all |
| Queued DML / custom actions that survive process restart | Server-authoritative STREAM UI with no local writes |

Shared conversations still need `CREATE POLICY` on the server. Sync does not implement RLS locally.

## Boot

```dart
final kalam = await Kalam.open(
  url: url,
  subject: userId, // required — cache identity
  authProvider: () async => Auth.jwt(await tokens.freshAccessToken()),
);
runApp(KalamScope(kalam: kalam, child: app));
```

`Kalam.open()` calls `KalamClient.init()` and opens SQLite immediately. Socket is lazy until subscribe/enqueue.

## Drift / SQLite (how the cache works)

`Kalam.open()` uses `KalamFlutterDatabaseFactory` unless you pass `databaseFactory`. That factory calls `drift_flutter.driftDatabase(name: identity.databaseName, native: DriftNativeOptions(shareAcrossIsolates: true))`.

- **One SQLite file per account:** `KalamAccountIdentity(serverUrl, namespace, subject)`. Name is `kalam_sync_<fnv1a64(url|ns|subject)>`. Switching users must `dispose()` and `open()` with the new `subject` — never reuse another user's file.
- **Drift owns sync internals**, not your app schema. `@DriftDatabase` `KalamSyncDatabase` tables: `kalam_cached_rows`, `kalam_actions`, `kalam_action_steps`, `kalam_checkpoints`, `kalam_row_states` (schemaVersion 3).
- **App tables** come from `kalam schema gen --languages dart` → `KalamTables.*` + row codecs. Bind with `kalam.table(KalamTables.todos)`. Do not hand-write Drift `@DataClassName` models that duplicate `schema.sql`.
- `insert`/`update`/`delete` apply the local row and enqueue DML in **one Drift transaction**. Applied server row + sequence checkpoint are another transaction. ACK happens only after that commit (`kalam_link.liveEventsWithAck`).
- `watch()` / `watchWithSyncState()` read SQLite. They keep working offline.
- `KalamScope` pauses/resumes with the Flutter lifecycle. `pause()` / `resume()` cancel and reopen live SQL from the SQLite-committed checkpoint.
- Tests: `import 'package:kalam_sync/drift.dart';` then implement `KalamDatabaseFactory` returning `KalamSyncDatabase(NativeDatabase.memory())` (or `NativeDatabase(File(...))`). Pass it to `Kalam.open(databaseFactory: ...)`.

USER vs SHARED: the **server** still enforces isolation and RLS. The Drift cache only stores rows the live query already returned. For shared conversations, subscribe SQL plus `CREATE POLICY` on the server — do not filter `user_id` in Dart for USER tables.

```dart
messages.consumer(
  sql: r'SELECT * FROM app.messages WHERE conversation_id = $1',
  params: [conversationId],
);
```

Headless isolate (same SQLite identity as the UI, then disconnect). Bind the table first, or pass the same `table.consumer(...)` you would subscribe with:

```dart
final todos = kalam.table(KalamTables.todos);
await Kalam.catchUp(
  url: serverUrl,
  subject: userId,
  namespace: 'app',
  authProvider: () async => Auth.jwt(await tokens.freshAccessToken()),
  consumers: [todos.consumer(sql: 'SELECT * FROM app.todos')],
  rowLimit: 100,
);
```

## Design

- Bidirectional: `insert`/`update`/`delete` + generic DML outbox.
- `replicaOnly`: generated actions + `optimisticInsert`. Direct DML throws. STREAM tables generate as `replicaOnly`; USER/SHARED generate as `bidirectional`. Override with `spec.copyWith(mode: ...)`.
- Cancel `KalamSyncSubscription`. `KalamScope.read` in `initState`.
- Custom actions: `kalam_sync_generator` / `build_runner`, not extra CRUD classes. Drift still owns row types.

## Agent Rules

- Always pass `subject`.
- Live consumer SQL: `SELECT ... FROM ... WHERE ...` only.
- Named `context.step` results persist; remote endpoints must honor the idempotency key.
- Prefer `kalam_sync` for new Flutter apps. Use `kalam_link` only when you do not want a local cache.

Example: [examples/dart-sync.md](../examples/dart-sync.md).
Repo example: `link/sdks/dart/sync/example`.

