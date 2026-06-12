# TypeScript FILE Column Example

```ts
import { Auth, createClient } from '@kalamdb/client';

const client = createClient({
  url: 'http://localhost:2900',
  namespace: 'app',
  authProvider: async () => Auth.jwt(accessToken),
});

// Upload avatar on create
const avatar = document.querySelector<HTMLInputElement>('#avatar')!.files![0];

try {
  const created = await client.queryWithFiles(
    'INSERT INTO users (name, avatar) VALUES ($1, FILE("avatar"))',
    { avatar },
    ['Alice'],
    (p) => console.log(`upload ${p.percent}%`),
  );
  if (created.status !== 'success') {
    throw new Error(created.error?.message ?? 'create failed');
  }
} catch (err) {
  console.error('upload failed', err);
}

// Read back with bound file URLs
interface User { id: string; name: string; avatar: unknown }

const users = await client.queryRows<User>(
  'SELECT id, name, avatar FROM users WHERE name = $1',
  'app.users',
  ['Alice'],
);

for (const row of users) {
  const file = row.file('avatar');
  if (file) {
    document.querySelector<HTMLImageElement>('#preview')!.src = file.downloadUrl();
    console.log(file.name, file.mime, file.formatSize());
  }
}

await client.disconnect();
```

Reference: [typescript-files.md](../references/typescript-files.md)
