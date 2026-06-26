# TypeScript ORM Example

```ts
import { Auth, createClient } from '@kalamdb/client';
import { file, kalamFile, kTable, kalamDriver, liveTable } from '@kalamdb/orm';
import { bigint, text, timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/pg-proxy';

export const messages = kTable.user('chat.messages', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  room: text('room').notNull(),
  role: text('role').notNull(),
  body: text('body').notNull(),
  attachment: file('attachment'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull(),
});

const client = createClient({
  url: 'http://localhost:2900',
  authProvider: async () => Auth.basic('admin', 'AdminPass123!'),
});

const db = drizzle(kalamDriver(client));
const rows = await db.select().from(messages).limit(20);

// FILE upload through normal Drizzle insert (driver routes to multipart SQL):
// await db.insert(messages).values({
//   room: 'main',
//   role: 'user',
//   body: 'See attachment',
//   attachment: kalamFile('attachment', selectedFile),
// });

const stop = await liveTable(client, messages, (liveRows) => {
  console.log(liveRows.length);
}, { lastRows: 50 });

await stop();
```