# Auth

Use this file for authentication, authorization, bootstrap, cookies, JWT, OIDC, RBAC, and PG extension auth.

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
- One configured OIDC provider through `[auth.oidc]`
- Roles: `user`, `service`, `dba`, `system`

## Role Hierarchy

`system > dba > service > user`

Shared-table row visibility is **not** this hierarchy for `user`/`service`: those roles are default-deny on `SHARED` tables until `CREATE POLICY`. See [rls-policies.md](rls-policies.md).

Always verify elevated role claims against persisted local user state before privileged work. Regular external OIDC users can stay stateless when `[auth.oidc].default_role = "user"`, but external-token auth must check for an existing `system.users` row first so deleted users and same-ID local password users are not bypassed.

## Endpoint Rules

- `POST /v1/api/auth/login` is the only endpoint accepting direct user/password credentials.
- `POST /v1/api/auth/refresh` accepts bearer token or auth cookie, not raw user/password.
- `POST /v1/api/auth/logout` clears auth cookie state.
- `GET /v1/api/auth/me` returns current user and `admin_ui_access`.
- `GET /v1/api/auth/login-options` returns public local/OIDC login metadata for UI and CLI clients.
- `POST /v1/api/auth/oidc/exchange-code` exchanges an authorization code plus PKCE verifier for KalamDB access and refresh tokens.
- `POST /v1/api/auth/oidc/exchange-token` exchanges a provider OIDC ID token for KalamDB access and refresh tokens.
- `POST /v1/api/auth/oidc/device/start` starts KalamDB-brokered OIDC device flow when enabled.
- `POST /v1/api/auth/oidc/device/poll` polls brokered OIDC device flow and returns KalamDB tokens when authorized.
- `POST /v1/api/auth/setup` is initial bootstrap only. It is localhost-only unless remote setup is explicitly allowed.
- `GET /v1/api/auth/status` reports setup state.

## Password And JWT Rules

- Never store plaintext passwords.
- Use bcrypt verification for timing-safe password checks.
- Use generic invalid credential messages.
- Respect bcrypt's 72 byte password material limit.
- JWT secrets must be non-default and at least 32 characters for non-localhost deployment.
- Auth cookies must be `HttpOnly`; use `SameSite=Strict` and `Secure` in production.
- `auth.local.enabled = false` disables password login and password setup server-side.
- Local password policy lives under `[auth.local]`: `bcrypt_cost`, `min_password_length`, `max_password_length`, `enforce_password_complexity`.

## OIDC

Canonical config uses `[auth]`, `[auth.local]`, and `[auth.oidc]`. KalamDB supports at most one OIDC provider per server. Any IdP such as Dex, Keycloak, Firebase, Okta, Auth0, or Entra ID is represented by its OIDC issuer.

The Admin UI and CLI discover login policy with `GET /v1/api/auth/login-options`. Configure the external IdP redirect URI as `/ui/oauth/callback` for Admin UI browser login and `http://127.0.0.1:8787/callback` for CLI browser PKCE login. Browser flows send the authorization code to KalamDB through `/v1/api/auth/oidc/exchange-code`; direct no-browser device flow sends the provider ID token to `/v1/api/auth/oidc/exchange-token`. Clients should save KalamDB access and refresh tokens, not provider credentials.

When `kalam login` runs from an interactive terminal, successful local and OIDC logins should continue directly into the SQL shell. If stdin or stdout is not a terminal, the command should keep the one-shot behavior and exit after printing login details so scripted callers do not block.

OIDC validation uses the `openidconnect` crate for discovery, issuer/audience checks, signature verification, expiry checks, and device flow exchanges. Do not add custom JWKS fetch or provider-family branches for active auth.

OIDC users use the authenticated `sub` claim directly as the KalamDB `user_id`. That same value appears in `system.users.user_id`, SQL identity, and PG extension `EXECUTE AS USER '<user_id>'` flows. Do not generate `u_oidc_`, `e_<hash>`, provider-family IDs, or legacy aliases.

Persisted OIDC users must have `user_id == auth_data.subject` and matching `auth_data.issuer`. Pending OIDC email invites are stored in `system.users` with `auth_type = "oidc_invite"`, a synthetic `invite_<hash>` user ID, `email`, `role`, `invite_expires_at`, and `invited_by`; they are accepted by matching the verified OIDC token email, creating the real `user_id = sub` row, and soft-deleting the invite. If auto-provision is enabled with `default_role = "user"`, absent OIDC users authenticate as regular stateless users after the persisted-row and invite checks. If auto-provision is enabled with an elevated default role, create a persisted OIDC row with `user_id = sub`. If auto-provision is disabled, require an explicit persisted OIDC row or active invite before login.

Keep OIDC authentication, subject-to-user resolution, token auth-type handling, and refresh identity resolution in `kalamdb-auth`. Other crates may store/read user rows, but should not duplicate OIDC identity mapping logic.

## PG Extension Auth

Preferred FDW mode is `account_login`, which exchanges Basic credentials once on gRPC `open_session` and then uses an opaque session handle. Legacy `static_header` remains available for compatibility.

If using `pg_auth_token`, configure it as a secret, not in committed config.
