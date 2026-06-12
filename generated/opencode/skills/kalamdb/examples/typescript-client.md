# TypeScript Client Example

Connection, query error handling, live resume, and ordered live via controller.

```ts
import {
  Auth,
  SeqId,
  createClient,
  createRawSqlLiveDescriptor,
} from '@kalamdb/client';

const client = createClient({
  url: 'http://localhost:2900',
  namespace: 'chat',
  authProvider: async () => Auth.basic('alice', 'Secret123!'),
  onConnect: () => console.log('realtime connected'),
  onConnectionError: (error) => {
    console.error(`[${error.recoverable ? 'retryable' : 'fatal'}] ${error.message}`);
  },
});

// --- Query with explicit error check (preferred) ---
const insert = await client.query(
  'INSERT INTO chat.messages (room, role, body) VALUES ($1, $2, $3)',
  ['main', 'user', 'hello'],
);
if (insert.status !== 'success') {
  throw new Error(insert.error?.message ?? 'insert failed');
}

// --- Live: strict subscription SQL (no ORDER BY on wire) ---
const stopInbox = await client.live(
  `SELECT id, room, role, body, created_at
   FROM chat.messages
   WHERE room = 'main'`,
  (rows) => {
    const sorted = [...rows].sort(
      (a, b) => a.created_at.asString().localeCompare(b.created_at.asString()),
    );
    console.log(sorted.map((row) => row.body.asString()));
  },
  {
    lastRows: 100,
    limit: 200,
    from: SeqId.from('0'),
    onCheckpoint: ({ lastSeqId }) => console.log('checkpoint', lastSeqId.toString()),
    onError: (event) => console.error(event.code, event.message),
  },
);

// --- Live with ORDER BY: descriptor + controller (TS-only projection) ---
const descriptor = createRawSqlLiveDescriptor(
  `SELECT id, body, created_at FROM chat.messages
   WHERE room = 'main' ORDER BY created_at ASC LIMIT 200`,
  { limit: 200 },
);
const controller = client.createLiveQueryController(descriptor, {
  onCheckpoint: (cp) => console.log('ordered checkpoint', cp.lastSeqId?.toString()),
});
controller.subscribe((snapshot) => {
  if (snapshot.error) console.error(snapshot.error);
  else console.log('ordered rows', snapshot.rows.length);
});
await controller.start();

await stopInbox();
await controller.stop();
await client.disconnect();
```

FILE upload/download: [typescript-files.md](typescript-files.md)
