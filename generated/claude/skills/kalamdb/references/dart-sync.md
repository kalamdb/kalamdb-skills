# Dart Sync (`kalam_sync`)

Local-first Flutter runtime on `kalam_link`. Type: `Kalam`.

**API tables:** [dart-sync-api.md](dart-sync-api.md) (open only when calling methods).
Live client: [dart-sdk.md](dart-sdk.md).

Sources: `link/sdks/dart/sync/`, `link/sdks/dart/generator/`.

## Install

```yaml
kalam_sync: ^0.6.0-rc.0
```

Import: `package:kalam_sync/kalam_sync.dart`.

Starter: `kalam init --yes --languages dart --template simple-live` then `kalam schema gen --languages dart`.

## Boot

```dart
final kalam = await Kalam.open(
  url: url,
  subject: userId, // required — cache identity
  authProvider: () async => Auth.jwt(await tokens.freshAccessToken()),
);
runApp(KalamScope(kalam: kalam, child: app));
```

`Kalam.open()` calls `KalamClient.init()`. Socket is lazy until subscribe/enqueue.

## Design

- One Drift DB per `(serverUrl, namespace, subject)`.
- `kalam schema gen --languages dart` writes `KalamTables.*` + row codecs. Do not hand-write duplicate models.
- Bidirectional: `insert`/`update`/`delete` + generic DML outbox.
- `replicaOnly`: generated actions + `optimisticInsert`. Direct DML throws.
- `watch()` is local. Use `watchWithSyncState()` for pending/failed/synced.
- Cancel `KalamSyncSubscription`. `KalamScope.read` in `initState`.

## Agent Rules

- Always pass `subject`.
- Live consumer SQL: `SELECT ... FROM ... WHERE ...` only.
- Custom actions: `kalam_sync_generator` / `build_runner`, not extra CRUD classes.
- Named `context.step` results persist; remote endpoints must honor the idempotency key.

Example: [examples/dart-sync.md](../examples/dart-sync.md).
Repo example: `link/sdks/dart/sync/example`.
