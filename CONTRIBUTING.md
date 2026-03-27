# Contributing to vuzon

Thanks for your interest in improving vuzon. This guide covers how to set up your environment, coding conventions, and how to propose changes.

**Note:** most people run vuzon with **Docker Compose** using only `docker-compose.yml` and `.env` (often from a release), without cloning. The sections below are for **contributors** working from a clone.

You can open issues for bugs or ideas, and pull requests for fixes or features.

## Before you start

- Read the [README](README.md) for the homelab-oriented install path and minimal environment variables.
- Use this document for **repository layout**, **build flow**, **HTTP routes**, and **deployment details** when developing or reviewing changes.
- For large or ambiguous changes, open an issue first to agree on scope.

## Development environment

- **Node.js 24** (LTS) or newer, matching the `Dockerfile` base image and CI (`setup-node`); see `engines` in `package.json`.
- Create a `.env` in the project root (same fields as end users: Cloudflare token, `DOMAIN`, panel credentials). [`.env.example`](.env.example) is a minimal template; the full list of optional environment variables is in [README.md](README.md).

```bash
npm install
```

Alpine.js is vendored with `npm run setup` (also run as part of `npm run build`). If `public/vendor/alpine.js` is missing, run `npm run setup` before testing the UI.

```bash
npm run build    # setup + client build → dist/public
npm start        # build + start the server
```

`npm start` runs `npm run build` first (vendors Alpine into `public/vendor/alpine.js`, generates `dist/public`), then `node src/server.js`.

## Where to make changes

- **Backend:** routes in `src/server/features/*/routes.js`; integrations in `src/server/platform/`; configuration in `src/server/config/`. Keep `src/server.js` as a thin entrypoint.
- **Frontend:** application code under `src/client/`; shared utilities in `src/client/shared/`. The public `/utils/*.js` surface comes from `src/client/compat/public-utils/` (do not break paths or exports without updating tests).
- **Static assets:** the build copies from `public/` into `dist/public`. Do not put application logic only in `public/`; the supported pipeline is `scripts/build-client.js`.
- **Tests:** primary coverage in `tests/unit/` and `tests/integration/`; smoke checks in `tests/architecture/` and `tests/scripts/`.

## Code conventions

- **ESM modules** (`"type": "module"` in `package.json`).
- **Validate HTTP inputs** at the edge with Zod; keep the JSON shapes already consumed by the UI or tests (`{ success: true }`, `{ ok: true, result }`, `{ result }`, `{ error }`, etc.).
- **User-visible messages and errors** stay in **Spanish**, unless the change is explicitly for copy in another language.
- **Session and cookies:** the client uses `credentials: 'include'`; any auth/session change should stay consistent across server, client, and tests.
- **Environment variables:** do not rename or relocate established conventions (`VUZON_PORT`, `SESSION_SECRET`, etc.) unless that is an explicit part of the change and covered by tests and README updates where applicable.
- Avoid new production or tooling dependencies when the current stack is enough.
- Prefer focused changes: do not mix large refactors with behavior changes in the same PR.

## How to validate changes

Before submitting a PR, on your machine:

```bash
npm run check
```

