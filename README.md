# Taqseet Auth App

Unified login UI at `auth.taqseet.ru` for all Taqseet applications.

## Dev setup

```bash
# Terminal 1: auth API (port 8081)
cd ../taqseet-auth
lsof -nP -iTCP:8081 -sTCP:LISTEN   # ensure port is free
go run ./cmd

# Terminal 2: auth app (port 3005)
npm install
npm run dev
```

Dev OIDC issuer is proxied through auth-app (`VITE_OIDC_ISSUER=http://localhost:3005`) so IdP cookies work on the same origin.

Example legacy login URL for manager:

```
http://localhost:3005/login?app=manager&returnUrl=http://localhost:3000
```

After login, auth-app creates an SSO exchange code and redirects to:

```
http://localhost:3000/auth/callback?code=...
```

## OIDC flow (new clients)

Initiate login from a registered client:

```
GET {OIDC_ISSUER}/oauth2/authorize?client_id=manager-web&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=openid+profile+email&state=...&code_challenge=...&code_challenge_method=S256
```

Auth-app login UI establishes IdP session cookie, then redirects back to `/oauth2/authorize` to issue `code+state`.
Client exchanges code at `POST /oauth2/token` with PKCE `code_verifier`.

## Production

- UI: `auth.taqseet.ru` (static files → `/var/www/auth`)
- UI + API + OIDC: `auth.taqseet.ru` (static UI; nginx proxies `/api`, `/oauth2`, `/.well-known` → `taqseet-auth`)
- Deploy: `.github/workflows/deploy-auth-app.yml`

In dev, Vite proxies `/api`, `/oauth2`, `/.well-known` to `taqseet-auth` for same-origin cookies (`vite.config.ts`).

## Project structure notes

- `taqseet-auth-app` is frontend-only (Vite/React UI).
- Backend auth logic and auth API live in sibling project `../taqseet-auth`.
- Keep changes scoped: UI/route/form behavior in auth-app, identity/session/OIDC logic in taqseet-auth.

## Local artifacts policy

Do not commit local build and IDE artifacts from auth-app:

- `node_modules/`
- `dist/`
- `.idea/`
- `.vscode/`

For cleanup inventory and route/link consistency notes, see:

- `docs/cleanup-inventory.md`
# taqseet-auth-app
