# TypeScript React Example

## Single Table with Live Updates

```tsx
import { eq, asc } from 'drizzle-orm';
import { useState } from 'react';
import { LiveQuery } from '@kalamdb/react';
import { users, type User } from '../schema';

export function UsersList() {
  const [filter, setFilter] = useState('active');

  return (
    <LiveQuery
      table={users}
      where={(t) => eq(t.status, filter)}
      orderBy={(t) => asc(t.created_at)}
      deps={[filter]}
    >
      {({ rows, insert, state }) => (
        <div>
          <div>Status: {state.connected ? 'Live' : 'Offline'}</div>
          <ul>
            {rows.map((user) => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
        </div>
      )}
    </LiveQuery>
  );
}
```

## Multiple Tables with Shared Actions

```tsx
import { eq, desc } from 'drizzle-orm';
import { LiveQueries } from '@kalamdb/react';
import { users, posts, type Post } from '../schema';

export function Dashboard({ userId }: { userId: string }) {
  return (
    <LiveQueries
      queries={{
        profile: {
          table: users,
          where: (t) => eq(t.id, userId),
        },
        feed: {
          table: posts,
          where: (t) => eq(t.user_id, userId),
          orderBy: (t) => desc(t.created_at),
          limit: 20,
        },
      }}
    >
      {({ profile, feed, insert, update, state }) => (
        <div>
          <h1>{profile.rows[0]?.name}</h1>
          <div>
            {feed.rows.map((post: Post) => (
              <article key={post.id}>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
              </article>
            ))}
          </div>
          {!state.connected && <div>Connection lost...</div>}
        </div>
      )}
    </LiveQueries>
  );
}
```

## Insert and Update with Error Handling

```tsx
import { FormEvent, useState } from 'react';
import { eq, asc } from 'drizzle-orm';
import { LiveQuery } from '@kalamdb/react';
import { chat_messages } from '../schema';

export function ChatPanel({ documentId }: { documentId: string }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>();

  return (
    <LiveQuery
      table={chat_messages}
      where={(t) => eq(t.document_id, documentId)}
      orderBy={(t) => asc(t.created_at)}
      deps={[documentId]}
    >
      {({ rows: messages, insert }) => {
        async function sendMessage(e: FormEvent) {
          e.preventDefault();
          if (!input.trim()) return;

          try {
            await insert(chat_messages).values({
              document_id: documentId,
              body: input,
              created_by: 'user',
            });
            setInput('');
            setError(undefined);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send');
          }
        }

        return (
          <div>
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id}>{msg.body}</div>
              ))}
            </div>
            <form onSubmit={sendMessage}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
              {error && <div className="error">{error}</div>}
            </form>
          </div>
        );
      }}
    </LiveQuery>
  );
}
```

## With Connection Status

```tsx
import { LiveQuery } from '@kalamdb/react';
import { users } from '../schema';

export function StatusIndicator() {
  return (
    <LiveQuery table={users} deps={[]}>
      {({ state }) => {
        const statusText =
          state.loading ? 'Connecting...' :
          state.connected ? 'Live' :
          'Reconnecting...';

        const statusColor =
          state.loading ? 'yellow' :
          state.connected ? 'green' :
          'red';

        return (
          <div style={{ color: statusColor }}>
            {statusText}
            {state.error && <p>{state.error.message}</p>}
          </div>
        );
      }}
    </LiveQuery>
  );
}
```

## Agent: Type-Safe Consumer + ORM

Combine `@kalamdb/consumer` for topic subscriptions with `@kalamdb/client` for ORM-style updates:

```ts
import { config as loadEnv } from 'dotenv';
import { Auth, createClient } from '@kalamdb/client';
import { createConsumerClient, runConsumer } from '@kalamdb/consumer';
import { table_rows, chat_messages, type TableRows, type ChatMessages } from '../schema/generated';

loadEnv();

const url = process.env.KALAMDB_URL ?? 'http://localhost:2900';
const username = process.env.KALAMDB_USERNAME ?? 'agent';
const password = process.env.KALAMDB_PASSWORD ?? 'Secret123!';

// Create consumer client for topic subscriptions
const consumerClient = createConsumerClient({
  url,
  authProvider: async () => Auth.basic(username, password),
  onError: (error) => console.error('Consumer error:', error),
  onConnect: () => console.log('Consumer connected'),
});

// Create regular client for ORM updates
const db = createClient({
  url,
  authProvider: async () => Auth.basic(username, password),
});

// Type-safe consumer: T ensures change.data is typed to TableRows
await runConsumer<TableRows>({
  client: consumerClient,
  name: 'read-receipt-agent',
  topic: 'collab.table_row_events',
  groupId: 'table-read-receipt-agent',
  retry: {
    maxAttempts: 3,
    initialBackoffMs: 250,
    maxBackoffMs: 2_000,
  },
  onChange: async (_ctx, change) => {
    const row = change.data as TableRows; // Type-safe!
    
    if (!row.id || !row.document_id || !row.last_edited_by) return;
    if (row.origin !== 'user') return;

    const ackText = `I read ${row.last_edited_by}'s change on row ${row.position}.`;

    // ORM-style update with type safety
    await db.update('collab.table_rows', row.id, {
      agent_status: `Read by assistant for ${row.last_edited_by}`,
      origin: 'agent',
    });

    // ORM-style insert
    await db.insert('collab.chat_messages', {
      document_id: row.document_id,
      kind: 'agent',
      row_id: row.id,
      body: ackText,
      created_by: 'table-read-receipt-agent',
      updated_by: 'table-read-receipt-agent',
      origin: 'agent',
    });

    console.log(`Processed row ${row.position} by ${row.last_edited_by}`);
  },
});
```

### Key Patterns

1. **Type Safety**: `runConsumer<TableRows>` ensures compile-time checks on `change.data` fields
2. **Separation**: Consumer client (read-only topics) vs regular client (mutations)
3. **Generated Types**: Import `type TableRows, type ChatMessages` from schema for field access
4. **Error Handling**: Retry logic built into `runConsumer`
5. **Lifecycle**: Leverage `onConnect`, `onConnectionRetry`, `onConnectionError` hooks
