# Dart SDK Example

```dart
import 'package:kalam_link/kalam_link.dart';

Future<void> main() async {
  await KalamClient.init();

  final client = await KalamClient.connect(
    url: 'http://localhost:2900',
    authProvider: () async => Auth.basic('alice', 'Secret123!'),
  );

  final result = await client.query(
    r'SELECT id, body FROM chat.messages WHERE room = $1 ORDER BY id',
    params: ['main'],
  );

  for (final row in result.rows) {
    print(row['body']?.asString());
  }

  final live = await client.live(
    r'SELECT id, body FROM chat.messages WHERE room = $1 ORDER BY id',
    params: ['main'],
    onRows: (rows) => print('rows: ${rows.length}'),
    lastRows: 50,
  );

  await live.stop();
  await client.dispose();
}
```