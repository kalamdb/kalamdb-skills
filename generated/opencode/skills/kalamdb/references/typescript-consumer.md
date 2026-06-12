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
- connection lifecycle hooks on the consumer client and runtime: `onConnect()`, `onConnectionError()`, legacy `onError()`
- deprecated compatibility alias `runAgent()`

Topic HTTP endpoints require bearer auth and role `service`, `dba`, or `system`.

## Runtime Guidance

Use `runConsumer()` for production workers. It handles retries, ACK ordering, reconnects, and high-level change metadata.

Keep the worker lifecycle aligned across both layers:

- `createConsumerClient()` exposes `onConnect()` and `onConnectionError()` on the client itself
- `runConsumer()` exposes the same connection lifecycle concept for the supervised worker loop
- `onError()` remains a compatibility alias where older code still expects it

Prefer `onConnectionError()` for new code. Consumer connection errors include richer worker metadata than the base client callback:

- `message`
- `recoverable`
- `attempt`
- optional `backoffMs`
- optional `context`
- raw `error`

Fatal configuration and bootstrap failures, such as invalid URLs or auth/bootstrap errors, should be treated as `recoverable: false`. Temporary reachability failures remain retryable.

`runConsumer()` exposes changed row/event data through `change.data`. Metadata stays on `change`: `user`, `op`, `key`, `timestampMs`, `partitionId`, `offset`, `topic`, and `groupId`.

Do not duplicate message metadata onto `ctx`; `ctx` is for execution helpers, retry state, SQL helpers, ACK, and optional LLM helpers.

Add `changeParser` only for intentionally custom payload shapes.

## ACK Rule

`CONSUME FROM ... GROUP ...` reserves delivery but does not commit progress. ACK after successful processing. If ACK is not sent before visibility timeout, messages can redeliver.

Use one-shot `consumeBatch()` for explicit polling and lower-level `consumer().run()` only when the high-level runtime is too opinionated.

## Connection Retry Guidance

Use `onConnect()` to mark the first healthy worker poll and later recoveries. Use `onConnectionRestored()` when the caller specifically needs recovery-only logging.

Use `onConnectionError()` to surface final connection failure state after retry classification. The runtime delegates to the consumer client underneath, so do not invent a separate error model in wrappers.