# Dart SDK Example

```dart
import 'dart:async';

import 'package:kalam_link/kalam_link.dart';

Future<void> main() async {
  await KalamClient.init();

  final client = await KalamClient.connect(
    url: 'http://localhost:2900',
    authProvider: () async => Auth.basic('alice', 'Secret123!'),
  );

  final result = await client.query(
    r'SELECT id, body FROM chat.messages WHERE room = $1',
    params: ['main'],
  );

  if (!result.success) {
    throw StateError(result.error?.message ?? 'query failed');
  }

  for (final row in result.rows) {
    print(row['body']?.asString());
  }

  // Materialized live rows — returns a Stream, not a handle with .stop()
  final subscription = client
      .live<Map<String, KalamCellValue>>(
        r"SELECT id, body FROM chat.messages WHERE room = 'main'",
        lastRows: 50,
        limit: 50,
        onCheckpoint: (checkpoint) => print('resume ${checkpoint.lastSeqId}'),
      )
      .listen((rows) => print('rows: ${rows.length}'));

  // ... later
  await subscription.cancel();
  await client.dispose();
}
```

Notes:

- `live()` does not take a `params` named argument — bind literals in SQL or use string interpolation only when safe; for parameterized queries use `query()` or embed constants in the live SQL `WHERE` clause as shown.
- Sort and limit presentation in Dart after rows arrive; do not put `ORDER BY` / `LIMIT` in live subscription SQL.
