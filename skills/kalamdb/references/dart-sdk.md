# Dart SDK

Use this file for `kalam_link`, Flutter/Dart app integration, auth-aware clients, live rows, and generated bindings.

## Sources

- `link/sdks/dart/README.md`
- `link/sdks/dart/lib/`
- `link/kalam-link-dart/`

## Install

```yaml
dependencies:
  kalam_link: ^0.4.1-beta.2
```

```bash
flutter pub add kalam_link
```

## Generated Boundary

Do not edit `link/sdks/dart/lib/src/generated` by hand. Regenerate and prepare SDK artifacts with `link/sdks/dart/build.sh`.

## Owns

- `KalamClient.init()` runtime initialization
- `KalamClient.connect()`
- `Auth.jwt`, `Auth.basic`, `Auth.none`
- SQL queries with `$1`, `$2`, ... parameter binding
- typed rows through `KalamCellValue` accessors
- `live()`, `liveTable()`, and `liveEvents()`
- `SeqId` resume and `onCheckpoint`
- `ConnectionHandlers`, keepalive control, SDK logging
- token refresh helpers

Topic consumer / ACK worker APIs and initial server bootstrap flows are intentionally outside the Dart SDK surface.

## Flutter Boot Rule

Call `KalamClient.init()` before other SDK calls. Avoid awaiting `KalamClient.connect()` during app boot; connect reactively from app/auth state instead.

## Examples

- `dart run example/simple-events/main.dart`
- `dart run example/chat-app/main.dart`