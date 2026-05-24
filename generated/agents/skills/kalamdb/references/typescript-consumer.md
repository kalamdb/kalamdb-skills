# TypeScript Consumer

Use this file for `@kalamdb/consumer`, topic workers, ACK semantics, `runConsumer()`, and worker/agent runtime code.

## Sources

- `link/sdks/typescript/consumer/`
- `link/sdks/typescript/consumer/README.md`

## Install

```bash
npm i @kalamdb/client @kalamdb/consumer
```

## Owns

- `createConsumerClient()`
- `consumeBatch()`
- `ack()`
- `consumer().run()`
- `runConsumer()`
- deprecated compatibility alias `runAgent()`

Topic HTTP endpoints require bearer auth and role `service`, `dba`, or `system`.

## Runtime Guidance

Use `runConsumer()` for production workers. It handles retries, ACK ordering, reconnects, and high-level change metadata.

`runConsumer()` exposes changed row/event data through `change.data`. Metadata stays on `change`: `user`, `op`, `key`, `timestampMs`, `partitionId`, `offset`, `topic`, and `groupId`.

Do not duplicate message metadata onto `ctx`; `ctx` is for execution helpers, retry state, SQL helpers, ACK, and optional LLM helpers.

Add `changeParser` only for intentionally custom payload shapes.

## ACK Rule

`CONSUME FROM ... GROUP ...` reserves delivery but does not commit progress. ACK after successful processing. If ACK is not sent before visibility timeout, messages can redeliver.

Use one-shot `consumeBatch()` for explicit polling and lower-level `consumer().run()` only when the high-level runtime is too opinionated.