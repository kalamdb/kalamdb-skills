# TypeScript Client SDK

Overview for `@kalamdb/client`. Method tables: [typescript-client-api.md](typescript-client-api.md). **FILE columns**: [typescript-files.md](typescript-files.md).

## Sources

- `link/sdks/typescript/client/`
- `link/sdks/typescript/client/README.md`

## Install

```bash
npm i @kalamdb/client
```

Runtime: Node.js 18+ and modern browsers (WASM + WebSocket).

## Quick Start
## Browser Bundlers And WASM

`@kalamdb/client` loads its companion WASM with `import.meta.url`. That breaks when a framework prebundles the package, strips the adjacent `.wasm` asset, or serves the request through an HTML fallback instead of the emitted binary.

For Vite apps, keep the client package out of dependency optimization and include `.wasm` as an asset:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		exclude: ['@kalamdb/client'],
	},
	assetsInclude: ['**/*.wasm'],
});
```

Apply the same rule to any framework that uses Vite under the hood, including React+Vite, SvelteKit, Astro, Nuxt with Vite, and custom Vite setups. If the framework has a dependency optimization, prebundle, or transpile allowlist/denylist, make sure `@kalamdb/client` stays unbundled there.

For other bundlers and meta-frameworks:

- Ensure the package's `.wasm` file is emitted and served as a real static asset.
- Do not rewrite the WASM request to an SPA HTML fallback or 404 page.
- If the app renders on the server, initialize `@kalamdb/client` only in browser-only code paths.

Common failure signs are `expected magic word`, `incorrect response MIME type`, or a network response that starts with `<!doctype html>` instead of a WASM binary.

## Owns

```typescript
import { Auth, createClient } from '@kalamdb/client';

const client = createClient({
  url: 'http://localhost:2900',
  namespace: 'default', // optional; default for unqualified tables + file URLs
  authProvider: async () => Auth.basic('alice', 'Secret123!'),
  onConnectionError: (err) => {
    console.error(`[${err.recoverable ? 'retryable' : 'fatal'}] ${err.message}`);
  },
});

await client.initialize(); // optional; first query/live call auto-inits
```

## Best Practices

1. **Always use `authProvider`** — not legacy static auth fields. Return `Auth.basic`, `Auth.jwt`, or `Auth.none` (localhost only).
2. **Check query errors explicitly** — `query()` returns `QueryResponse` with `status: 'success' | 'error'`. It does not throw on SQL errors.
3. **Do not rely on `queryOne` / `queryAll` for errors** — they return `null` / `[]` when `status === 'error'` without surfacing `response.error`.
4. **Prefer `onConnectionError` over `onError`** — same callback shape; `onError` is a compatibility alias.
5. **Register connection error handler in production** — otherwise the SDK logs failures but your UI may look “stuck”.
6. **USER tables are auth-scoped** — never add fake `WHERE user_id = ?` filters. Use `executeAsUser()` only for authorized service delegation.
7. **Live subscription SQL is strict on `client.live()`** — use `SELECT ... FROM ... WHERE ...` only (no `ORDER BY` / `LIMIT` / joins). See Live section below.
8. **FILE uploads use `queryWithFiles`** — placeholders `FILE("name")` in SQL; multipart field `file:name`. See [typescript-files.md](typescript-files.md).
9. **FILE reads use URLs, not a download helper** — TS has no `downloadFile()` like Rust/Dart. Use `queryRows` + `row.file()` or `KalamCellValue.asFileUrl()`.
10. **Set `namespace` on the client** when apps use unqualified table names or need consistent file URL context.

## Error Handling

### Query responses (`query`, `insert`, `update`, `executeAsUser`)

```typescript
const response = await client.query('SELECT * FROM app.users WHERE id = $1', [id]);

if (response.status !== 'success') {
  const { code, message, details } = response.error ?? { code: 'UNKNOWN', message: 'query failed' };
  // codes include INVALID_SQL, TABLE_NOT_FOUND, PERMISSION_DENIED, TOKEN_EXPIRED, ...
  throw new Error(`${code}: ${message}${details ? ` (${details})` : ''}`);
}

