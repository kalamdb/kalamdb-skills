# Full-Stack App: React + Message Agent

Build a React frontend and a topic agent that share one schema, one generated ORM, and one `kalam dev` session. The browser uses `@kalamdb/react` for live rows; the agent uses `@kalamdb/consumer` to consume topic messages and `@kalamdb/client` for typed writes.

## Prefer a Template

**Check [cli-templates.md](../references/cli-templates.md) first.** When a template matches this stack (e.g. a future `react-agent` template), init with it and extend — do not recreate the same layout from scratch:

```bash
kalam init --yes \
  --name my-chat \
  --languages typescript \
  --template react-agent \
  --server-mode local \
  --package-manager pnpm
kalam dev
```

The steps below describe the **manual delta** when no template exists yet, or when extending the closest available template (today: usually `simple-live`).

Reference implementation: `examples/react-ai-chat/` in the KalamDB repo.

## Architecture

```text
schema.sql  ──► kalam dev (watch) ──► src/generated/kalam.ts  (Drizzle tables + types)
                     │
                     ├── [server]  KalamDB
                     ├── [app]     Vite + React  (@kalamdb/react + ORM tables)
                     └── [agent]   runConsumer   (@kalamdb/consumer + ORM client)
```

User actions in React insert rows → KalamDB publishes topic events → agent consumes and writes back → React live queries update instantly.

## AI Assistant Chat Rule

When asked to build an AI assistant or ChatGPT-like chat app, always include:

- direct `CREATE USER TABLE` declarations for `conversations` and `messages`
- a direct `CREATE STREAM TABLE` declaration for token/typing rows, for example `message_streams` or `typing_tokens`
- visible frontend thinking/typing state before the first token
- live token streaming to the frontend by inserting one stream row per token
- a topic consumed by the agent and a source from the user-message table, for example `agent_messages` sourced from `messages ON INSERT`

Do not add an app-level `users` table or fake `user_id` tenancy columns for USER-table chat data. KalamDB already scopes USER tables by the authenticated client user, and topic messages expose the authenticated actor on `change.user`.

Do not collapse assistant output into a single final message only. The frontend should render the assistant placeholder while status is `thinking`, append tokens from the STREAM table while status is `streaming`, and mark the assistant message `complete` when the agent finishes.

## 1. Scaffold with `kalam init`

Pick the closest template ([catalog](../references/cli-templates.md)). Today that is usually `simple-live` until a React+agent template ships:

```bash
mkdir my-chat && cd my-chat
kalam init --yes \
  --name my-chat \
  --schema-mode sql \
  --languages typescript \
  --template simple-live \
  --server-mode local \
  --package-manager pnpm
```

This creates `kalam.toml`, starter `schema.sql`, `kalam/migrations/`, and `[dev.processes].app`. Replace or extend the template's Node demo with Vite + React (next steps).

Non-interactive shells must pass `--yes`, `--template`, and every other flag explicitly. See [cli-init.md](../references/cli-init.md).

## 2. Define schema tables first

Before writing React components, agent code, or hand-authored model files, edit `schema.sql`. This is the source of truth for row shape. Generate `src/generated/kalam.ts` from it and import generated table objects/types everywhere.

Use direct table-type DDL in app schemas:

```sql
CREATE USER TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE USER TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  parent_message_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE STREAM TABLE message_streams (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  token TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
) WITH (
  TTL_SECONDS = 300
);
```

Do not create a local `users` table for the chat user. The authenticated KalamDB user is already the user, and USER tables isolate rows per authenticated user. If a service agent writes into USER tables on behalf of the original user, use `executeAsUser()` with `change.user` after verifying the worker role is authorized.

With `dev.watch = true`, edits to `schema.sql` trigger migration creation, apply, and ORM regeneration automatically. If the pipeline creates `kalam/migrations/_draft.sql`, review it and seal it with `kalam migration seal`; `kalam dev --force` then applies the numbered migration.

## 3. Use generated ORM types, then add React and agent code

After schema generation, import Drizzle table objects and row types from the generated output configured in `kalam.toml`:

```ts
// src/generated/kalam.ts — produced by kalam schema gen / kalam dev watch
import { conversations, messages, message_streams, type Messages, type MessageStreams } from './generated/kalam';
```

Both React and the agent import this file so field names stay in sync with `schema.sql`. Never hand-write duplicate row interfaces before schema generation, and never edit `src/generated/` by hand.

Do not create files like `src/chat/model.ts` for table row types, row factories, or status enums that mirror the schema. If a helper is truly UI-only, keep it typed against generated rows (`Messages`, `MessageStreams`, etc.) and avoid redefining table columns, roles, statuses, or timestamps. Prefer placing trivial streaming text composition near the component that renders it.

