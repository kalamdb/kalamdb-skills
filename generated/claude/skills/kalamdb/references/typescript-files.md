# TypeScript FILE Columns

FILE datatype patterns for `@kalamdb/client`. Overview: [typescript-client-sdk.md](typescript-client-sdk.md).

## Schema

Declare FILE columns in DDL:

```sql
CREATE TABLE app.users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  avatar FILE
);
```

Stored values are JSON `FileRef` objects (`id`, `sub`, `name`, `size`, `mime`, `sha256`, …).

## Upload (`queryWithFiles`)

Use `FILE("placeholder")` in SQL. Map placeholders to `File | Blob` keys. Multipart part names are `file:<key>`.

```typescript
const fileInput = document.querySelector<HTMLInputElement>('#avatar')!;
const file = fileInput.files![0];

const response = await client.queryWithFiles(
  'INSERT INTO app.users (name, avatar) VALUES ($1, FILE("avatar"))',
  { avatar: file },
  ['Alice'],
  (progress) => console.log(`${progress.file_name}: ${progress.percent}%`),
);

if (response.status !== 'success') {
  throw new Error(response.error?.message ?? 'upload failed');
}
```

Rules:

- `queryWithFiles` **throws** on HTTP/SQL failure (unlike `query()`).
- On `TOKEN_EXPIRED`, auth refreshes via `authProvider` but the upload is **not** retried — call again after refresh if needed.
- Set `namespace` on `createClient({ namespace: 'app' })` when using unqualified table names in SQL.
- Progress callback uses `XMLHttpRequest` upload events (browser); Node uses `fetch` without progress.

Update example:

```typescript
await client.queryWithFiles(
  'UPDATE app.users SET avatar = FILE("avatar") WHERE id = $1',
  { avatar: newBlob },
  [userId],
);
```

## Read — preferred: `queryRows` + `KalamRow.file()`

Bind table context once; FILE columns get no-arg URLs:

```typescript
interface User { id: string; name: string; avatar: unknown }

const rows = await client.queryRows<User>(
  'SELECT id, name, avatar FROM app.users WHERE active = true',
  'app.users',
);

for (const row of rows) {
  console.log(row.data.name);
  const avatar = row.file('avatar');
  if (avatar) {
    img.src = avatar.downloadUrl();       // absolute URL
    // img.src = avatar.relativeUrl();    // path-only for same-origin
    console.log(avatar.name, avatar.formatSize(), avatar.isImage());
  }
}
```

`tableName` accepts `namespace.table` or `table` (falls back to client `namespace` or `"default"`).

Single row:

```typescript
const raw = await client.queryOne('SELECT * FROM app.users WHERE id = $1', [id]);
if (raw) {
  const row = client.wrapRow<User>(raw, 'app.users');
  const url = row.file('avatar')?.downloadUrl();
}
```

## Read — `queryAll` + `KalamCellValue`

When not using `KalamRow`, pass server context per cell:

```typescript
const rows = await client.queryAll('SELECT id, avatar FROM app.users');
for (const row of rows) {
  const ref = row['avatar'].asFile();
  const url = row['avatar'].asFileUrl(client.url, 'app', 'users');
  // or: ref?.getDownloadUrl(client.url, 'app', 'users')
}
```

## Read — manual `FileRef`

For JSON already in hand (ORM, cached row, worker):

```typescript
import { FileRef, parseFileRef } from '@kalamdb/client';

const ref = FileRef.from(row.avatar) ?? parseFileRef(row.avatar);
if (ref) {
  const url = ref.getDownloadUrl('http://localhost:2900', 'app', 'users');
  const path = ref.relativePath();
}
```

## Download in apps

There is **no** `client.downloadFile()` in TypeScript (Rust/Dart have bound download helpers). Use the URL:

```typescript
const url = row.file('avatar')!.downloadUrl();
// Browser: <img src={url} /> or window.open(url)
// Node: const res = await fetch(url, { headers: { Authorization: ... } });
```

Auth: download URLs target `/v1/api/files/...` and require the same credentials as SQL when not public.

## Multipart wire format (debugging)

| Part | Value |
|------|-------|
| `sql` | Statement with `FILE("key")` |
| `params` | JSON array (optional) |
| `namespace_id` | When client `namespace` set |
| `file:<key>` | File blob |

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Using `query()` for FILE upload | Use `queryWithFiles` + `FILE("name")` |
| Expecting `downloadFile()` in TS | Use `downloadUrl()` / `fetch` |
| Ignoring `queryWithFiles` throw | Wrap in try/catch |
| Assuming `queryOne` surfaces SQL errors | Check `query()` `status` first |
| `ORDER BY` in `client.live()` SQL | Use `createRawSqlLiveDescriptor` or sort in callback |
| Wrong namespace in `asFileUrl` | Set `client.namespace` or qualify `namespace.table` |

## Example

Copy-paste: [typescript-files.md](../examples/typescript-files.md)
