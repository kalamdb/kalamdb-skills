# Auth

Use this file for authentication, authorization, bootstrap, cookies, JWT, OAuth/OIDC, RBAC, and PG extension auth.

## Sources

- `backend/crates/kalamdb-auth/`
- `AGENTS.md`
- `docs/security/backend-hardening.md`
- `docs/security/tls-and-secrets.md`
- `docs/security/firebase-auth.md`
- `docs/api/api-reference.md`

## Technologies

- bcrypt for password hashing
- JWT bearer tokens with HS256 for local auth
- HTTP Basic auth only on the login exchange path
- OAuth/OIDC providers: Google, GitHub, Azure, Firebase
- Roles: `user`, `service`, `dba`, `system`

## Role Hierarchy

`system > dba > service > user`

Always verify role claims against persisted state before privileged work.

## Endpoint Rules

- `POST /v1/api/auth/login` is the only endpoint accepting direct user/password credentials.
- `POST /v1/api/auth/refresh` accepts bearer token or auth cookie, not raw user/password.
- `POST /v1/api/auth/logout` clears auth cookie state.
- `GET /v1/api/auth/me` returns current user and `admin_ui_access`.
- `POST /v1/api/auth/setup` is initial bootstrap only. It is localhost-only unless remote setup is explicitly allowed.
- `GET /v1/api/auth/status` reports setup state.

## Password And JWT Rules

- Never store plaintext passwords.
- Use bcrypt verification for timing-safe password checks.
- Use generic invalid credential messages.
- Respect bcrypt's 72 byte password material limit.
- JWT secrets must be non-default and at least 32 characters for non-localhost deployment.
- Auth cookies must be `HttpOnly`; use `SameSite=Strict` and `Secure` in production.

## OAuth/OIDC

Provider sections live under `[oauth.providers.<name>]`. Each provider has `enabled`, `issuer`, `jwks_uri`, optional `client_id`, optional `client_secret`, and optional Azure `tenant`.

If auto-provision is enabled, ensure the default role is intentionally chosen and does not grant elevated privileges.

## PG Extension Auth

Preferred FDW mode is `account_login`, which exchanges Basic credentials once on gRPC `open_session` and then uses an opaque session handle. Legacy `static_header` remains available for compatibility.

If using `pg_auth_token`, configure it as a secret, not in committed config.