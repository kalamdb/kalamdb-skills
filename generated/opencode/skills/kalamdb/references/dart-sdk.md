# Dart SDK

`kalam_link` — Flutter/Dart queries and live rows. Type: `KalamClient`.

**API tables:** [dart-sdk-api.md](dart-sdk-api.md) (open only when calling methods).

Sources: `link/sdks/dart/lib/src/kalam_client.dart`, `link/kalam-link-dart/`.

## Install

```yaml
kalam_link: ^0.5.2-rc.2
```

Import: `package:kalam_link/kalam_link.dart`.

## Boot (Flutter)

```dart
await KalamClient.init();  // OK before runApp()
runApp(...);
// connect() after first frame — not before runApp()
```

Do not add server bootstrap/health-check helpers in Dart. Use CLI/`kalam init` and the server docs.

## Design

- Rust bridge via `flutter_rust_bridge`; shared behavior with `kalam-client`.
- UI: `live()` / `liveTable()`. Debug/raw: `liveEvents()`.
- Live SQL: `SELECT ... FROM ... WHERE ...` only.
- `kalam schema gen --languages dart` writes `KalamTableSpec` row codecs for `kalam_sync` from `schema.sql`. Custom action queues stay with `kalam_sync_generator` / `build_runner`.
- Local-first Flutter: [dart-sync.md](dart-sync.md) (`Kalam.open`, `KalamScope`, table bindings).
- Do not edit `lib/src/generated` or CLI `lib/generated/kalam.dart` (`kalam schema gen` output).

## Agent Rules

- Credentials via `authProvider` only; `Auth.none()` not `Auth.none`.
- `live()` returns `Stream` — cancel subscription, no `.stop()`.
- Check `result.success` before `result.rows`.

Example: [examples/dart-sdk.md](../examples/dart-sdk.md).

Repo examples: prefer `kalam init --languages dart --template simple-live`. Protocol demos: `dart run example/simple-events/main.dart`, `example/chat-app/main.dart`. Flutter local-first: `link/sdks/dart/sync/example`.
