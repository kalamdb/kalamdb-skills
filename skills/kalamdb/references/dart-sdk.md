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

## Design

- Rust bridge via `flutter_rust_bridge`; shared behavior with `kalam-client`.
- UI: `live()` / `liveTable()`. Debug/raw: `liveEvents()`.
- Live SQL: `SELECT ... FROM ... WHERE ...` only.
- No topic consumers or server setup in Dart SDK.
- Do not edit `lib/src/generated` or CLI `lib/generated/kalam.dart` (placeholder gen).

## Agent Rules

- Credentials via `authProvider` only; `Auth.none()` not `Auth.none`.
- `live()` returns `Stream` — cancel subscription, no `.stop()`.
- Check `result.success` before `result.rows`.

Example: [examples/dart-sdk.md](../examples/dart-sdk.md).

Repo examples: `dart run example/simple-events/main.dart`, `example/chat-app/main.dart`.