ORM patterns: [typescript-orm.md](../references/typescript-orm.md).

## 4. Add React, consumer, and Vite

```bash
pnpm add @kalamdb/client @kalamdb/react @kalamdb/consumer @kalamdb/orm \
  react react-dom drizzle-orm dotenv
pnpm add -D vite @vitejs/plugin-react tsx typescript \
  @types/node @types/react @types/react-dom
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "agent": "tsx src/agent/index.ts",
    "check": "tsc --noEmit"
  }
}
```

Add a minimal `vite.config.ts` (keep `@kalamdb/client` out of dependency pre-bundling so WASM loads correctly — see [typescript-client-sdk.md](../references/typescript-client-sdk.md)).

## 5. Create agent topic and source

Create the topic/source outside the workflow schema pipeline, either in a setup script or at agent startup:

```ts
await db.query('CREATE TOPIC my_chat.agent_messages').catch(ignoreAlreadyExists);
await db
  .query('ALTER TOPIC my_chat.agent_messages ADD SOURCE my_chat.messages ON INSERT')
  .catch(ignoreAlreadyExists);
```

The agent subscribes to `my_chat.agent_messages`. React inserts user rows into `messages`; KalamDB routes those inserts to the topic.

## 6. Wire `kalam dev` processes

Add an agent process beside the frontend in `kalam.toml`:

```toml
[dev.processes]
app = "pnpm dev"
agent = "pnpm agent"
```

`kalam dev` then starts:

| Prefix | Process |
|--------|---------|
| `[server]` | Local KalamDB (when `dev.auto_start_db = true`) |
| `[cli]` | Schema pipeline + watch |
| `[app]` | Vite React dev server |
| `[agent]` | Topic consumer worker |

Full example config: [kalam-fullstack.toml](kalam-fullstack.toml). Field reference: [kalam-toml.md](../references/kalam-toml.md).

## 7. Run everything

```bash
kalam dev
```

On first run this applies schema, generates `src/generated/kalam.ts`, and supervises both processes. Edit `schema.sql` while running — types refresh automatically when the pipeline succeeds.

Retry a paused pipeline: `kalam dev --force`. See [cli-dev.md](../references/cli-dev.md).

## 8. React frontend (`@kalamdb/react`)

Wrap the app with `KalamProvider`, subscribe to both generated message tables with `LiveQueries`, and mutate with the render-prop `insert` / `update` helpers:

```tsx
import { KalamProvider, LiveQueries } from '@kalamdb/react';
import { eq, asc } from 'drizzle-orm';
import { messages, message_streams } from './generated/kalam';
import { createClient, Auth } from '@kalamdb/client';

const client = createClient({
  url: import.meta.env.VITE_KALAMDB_URL ?? 'http://localhost:2900',
  authProvider: async () => Auth.basic('admin', 'AdminPass123!'),
});

export function App() {
  return (
    <KalamProvider client={client}>
      <LiveQueries
        queries={{
          messages: {
            table: messages,
            where: (t) => eq(t.conversation_id, 'main'),
            orderBy: (t) => asc(t.created_at),
          },
          streams: {
            table: message_streams,
            where: (t) => eq(t.conversation_id, 'main'),
            orderBy: (t) => asc(t.sequence),
          },
        }}
        deps={['main']}
      >
        {({ messages: messageQuery, streams: streamQuery, insert }) => (
          <ChatPanel
            messages={messageQuery.rows}
            streams={streamQuery.rows}
            onSend={(body) =>
              insert(messages).values({
                id: crypto.randomUUID(),
                conversation_id: 'main',
                role: 'user',
                body,
                status: 'sent',
              })
            }
          />
        )}
      </LiveQueries>
    </KalamProvider>
  );
}
```

Render assistant text by grouping `message_streams` by `message_id`, sorting by `sequence`, showing a thinking indicator for `state = 'thinking'` before token rows, and concatenating `token` values while rows arrive. Do not wait for the final assistant message body to render streaming output.

More patterns: [typescript-react.md](typescript-react.md).

## 9. Agent worker (`@kalamdb/consumer`)

Consume the topic with generated row types; write assistant placeholders and token rows with `@kalamdb/client`:

