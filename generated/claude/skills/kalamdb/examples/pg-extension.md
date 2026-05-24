# PostgreSQL Extension Example

```sql
CREATE EXTENSION IF NOT EXISTS pg_kalam;

CREATE SERVER kalam_server
  FOREIGN DATA WRAPPER pg_kalam
  OPTIONS (
    host '127.0.0.1',
    port '2910',
    auth_mode 'account_login',
    login_user 'pg_dba',
    login_password '<dba-password>'
  );

SELECT kalam_version(), kalam_compiled_mode();
```

Docker compose validation:

```bash
./pg/docker/build-fast.sh
cd pg/docker && docker compose up -d
psql "postgresql://kalamdb:kalamdb123@127.0.0.1:5433/kalamdb" -c "SELECT kalam_version(), kalam_compiled_mode();"
```