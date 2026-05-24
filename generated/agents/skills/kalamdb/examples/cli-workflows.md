# CLI Workflow Examples

## First Query

```bash
kalam --url http://127.0.0.1:2900 --user admin --password AdminPass123! \
  --command "SELECT * FROM system.namespaces LIMIT 10"
```

## File Execution

```bash
kalam --url http://127.0.0.1:2900 --file setup.sql --format json
```

## Live Query

```bash
kalam --subscribe "SUBSCRIBE TO app.messages WHERE room = 'main' OPTIONS (last_rows=50, batch_size=100)"
```

## Credential Flow

```bash
kalam login --instance local --user admin --password AdminPass123!
kalam whoami --instance local
kalam --instance local --command "SHOW TABLES IN app"
kalam logout --instance local
```