```ts
import { config as loadEnv } from 'dotenv';
import { Auth, createClient } from '@kalamdb/client';
import { createConsumerClient, runConsumer } from '@kalamdb/consumer';
import { type Messages } from './generated/kalam';

loadEnv();

const url = process.env.KALAMDB_URL ?? 'http://localhost:2900';
const auth = async () => Auth.basic(process.env.KALAMDB_USER ?? 'admin', process.env.KALAMDB_PASSWORD ?? 'AdminPass123!');

const consumerClient = createConsumerClient({ url, authProvider: auth });
const db = createClient({ url, authProvider: auth });

await runConsumer<Messages>({
  client: consumerClient,
  name: 'chat-agent',
  topic: 'my_chat.agent_messages',
  groupId: 'chat-agent',
  onChange: async (_ctx, change) => {
    const row = change.data;
    if (row.role !== 'user' || row.status !== 'sent') return;

    const assistantId = crypto.randomUUID();
    await db.executeAsUser(
      `INSERT INTO my_chat.messages
        (id, conversation_id, role, body, status, parent_message_id)
       VALUES ($1, $2, 'assistant', '', 'thinking', $3)`,
      change.user,
      [assistantId, row.conversation_id, row.id],
    );

    await db.executeAsUser(
      `INSERT INTO my_chat.message_streams
        (id, conversation_id, message_id, sequence, token, state)
       VALUES ($1, $2, $3, 0, '', 'thinking')`,
      change.user,
      [crypto.randomUUID(), row.conversation_id, assistantId],
    );

    let body = '';
    let sequence = 1;
    for await (const token of streamTokens(row.body)) {
      body += token;
      await db.executeAsUser(
        `INSERT INTO my_chat.message_streams
          (id, conversation_id, message_id, sequence, token, state)
         VALUES ($1, $2, $3, $4, $5, 'streaming')`,
        change.user,
        [crypto.randomUUID(), row.conversation_id, assistantId, sequence, token],
      );
      await db.executeAsUser(
        `UPDATE my_chat.messages SET body = $1, status = 'streaming' WHERE id = $2`,
        change.user,
        [body, assistantId],
      );
      sequence += 1;
    }

    await db.executeAsUser(
      `INSERT INTO my_chat.message_streams
        (id, conversation_id, message_id, sequence, token, state)
       VALUES ($1, $2, $3, $4, '', 'complete')`,
      change.user,
      [crypto.randomUUID(), row.conversation_id, assistantId, sequence],
    );
    await db.executeAsUser(
      `UPDATE my_chat.messages SET body = $1, status = 'complete' WHERE id = $2`,
      change.user,
      [body, assistantId],
    );
  },
});
```

Consumer details: [typescript-consumer.md](../references/typescript-consumer.md).

## 10. Credentials

Workflow projects store CLI credentials under `~/.kalam/` (`kalam-dev` instance). For Node processes, use `.env` / `.env.local`:

```env
KALAMDB_URL=http://localhost:2900
KALAMDB_USER=admin
KALAMDB_PASSWORD=AdminPass123!
VITE_KALAMDB_URL=http://localhost:2900
```

Vite exposes only `VITE_*` vars to the browser.

## Quick checklist

| Step | Command / file |
|------|----------------|
| Scaffold | `kalam init --yes ...` |
| Schema tables first | `schema.sql` with `CREATE USER TABLE` / `CREATE STREAM TABLE` |
| Generated ORM source of truth | `src/generated/kalam.ts` |
| Topic + source | setup script or idempotent agent startup SQL |
| Dev orchestration | `kalam.toml` → `[dev.processes]` app + agent |
| Start stack | `kalam dev` |
| React live UI | `@kalamdb/react` + generated tables |
| Agent consumer | `@kalamdb/consumer` + `runConsumer<T>()` |

## Agent coding rules

1. **Template-first:** [cli-templates.md](../references/cli-templates.md) — use `--template` when a match exists; this file is the fallback delta.
2. Route full-stack tasks here only when no template covers the stack yet.
3. Prefer `kalam init --template <id>` → customize → `kalam dev` over manual server + separate watchers.
4. Start by editing `schema.sql`; do not start with hand-written model files, row factories, duplicate row interfaces, or `src/**/model.ts` mirrors of generated tables.
5. Share one generated ORM file across React and the agent; generated types are the row source of truth.
6. For AI assistant chat, use `CREATE USER TABLE` for conversation/message rows and `CREATE STREAM TABLE` for thinking/token rows.
7. Do not add app-level `users` tables or `user_id` tenancy columns for USER-table chat data.
8. Create topics/sources outside workflow `schema.sql` until the schema pipeline accepts topic DDL.
9. Add `[dev.processes].agent` (or any name) — the key becomes the log prefix.
10. When KalamDB adds a new template, update the catalog in [cli-templates.md](../references/cli-templates.md) instead of duplicating init instructions in new docs.
11. Point users at `examples/react-ai-chat/` for a production-shaped chat UI (files, approvals, typing tokens).