This runs the build, syntax checks on `*.js` under `src`, `public`, `tests`, and `scripts`, and `node --test`. See [Validation (details)](#validation-details) below for more context.

If you changed the **Dockerfile**, **docker-compose**, or **server startup**, also run:

```bash
docker build -t vuzon-local .
```

To run the stack from a clone **building the image locally** (instead of GHCR):

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d
```

End users normally use only [`docker-compose.yml`](docker-compose.yml) with the published image; see the [README](README.md).

Integration tests under `tests/integration/server/` start a temporary local server; in heavily restricted environments you may see `listen EPERM` even when the logic is correct.

## Pull requests

- Describe in full sentences **what** changes and **why**.
- Reference related issues when applicable.
- Add or update tests when behavior or HTTP/JSON contracts change.
- Confirm `npm run check` passes and `npm run build` still produces `dist/public` with the expected artifacts (`app.js`, `js/login.js`, `utils/*.js`, HTML, `ui.css`, `js/alpine.js`, assets, and `site.webmanifest`).

## License

By contributing, you agree your contributions are distributed under the same license as the project (see [LICENSE](LICENSE)).

---

## Technical reference

### Docker Compose (from a clone)

The bundled [`docker-compose.yml`](docker-compose.yml) pulls **`ghcr.io/kernel-nomad/vuzon:latest`**, updated on stable GitHub Releases. Place `.env` in the project root and run `docker compose pull && docker compose up -d` like end users.

**Pin the image to match release files:** if you downloaded `docker-compose.yml` and `.env.example` from a given Git tag, set the service `image` to the **same semver** published on GHCR for that release (registry tags usually **omit** the leading `v` from the Git tag). That keeps the running image aligned with the compose and env template you fetched.

**Build locally instead of pulling:** merge with [`docker-compose.build.yml`](docker-compose.build.yml):

`docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d`

**Compose details:**

- **`PORT=8001` inside the container** is set in Compose; **`VUZON_PORT`** in `.env` only changes the **host** side of `ports`. You do not need `PORT` in `.env` for this setup.
- **`env_file`**: `.env` is optional at Compose parse time (**Docker Compose v2.24+**); create it from `.env.example` so the app receives **`CF_API_TOKEN`**, **`DOMAIN`**, and panel credentials.

> The repository includes `.dockerignore` for faster local builds.

### Local execution without Docker

```bash
npm install
npm start
# App at http://localhost:8001 (unless overridden via env)
```

### Validation details

- `npm run check` executes the build, syntax checks, and the full test suite.
- Container validation stays aligned with the same layout assumptions via `docker build -t vuzon-local .`.
- Integration tests under `tests/integration/server/` open a temporary local server. In restricted sandboxes you may see `listen EPERM` even when the assertions are correct.

### Repository layout

- `src/server/`: backend source split into `bootstrap/`, `features/`, `platform/`, and `config/`.
- `src/client/`: frontend source split into `entrypoints/`, `app/`, `features/`, `shared/`, and `compat/public-utils/`.
- `src/client/compat/public-utils/`: source of the public compatibility layer emitted as `/utils/*.js`.
- Internal client modules should depend on `src/client/shared/`; `src/client/compat/public-utils/` exists only to preserve the public `/utils/*.js` surface.
- `public/`: static source files (`pages/`, `styles/`, `assets/`, `vendor/`, `site.webmanifest`) used as build input, not served directly.
- `public/vendor/alpine.js`: vendored asset produced by `npm run setup`; it is copied to `/js/alpine.js` during the build and is not versioned.
- `dist/public/`: generated frontend artifacts and the only directory served by Express at runtime.
- `src/shared/`: small cross-layer modules (for example Zod schemas consumed by both `config/` and `features/`). Keep it focused; avoid using it as a general dumping ground.
- `tests/unit/` and `tests/integration/`: primary automated coverage.
- `tests/architecture/` and `tests/scripts/`: lightweight smoke checks (expected repository layout, `node --check` on build scripts).

### Deployment notes

- **Sessions** use **`cookie-session`**: login payload is signed and stored in the **`vuzon_session`** cookie. There is no server-side session directory. Set **`SESSION_SECRET`** in the environment so the signing key is stable across restarts; if it is missing, the server generates an ephemeral secret at startup (logins stop working after every restart).
- **Multiple replicas** behind a load balancer can share the same **`SESSION_SECRET`**; the browser sends the signed cookie on each request, so sticky sessions are not required for auth.
- **Logs** in typical production-style `NODE_ENV` do not print `AUTH_USER`; only whether panel credentials are configured.
- **`TRUST_PROXY`**: trusted proxy hop count for Express (`app.set('trust proxy', …)`). **Off** unless you set it (e.g. `TRUST_PROXY=1` behind nginx/Traefik).
- **JSON request bodies** for API routes are limited to **256kb**.
- **`CF_ZONE_ID` / `CF_ACCOUNT_ID`**: after autodetection or manual configuration, both must be non-empty and match Cloudflare-style identifiers (startup fails otherwise).
- **`VUZON_PUBLIC_DIR`**: optional override for the static/HTML directory (default `dist/public` resolved from the package layout).
- **`BASE_URL`:** documentation or reverse-proxy reference only; the application does not read it at runtime.

### Build and runtime flow

1. `scripts/download-alpine.js` vendors Alpine into `public/vendor/alpine.js`.
2. `scripts/build-client.js` bundles `src/client/entrypoints/*`, emits `/utils/*.js` from `src/client/compat/public-utils/*`, and copies static sources into `dist/public`.
3. Express serves only `dist/public`, while backend routes stay in `src/server/features/*`.

Canonical source-to-output mapping:

- `src/client/entrypoints/dashboard.js` -> `/app.js`
- `src/client/entrypoints/login.js` -> `/js/login.js`
- `src/client/compat/public-utils/*.js` -> `/utils/*.js`
- `public/pages/*.html` -> `/index.html` and `/login.html`
- `public/styles/ui.css` -> `/ui.css`
- `public/vendor/alpine.js` -> `/js/alpine.js`
- `public/assets/*` -> `/assets/*`
- `public/site.webmanifest` -> `/site.webmanifest`

The generated public surface is:

- `app.js`
- `js/login.js`
- `utils/destSelection.js`
- `utils/error.js`
- `utils/verification.js`
- `index.html`
- `login.html`
- `ui.css`
- `js/alpine.js`
- `assets/`
- `site.webmanifest`

### Backend routes

The backend exposes login/session endpoints plus a REST proxy to Cloudflare. Cloudflare-facing routes and `GET /api/me` require an authenticated session.

- `GET  /healthz` - Public endpoint that returns `{ ok: true }`.
- `POST /api/login` - Authenticates with `{ username, password }`. Wrong credentials return `401`.
- `POST /api/logout` - Closes the current session.
- `GET  /api/me` - Returns `{ email, rootDomain }` for the authenticated user.
- `GET  /api/addresses` - Lists destination addresses.
- `POST /api/addresses` - Creates destination address `{ email }`.
- `DELETE /api/addresses/:id` - Deletes destination address.
- `GET  /api/rules` - Lists rules/aliases.
- `POST /api/rules` - Creates rule `{ localPart, destEmail }` where `localPart` must already be lowercase and match `^[a-z0-9._-]+$` (1-64 chars), and `destEmail` must be a valid email.
- `DELETE /api/rules/:id` - Deletes rule.
- `POST /api/rules/:id/enable` - Enables rule.
- `POST /api/rules/:id/disable` - Disables rule.

Unauthenticated requests to `/api/*` return `401 { error: "No autorizado" }` and do not redirect to the login page.

> Cloudflare API references for rules and addresses: official Cloudflare documentation.
