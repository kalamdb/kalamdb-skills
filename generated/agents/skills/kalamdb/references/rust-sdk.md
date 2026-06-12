# Rust SDK

`kalam-client` — async Rust apps, services, workers. Type: `KalamLinkClient`.

**API tables:** [rust-sdk-api.md](rust-sdk-api.md) (open only when calling methods).

Sources: `link/sdks/rust/`, `link/link-common/src/client/`.

## Install

```toml
kalam-client = "0.5"
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
```

Workspace version: `0.5.2-rc.2`. Path dep: `link/sdks/rust`.

## Features

| Feature | Use |
|---------|-----|
| `native-sdk` (default) | SQL, auth, live |
| `consumer` | `TopicConsumer` |
| `file-uploads` | Multipart FILE columns |
| `healthcheck` / `setup` / `cluster` | Server helpers |

## Quick Start

```rust
let client = KalamLinkClient::builder()
    .base_url("http://localhost:2900")
    .auth(AuthProvider::basic_auth("alice".into(), "secret".into()))
    .build()?;
client.connect().await?;
let resp = client.execute_query("SELECT 1", None, None, None).await?;
```

Prefer `live()` / `live_with_config()` for UI row state; `live_events()` for raw frames.

## Agent Rules

- `execute_query()`, not `query()`.
- `LiveRowsSubscription::next().await`, not callbacks.
- Consumer: `poll()` + `commit_sync()`/`commit_async()`, not `consume_batch`/`ack`.
- USER tables isolate per caller — no app-side tenancy filters.

Example: [examples/rust-sdk.md](../examples/rust-sdk.md).

Tests: `cd link/sdks/rust && NO_SERVER=true ./test.sh`