const rows = response.results?.[0]?.named_rows ?? [];
```

`queryWithFiles` **throws** `Error` on HTTP or `status !== 'success'` (stricter than `query()`). On `TOKEN_EXPIRED` it refreshes auth via `authProvider` but **does not retry** the multipart upload.

### Connection and auth (`onConnectionError`)

`ConnectionError` fields:

| Field | Meaning |
|-------|---------|
| `message` | Human-readable failure (includes URL, user hint when available) |
| `recoverable` | `true` = transient network/service; `false` = config, URL, or fatal auth |
| `hint` | Suggested fix |
| `url` | Server base URL |
| `authUser` | Basic-auth username when relevant |

Treat `recoverable: false` as stop-and-fix (wrong URL, bad credentials, auth provider failure). `recoverable: true` may clear after reconnect.

`onConnect` fires when the shared realtime socket is healthy (including after recovery). `wsLazyConnect: true` (default) defers the socket until the first `live()` / `liveTable()` / `liveEvents()` call.

### Live subscription errors (`onError` in `LiveOptions`)

```typescript
onError: (event) => {
  // event.code, event.message — subscription-level, not connection-level
},
```

Use `onCheckpoint` to persist `lastSeqId` (`SeqId`) for resume via `from: SeqId.from('...')`.

### Auth provider retries

`authProviderMaxAttempts` (default 3), `authProviderInitialBackoffMs` (250), `authProviderMaxBackoffMs` (2000) apply when resolving credentials before connect.

## Live Queries

### `client.live()` / `liveTable()` (direct WASM subscription)

Subscription SQL sent to the server must match:

```sql
SELECT col1, col2 FROM namespace.table WHERE ...
```

No `ORDER BY`, `LIMIT`, `GROUP BY`, `JOIN`, or `UNION`. Sort in the callback or use a controller (below).

Options: `batchSize`, `lastRows`, `limit` (client row cap), `from` (`SeqId`), `getKey`, `mapRow`, `onCheckpoint`, `onError`.

Returns `Unsubscribe` — call it to stop: `const stop = await client.live(...); await stop();`

### ORDER BY / LIMIT (TypeScript-only client projection)

When the app needs `ORDER BY` or `LIMIT` in live SQL, use `createRawSqlLiveDescriptor` + `createLiveQueryController` (or `@kalamdb/react` `useLiveQuery`, which does this internally):

```typescript
import { createRawSqlLiveDescriptor } from '@kalamdb/client';

const descriptor = createRawSqlLiveDescriptor(
  `SELECT id, body, created_at FROM chat.messages WHERE room = $1 ORDER BY created_at ASC LIMIT 200`,
  { limit: 200 },
);

const controller = client.createLiveQueryController(descriptor, {
  onCheckpoint: (cp) => saveSeq(cp.lastSeqId),
});

controller.subscribe((snapshot) => render(snapshot.rows));
await controller.start();
// await controller.stop() when done
```

`normalizeLiveSql` strips `ORDER BY` / `LIMIT` for the wire subscription and reapplies them client-side via `projectLiveRows`.

**Rust/Dart SDKs do not support ORDER BY in live SQL** — this projection path is TypeScript-specific.

### Raw protocol

Use `liveEvents()` only when the app needs `subscription_ack`, `initial_data_batch`, `change`, and error frames.

## Tenant Boundary

USER tables are scoped by authenticated user. Do not substitute KalamDB isolation with app-side `user_id` filters.

For workers writing on behalf of a user:

```typescript
await client.executeAsUser(
  'INSERT INTO app.inbox (title) VALUES ($1)',
  targetUserId,
  ['Hello'],
);
```

Only target users the actor role may impersonate.

## Related

| Topic | File |
|-------|------|
| Method tables | [typescript-client-api.md](typescript-client-api.md) |
| FILE upload/download | [typescript-files.md](typescript-files.md) |
| React live UI | [typescript-react.md](typescript-react.md) |
| Example patterns | [typescript-client.md](../examples/typescript-client.md) |
