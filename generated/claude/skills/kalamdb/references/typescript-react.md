# TypeScript React

Use this file for `@kalamdb/react`, component patterns, hooks, browser-based live subscriptions, and consumer/ORM integration from React.

## Sources

- `link/sdks/typescript/react/`
- `examples/react-ai-chat/`
- `examples/chat-with-ai/`

## Install

```bash
npm i @kalamdb/client @kalamdb/react
# For consumers in agents/workers:
npm i @kalamdb/consumer
```

## Owns

- `<LiveQuery>` — Single table/query subscription
- `<LiveQueries>` — Multiple table/query subscriptions
- `useLiveQuery()` — Hook for single query
- `useLiveQueries()` — Hook for multiple queries
- `useLiveSelection()` — Hook for row selection state
- `useMutationActions()` — Hook for insert/update/delete operations
- `useMutationState()` — Hook for mutation loading/error state
- `KalamProvider` — Context provider for WebSocket/subscription setup

## Component Patterns

### Single Query

Use `<LiveQuery>` when subscribing to a single table with where/orderBy clauses:

```tsx
<LiveQuery
  table={users}
  where={(t) => eq(t.status, 'active')}
  orderBy={(t) => asc(t.created_at)}
  deps={[documentId]}
>
  {({ rows, insert, update }) => (
    // render rows, call insert/update
  )}
</LiveQuery>
```

### Multiple Queries

Use `<LiveQueries>` when subscribing to multiple tables simultaneously:

```tsx
<LiveQueries queries={{
  users: {
    table: users,
    where: (t) => eq(t.org_id, orgId),
    deps: [orgId],
  },
  posts: {
    table: posts,
    where: (t) => eq(t.org_id, orgId),
    orderBy: (t) => desc(t.created_at),
    deps: [orgId],
  },
}}>
  {({ users: userQuery, posts: postQuery, insert, update }) => (
    // render userQuery.rows and postQuery.rows
  )}
</LiveQueries>
```

## Query Props

All queries (in `<LiveQuery>` or `<LiveQueries>`) support:

- `table: Table` — Drizzle table schema
- `where?: (t) => SQL` — Where clause predicate
- `orderBy?: (t) => SQL | SQL[]` — Order by clause(s)
- `limit?: number` — Limit rows
- `offset?: number` — Offset rows
- `deps: unknown[]` — React dependencies; query refetches when any dep changes

## Render Prop Context

Both `LiveQuery` and `LiveQueries` pass a context object to children:

```ts
interface SingleLiveQueryContext {
  rows: Row[];
  insert: (table: Table) => { values: (obj) => Promise<void> };
  update: (table: Table, id: any) => { set: (obj) => Promise<void> };
  delete: (table: Table, id: any) => Promise<void>;
  state: {
    loading: boolean;
    connected: boolean;
    error?: Error;
  };
}
```

For `LiveQueries`, context includes both query results keyed by query name and shared `insert/update/delete`.

## Consumer + ORM Pattern (Type-Safe)

Combine `@kalamdb/consumer` (for workers/agents) and `@kalamdb/orm` (for ORM queries) for full type safety across the stack:

```ts
// Agent: consume changes typed to schema
import { runConsumer } from '@kalamdb/consumer';
import { createClient } from '@kalamdb/client';
import { table_rows, type TableRows } from '../schema/generated';

const client = createConsumerClient({...});
const db = createClient({...});

await runConsumer<TableRows>({  // Typed to schema
  client,
  topic: 'collab.table_row_events',
  groupId: 'my-agent',
  onChange: async (_ctx, change) => {
    const row = change.data as TableRows;
    
    // Type-safe field access
    if (row.origin !== 'user') return;
    
    // ORM-style update
    await db.update('collab.table_rows', row.id, {
      agent_status: 'Processed',
      origin: 'agent',
    });
  },
});
```

### Consumer Type Signature

```ts
runConsumer<T>({
  client: ConsumerClient;
  topic: string;
  groupId: string;
  name?: string;
  retry?: { maxAttempts: number; initialBackoffMs: number; maxBackoffMs: number };
  onChange: (ctx: Context, change: Change<T>) => Promise<void>;
  // lifecycle hooks...
})
```

The generic `T` ensures:
- `change.data` is typed to `T`
- Compile-time checks on field access
- Full IDE autocomplete

## Usage Rules

- Wrap root app with `<KalamProvider>` to establish WebSocket connection.
- Use `deps` to trigger query refetches when filters change.
- Avoid recreating where/orderBy functions on every render; inline or memoize.
- Call `insert`/`update`/`delete` after user interactions and await completion.
- Check `state.connected` to show connection status UI.
- For workers/agents, use `createConsumerClient()` + `runConsumer<T>()` for topic consumption with type safety.
- Combine consumer with `createClient()` for ORM-style updates in the same worker.
