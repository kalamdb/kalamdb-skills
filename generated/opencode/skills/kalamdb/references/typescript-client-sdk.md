# TypeScript Client SDK

Use this file for `@kalamdb/client` work.

## Sources

- `link/sdks/typescript/client/`
- `link/sdks/typescript/client/README.md`
- `docs/sdk/sdk.md`

## Install

```bash
npm i @kalamdb/client
```

Runtime targets: Node.js 18+ and modern browsers.

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

- `createClient()`
- `Auth.basic`, `Auth.jwt`, `Auth.none`
- SQL execution over HTTP
- FILE upload/download helpers
- materialized live rows through `live()` and `liveTable()`
- low-level `liveEvents()` raw protocol stream
- `executeAsUser()` for authorized USER/STREAM table delegation
- `SeqId` resume support

## Live Query Guidance

Prefer `live()` for app UI. It returns the current materialized row set and hides low-level protocol frames.

Use options intentionally:

- `batchSize`: server snapshot chunk size
- `lastRows`: initial rewind count
- `limit`: maximum client materialized row count
- `from`: resume from a `SeqId`
- `getKey`: row identity override when the query lacks an `id` column
- `onCheckpoint`: persist `lastSeqId`

Use `liveEvents()` only when the caller needs raw `subscription_ack`, `initial_data_batch`, `change`, and error frames.

## Tenant Boundary Rule

USER tables are scoped by authenticated user. Do not add app-side `WHERE user_id = ?` as a substitute for KalamDB isolation.

For service workers writing on behalf of a user, use `executeAsUser()` and only pass IDs authorized by the actor role.