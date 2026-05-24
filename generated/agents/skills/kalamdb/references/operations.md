# Operations

Use this file for server lifecycle, Docker, cluster, health, deployment, and runbook tasks.

## Source Files

- `AGENTS.md`
- `backend/server.example.toml`
- `backend/server.toml`
- `server.toml`
- `docs/getting-started/quick-start.md`
- `docs/development/development-setup.md`
- `docs/cluster/cluster-formation.md`
- `docker/run/single/`
- `pg/docker/`
- `scripts/cluster.sh`

## Local Server Lifecycle

```bash
cd backend
cp server.example.toml server.toml
cargo run --bin kalamdb-server
```

Default source-run HTTP URL: `http://127.0.0.1:2900`.

Useful env overrides:

- `KALAMDB_SERVER_HOST`
- `KALAMDB_SERVER_PORT`
- `KALAMDB_LOG_LEVEL`
- `KALAMDB_JWT_SECRET`
- `KALAMDB_ROOT_PASSWORD`
- `KALAMDB_ALLOW_REMOTE_SETUP`
- `KALAMDB_TOKIO_WORKER_THREADS`
- `KALAMDB_PG_AUTH_TOKEN`

## Docker

Single-node Docker config lives under `docker/run/single/`.

The Dart SDK quick path downloads the compose file directly and starts it with a generated JWT secret:

```bash
curl -sSL https://raw.githubusercontent.com/kalamdb/KalamDB/main/docker/run/single/docker-compose.yml -o docker-compose.yml
KALAMDB_JWT_SECRET="$(openssl rand -base64 32)" docker compose up -d
```

The default Docker endpoint in public docs is usually `http://localhost:8088`; source runs use `http://localhost:2900`.

## Health

Active health routes:

- `GET /health`
- `GET /v1/api/healthcheck`
- `GET /v1/api/cluster/health`

Health endpoints are localhost-only unless explicitly protected and authorized.

Cluster health includes leader status, node ID, term, applied index, quorum timing, group counts, and per-node replication lag.

## Cluster

Use `scripts/cluster.sh` for local cluster setup. In config, cluster mode is enabled when `[cluster]` is present. When absent, KalamDB runs standalone.

Cluster invariants:

- all nodes share `cluster_id`
- node IDs are unique and start at 1
- node 1 is the bootstrap node
- peers list all other nodes, not self
- all nodes must match shard counts
- Raft quorum is fixed by protocol; do not invent a `min_replication_nodes` setting

For production, prefer odd node counts: 3 nodes tolerate 1 failure, 5 nodes tolerate 2.