# TypeScript Client Example

```ts
import { Auth, SeqId, createClient } from '@kalamdb/client';

const client = createClient({
  url: 'http://localhost:2900',
  authProvider: async () => Auth.basic('alice', 'Secret123!'),
});

const stop = await client.live(
  `SELECT id, room, role, body, created_at
   FROM chat.messages
   WHERE room = $1
   ORDER BY created_at ASC`,
  (rows) => {
    console.log(rows.map((row) => row.body.asString()));
  },
  {
    lastRows: 100,
    limit: 200,
    from: SeqId.from('0'),
    onCheckpoint: ({ lastSeqId }) => console.log('checkpoint', lastSeqId.toString()),
    onError: (event) => console.error(event.code, event.message),
  },
);

await client.query(
  'INSERT INTO chat.messages (room, role, body) VALUES ($1, $2, $3)',
  ['main', 'user', 'hello'],
);

await stop();
await client.disconnect();
```