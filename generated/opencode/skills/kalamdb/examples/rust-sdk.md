# Rust SDK Example

```rust
use std::time::Duration;

use kalam_client::{
    AuthProvider, KalamLinkClient, LiveRowsConfig, LiveRowsEvent, SubscriptionConfig,
    SubscriptionOptions,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = KalamLinkClient::builder()
        .base_url("http://localhost:2900")
        .auth(AuthProvider::basic_auth("alice".into(), "Secret123!".into()))
        .timeout(Duration::from_secs(30))
        .build()?;

    client.connect().await?;

    let sql = "
        SELECT id, body
        FROM chat.messages
        WHERE room = 'main'
    ";

    let mut config = SubscriptionConfig::new("messages", sql);
    config.options = Some(
        SubscriptionOptions::new()
            .with_last_rows(50)
            .with_batch_size(50),
    );

    let mut live = client
        .live_with_config(
            config,
            LiveRowsConfig {
                limit: Some(50),
                ..LiveRowsConfig::default()
            },
        )
        .await?;

    while let Some(event) = live.next().await {
        match event? {
            LiveRowsEvent::Rows { rows, last_seq_id, .. } => {
                for row in rows {
                    println!("{}: {}", row.get("id").and_then(|v| v.as_text()).unwrap_or(""), row.get("body").and_then(|v| v.as_text()).unwrap_or(""));
                }
                if let Some(seq) = last_seq_id {
                    println!("checkpoint {seq}");
                }
            }
            LiveRowsEvent::Error { code, message, .. } => {
                eprintln!("live error {code}: {message}");
                break;
            }
        }
    }

    live.close().await?;
    client.disconnect().await;
    Ok(())
}
```

For one-shot SQL without live rows:

```rust
let response = client
    .execute_query(
        "SELECT id, body FROM chat.messages WHERE room = $1",
        None,
        Some(vec![kalam_client::QueryParam::from("main")]),
        None,
    )
    .await?;
```
