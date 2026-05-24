# TypeScript Consumer Example

```ts
import { Auth } from '@kalamdb/client';
import { createConsumerClient, runConsumer } from '@kalamdb/consumer';

const client = createConsumerClient({
  url: 'http://localhost:2900',
  authProvider: async () => Auth.basic('support-worker', 'Secret123!'),
});

await runConsumer({
  client,
  name: 'support-summary-worker',
  topic: 'support.inbox_events',
  groupId: 'support-summary-worker',
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