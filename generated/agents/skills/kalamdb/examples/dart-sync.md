# Dart Sync Example

Starter: `kalam init --yes --languages dart --template simple-live` then `kalam schema gen --languages dart`.

```dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:kalam_sync/kalam_sync.dart';

import 'generated/kalam.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final kalam = await Kalam.open(
    url: 'http://localhost:2900',
    subject: 'alice',
    namespace: 'app',
    authProvider: () async => Auth.basic('alice', 'Secret123!'),
  );

  runApp(KalamScope(kalam: kalam, child: TodosApp(kalam: kalam)));
}

final class TodosApp extends StatefulWidget {
  const TodosApp({required this.kalam, super.key});
  final Kalam kalam;

  @override
  State<TodosApp> createState() => _TodosAppState();
}

final class _TodosAppState extends State<TodosApp> {
  late final todos = widget.kalam.table(KalamTables.todos);
  KalamSyncSubscription? sync;

  @override
  void initState() {
    super.initState();
    widget.kalam
        .subscribe(todos.consumer(sql: 'SELECT * FROM app.todos'))
        .then((value) {
          if (mounted) {
            sync = value;
          } else {
            unawaited(value.cancel());
          }
        });
  }

  @override
  void dispose() {
    unawaited(sync?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: StreamBuilder<List<KalamSyncedRow<Todos>>>(
          stream: todos.watchWithSyncState(),
          builder: (context, snapshot) {
            final rows = snapshot.data ?? const <KalamSyncedRow<Todos>>[];
            return ListView(
              children: [
                for (final row in rows)
                  ListTile(
                    title: Text(row.value.title),
                    trailing: Icon(
                      row.isSynced ? Icons.cloud_done : Icons.cloud_upload,
                    ),
                  ),
              ],
            );
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () {
            todos.insert(
              Todos(
                id: Kalam.id(),
                title: 'Ship kalam_sync',
                completed: false,
              ),
              actionId: Kalam.id(),
            );
          },
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
```

Notes:

- Generate `KalamTables.todos` with `kalam schema gen --languages dart`.
- Live SQL: `SELECT ... FROM ... WHERE ...` only.
- For `replicaOnly` tables, enqueue a generated action with `optimisticInsert` instead of `insert`.
- SQLite file is per `(url, namespace, subject)`. Do not share one `Kalam` across users.
- Internals use Drift (`KalamSyncDatabase`). Do not declare app tables as Drift tables.
- Shared-table rows still need `CREATE POLICY` on the server; the local cache only mirrors what live SQL returned.
- Use `kalam_sync` for offline lists, local-first chat, and queued writes. Use `kalam_link` when you do not want SQLite.

## Shared conversation (server RLS + local cache)

Subscribe with params. Policies on `app.messages` decide which rows land in Drift:

```dart
kalam.subscribe(
  messages.consumer(
    sql: r'SELECT * FROM app.messages WHERE conversation_id = $1',
    params: [conversationId],
  ),
);
```

## Tests / custom SQLite

```dart
import 'package:drift/native.dart';
import 'package:kalam_sync/drift.dart';
import 'package:kalam_sync/kalam_sync.dart';

final class MemoryFactory implements KalamDatabaseFactory {
  @override
  Future<KalamSyncDatabase> open(KalamAccountIdentity identity) {
    return Future.value(KalamSyncDatabase(NativeDatabase.memory()));
  }
}

final kalam = await Kalam.open(
  url: 'http://localhost:2900',
  subject: 'alice',
  databaseFactory: MemoryFactory(),
);
```

Production Flutter uses `KalamFlutterDatabaseFactory` → `drift_flutter` automatically. Do not declare app tables on `KalamSyncDatabase`.
