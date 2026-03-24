# Contributing to vuzon

Thanks for your interest in improving vuzon. This guide covers how to set up your environment, coding conventions, and how to propose changes.

**Note:** most end users install from **Docker Compose** and the published image with **only** `docker-compose.yml` and `.env` (often downloaded from a release), without cloning this repository. The sections below are for **contributors** who work from a clone.

You can open issues for bugs or ideas, and pull requests for fixes or features.

## Before you start

- Read the [README](README.md) for requirements, environment variables, repository layout, and the build flow.
- For large or ambiguous changes, open an issue first to agree on scope.

## Development environment

- **Node.js** >= 18.
- Create a `.env` in the project root following the README (Cloudflare token, `DOMAIN`, panel credentials, etc.).

```bash
npm install
```

Alpine.js is vendored with `npm run setup` (also run as part of `npm run build`). If `public/vendor/alpine.js` is missing, run `npm run setup` before testing the UI.

```bash
npm run build    # setup + client build → dist/public
npm start        # build + start the server
```

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
- **Environment variables:** do not rename or relocate established conventions (`VUZON_PORT`, `./sessions`, session secret files under `./sessions/.session_secret` with legacy `./.session_secret`, etc.) unless that is an explicit part of the change and covered by tests and README updates where applicable.
- Avoid new production or tooling dependencies when the current stack is enough.
- Prefer focused changes: do not mix large refactors with behavior changes in the same PR.

## How to validate changes

Before submitting a PR, on your machine:

```bash
npm run check
```

This runs the build, syntax checks on `*.js` under `src`, `public`, `tests`, and `scripts`, and `node --test`.

If you changed the **Dockerfile**, **docker-compose**, or **server startup**, also run:

```bash
docker build -t vuzon-local .
```

To run the stack from a clone **building the image locally** (instead of GHCR):

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d
```

End users normally use only [`docker-compose.yml`](docker-compose.yml) with the published image; see the README.

Integration tests under `tests/integration/server/` start a temporary local server; in heavily restricted environments you may see `listen EPERM` even when the logic is correct.

## Pull requests

- Describe in full sentences **what** changes and **why**.
- Reference related issues when applicable.
- Add or update tests when behavior or HTTP/JSON contracts change.
- Confirm `npm run check` passes and `npm run build` still produces `dist/public` with the expected artifacts (`app.js`, `js/login.js`, `utils/*.js`, HTML, `ui.css`, `js/alpine.js`, assets, and `site.webmanifest`).

## License

By contributing, you agree your contributions are distributed under the same license as the project (see [LICENSE](LICENSE)).
