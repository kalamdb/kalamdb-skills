# TypeScript Consumer Example

```ts
import { Auth } from '@kalamdb/client';
import { createConsumerClient, runConsumer } from '@kalamdb/consumer';

const client = createConsumerClient({
  url: 'http://localhost:2900',
  authProvider: async () => Auth.basic('support-worker', 'Secret123!'),
  onConnect: () => {
    console.log('worker client connected');
  },
  onConnectionError: ({ message, recoverable, attempt }) => {
    console.error(`worker client ${recoverable ? 'retryable' : 'fatal'} error on attempt ${attempt}: ${message}`);
  },
});

await runConsumer({
  client,
  name: 'support-summary-worker',
  topic: 'support.inbox_events',
  groupId: 'support-summary-worker',
  onConnect: () => {
    console.log('worker loop healthy');
  },
  onConnectionError: ({ message, recoverable, attempt }) => {
    console.error(`worker loop stopped after attempt ${attempt}: ${recoverable ? 'retryable' : 'fatal'} ${message}`);
  },
  retry: {
    maxAttempts: 3,
    initialBackoffMs: 250,
    maxBackoffMs: 2_000,
  },
  onChange: async (ctx, change) => {
    const user = String(change.user).trim();
    const body = String(change.data.body ?? '').trim();
    if (!user || !body) return;

    await ctx.sql(
      `EXECUTE AS '${user}' (
        INSERT INTO support.inbox (room, role, body)
        VALUES ('main', 'assistant', $1)
      )`,
      [`Support summary: ${body.slice(0, 120)}`],
    );
  },
});
```