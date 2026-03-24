<p align="center">
  <img src="./public/assets/logo.png" alt="vuzon" width="200"/>
</p>

<div align="center">

[English](#english) | [Español](#spanish)

</div>

<p align="center">
  <a href="https://github.com/Kernel-Nomad/vuzon/stargazers">
    <img src="https://img.shields.io/github/stars/Kernel-Nomad/vuzon?style=social" alt="GitHub stars"/>
  </a>
  &nbsp;
  <a href="https://github.com/Kernel-Nomad/vuzon/issues">
    <img src="https://img.shields.io/github/issues/Kernel-Nomad/vuzon" alt="GitHub issues"/>
  </a>
  &nbsp;
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/Kernel-Nomad/vuzon" alt="License"/>
  </a>
  &nbsp;
  <img src="https://img.shields.io/github/last-commit/Kernel-Nomad/vuzon" alt="Last commit"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/frontend-Alpine.js-8BC0D0?logo=alpinedotjs&logoColor=white" alt="Alpine.js"/>
  &nbsp;
  <img src="https://img.shields.io/badge/backend-Node.js%20%2B%20Express-339933?logo=nodedotjs&logoColor=white" alt="Node.js + Express"/>
  &nbsp;
  <img src="https://img.shields.io/badge/validation-Zod-3068B7?logo=zod&logoColor=white" alt="Zod"/>
  &nbsp;
  <img src="https://img.shields.io/badge/infra-Docker-2496ED?logo=docker&logoColor=white" alt="Docker"/>
  &nbsp;
  <img src="https://img.shields.io/badge/API-Cloudflare-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare"/>
</p>

<p align="center">
  <img src="./public/assets/dashboard.png" alt="dashboard" width="auto" height="auto">
</p>

<a id="english"></a>

# vuzon

Lightweight UI that uses the **Cloudflare Email Routing API** to create and manage **aliases** and **destination addresses**.

> What is Email Routing: https://developers.cloudflare.com/email-routing/

**Primary audience:** run vuzon with **Docker Compose** and the published image — you only need [`docker-compose.yml`](docker-compose.yml) and a `.env` file. **Cloning the repo is optional** (mainly for development).

### Recommended install

```bash
mkdir vuzon && cd vuzon
export VUZON_RELEASE=v1.0.0   # pick a tag from [Releases](https://github.com/Kernel-Nomad/vuzon/releases)
curl -fsSL -o docker-compose.yml "https://raw.githubusercontent.com/Kernel-Nomad/vuzon/${VUZON_RELEASE}/docker-compose.yml"
curl -fsSL -o .env.example "https://raw.githubusercontent.com/Kernel-Nomad/vuzon/${VUZON_RELEASE}/.env.example"
cp .env.example .env
# Edit .env: CF_API_TOKEN, DOMAIN, AUTH_PASS (optional: VUZON_PORT on the host)
docker compose pull && docker compose up -d
# Open http://localhost:8001 or http://localhost:$VUZON_PORT
```

You can also download `docker-compose.yml` and `.env.example` from the **assets** on each stable GitHub Release. More detail (pinning the image, troubleshooting, cloning): [Deployment with Docker Compose](#deployment-with-docker-compose).

---

## Features

- Create **aliases/rules** that route emails to **verified destination addresses**.
- List and manage **destination addresses** (add/remove).
- **Enable/Disable** rules directly from the UI.
- Session-protected dashboard with login/logout endpoints.
- Automatic detection of `CF_ZONE_ID` and `CF_ACCOUNT_ID` from `DOMAIN` when they are not provided.

---

## Requirements

- A Cloudflare domain with **Email Routing** available.
- A Cloudflare **API Token** with minimal permissions (see **Security**).
- Docker (for deployment with Compose) or Node.js >= 18 (for local execution).

---

## Environment Variables

Create a `.env` file in the project root:

**Suggested minimal token scopes:**
- **Account -> Email Routing Addresses: Read & Edit**
- **Zone -> Email Routing Rules: Read & Edit**

```env
# Token with edit permissions for Email Routing in your zone and account
CF_API_TOKEN=your_cloudflare_api_token
DOMAIN=yourdomain.com

# Optional: if set, startup skips automatic detection
CF_ZONE_ID=your_cloudflare_zone_id
CF_ACCOUNT_ID=your_cloudflare_account_id

# Panel login (required; never leave AUTH_PASS empty or whitespace-only — startup will fail)
AUTH_USER=admin
AUTH_PASS=your_secure_password

# Optional: trusted proxy hops for req.ip (e.g. rate limiting behind nginx). Default: 1 when NODE_ENV=production, otherwise off.
# TRUST_PROXY=1

# Public URL (optional, just for reference)
BASE_URL=https://vuzon.yourdomain.com

# Host port with Docker Compose (optional; default 8001). The Compose file sets PORT=8001 inside the container.
VUZON_PORT=8001
# Local `npm start` only: PORT overrides VUZON_PORT for the listen port.
# PORT=8001

# Session secret (optional; if omitted, persisted as ./sessions/.session_secret, else legacy ./.session_secret at repo root)
SESSION_SECRET=your_secure_secret
```

---

## Deployment with Docker Compose

The bundled [`docker-compose.yml`](docker-compose.yml) pulls **`ghcr.io/kernel-nomad/vuzon:latest`**, updated on each stable GitHub Release. Follow **[Recommended install](#recommended-install)** above to fetch `docker-compose.yml` and `.env.example` without cloning.

If the container exits or the panel does not start: **`docker compose logs -f vuzon`**.

**Pin the image to match your release files:** if you downloaded compose/env from Git tag `v1.2.3`, set the service image to the same semver published on GHCR (usually **without** the leading `v`), for example:

```yaml
image: ghcr.io/kernel-nomad/vuzon:1.2.3
```

That way the running image matches the `docker-compose.yml` and `.env.example` you fetched for that release.

**If you cloned the repository**, place `.env` in the project root and run `docker compose pull && docker compose up -d` the same way. To **build the image locally** instead of pulling from GHCR:

`docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d` — see [`docker-compose.build.yml`](docker-compose.build.yml).

**Compose details:**

- **`PORT=8001` inside the container** is set in Compose; **`VUZON_PORT`** in `.env` only changes the **host** side of `ports`. You do not need `PORT` in `.env` for this setup.
- **`env_file: .env`**: create `.env` from `.env.example` before `docker compose up`.

> The repository includes `.dockerignore` for faster local builds; see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Local Execution without Docker

```bash
npm install
npm start
# App at http://localhost:8001
```

`npm start` follows a build-first flow: it runs `npm run build`, which vendors Alpine into `public/vendor/alpine.js`, generates `dist/public`, and then boots `node src/server.js`.

> Requires Node.js >= 18.

---

## Validation

```bash
npm run check
```

- `npm run check` executes the build, syntax checks, and the full test suite.
- Container validation stays aligned with the same layout assumptions via `docker build -t vuzon-local .`.
- Integration tests under `tests/integration/server/` open a temporary local server. In restricted sandboxes you may see `listen EPERM` even when the assertions are correct.

---

## Repository Layout

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

- **Sessions** are stored on disk (`session-file-store`, default `./sessions`). Mount a persistent volume in Docker (see Compose) so logins survive restarts. The auto-generated session secret file lives at **`./sessions/.session_secret`** by default (legacy **`./.session_secret`** at the repo root is still read if present).
- **Multiple replicas** (e.g. several pods behind a load balancer) do **not** share session files unless you use sticky sessions or a shared session store. A single replica, or sticky sessions to the same instance, avoids unexpected logouts.
- **Production logs** do not print `AUTH_USER`; only whether panel credentials are configured.
- **Login brute-force mitigation**: after repeated failed logins per IP, the API returns `429` with `Retry-After`. Tune with `LOGIN_RATE_LIMIT_MAX` (default `30`, use `0` to disable), `LOGIN_RATE_LIMIT_WINDOW_MS` (default 15 minutes), and `LOGIN_RATE_LIMIT_MAX_BUCKETS` (default `10000`) to cap in-memory entries per distinct IP.
- **`TRUST_PROXY`**: trusted proxy hop count for Express (`req.ip`, used for login rate limiting). Default is `1` when `NODE_ENV=production`, otherwise disabled. Set `TRUST_PROXY=1` (or `2`, etc.) if TLS terminates on nginx/Traefik while `NODE_ENV` is not `production`.
- **JSON request bodies** for API routes are limited to **256kb**.
- **`CF_ZONE_ID` / `CF_ACCOUNT_ID`**: after autodetection or manual configuration, both must be non-empty and match Cloudflare-style identifiers (startup fails otherwise).

---

## Build and Runtime Flow

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

---

## Backend Routes

The backend exposes login/session endpoints plus a REST proxy to Cloudflare. Cloudflare-facing routes and `GET /api/me` require an authenticated session.

- `GET  /healthz` - Public healthcheck that returns `{ ok: true }`.
- `POST /api/login` - Authenticates with `{ username, password }`. Too many failed attempts from one IP returns `429` with `Retry-After` (see deployment notes for env vars).
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

> API References (Cloudflare): rules and addresses in the official documentation.

---

## Basic Usage

1. **Enable Email Routing** in your zone (from the Cloudflare UI or dashboard).
2. Add a **destination address** (a verification email will be sent).
3. Sign in to the vuzon panel and create an **alias (rule)** using a lowercase local-part and a **verified destination**.

---

## Security

- Use **API Tokens** with **minimal privileges** instead of the Global API Key.
- Set a strong **`AUTH_PASS`**; empty or whitespace-only values are rejected at startup.
- Place the app behind a reverse proxy with **TLS** and, if applicable, add **authentication**.

---

<a id="spanish"></a>

# vuzon

UI ligera que usa la **API de Cloudflare Email Routing** para crear y gestionar **alias** y **destinatarios** de forma sencilla.

> Que es Email Routing: https://developers.cloudflare.com/email-routing/

**Audiencia principal:** ejecutar vuzon con **Docker Compose** y la imagen publicada — solo necesitas [`docker-compose.yml`](docker-compose.yml) y un `.env`. **Clonar el repositorio es opcional** (sobre todo para desarrollo).

### Instalacion recomendada

```bash
mkdir vuzon && cd vuzon
export VUZON_RELEASE=v1.0.0   # elige un tag en [Releases](https://github.com/Kernel-Nomad/vuzon/releases)
curl -fsSL -o docker-compose.yml "https://raw.githubusercontent.com/Kernel-Nomad/vuzon/${VUZON_RELEASE}/docker-compose.yml"
curl -fsSL -o .env.example "https://raw.githubusercontent.com/Kernel-Nomad/vuzon/${VUZON_RELEASE}/.env.example"
cp .env.example .env
# Edita .env: CF_API_TOKEN, DOMAIN, AUTH_PASS (opcional: VUZON_PORT en el host)
docker compose pull && docker compose up -d
# Abre http://localhost:8001 o http://localhost:$VUZON_PORT
```

Tambien puedes descargar `docker-compose.yml` y `.env.example` desde los **assets** de cada release estable en GitHub. Mas detalle (fijar imagen, averias, clonar): [Despliegue con Docker Compose](#despliegue-con-docker-compose).

---

## Caracteristicas

- Crear **alias/reglas** que enrutan correos a **destinatarios verificados**.
- Listado y gestion de **destinatarios** (anadir/eliminar).
- **Habilitar/Deshabilitar** reglas desde la UI.
- Panel protegido por sesion con endpoints de login/logout.
- Deteccion automatica de `CF_ZONE_ID` y `CF_ACCOUNT_ID` a partir de `DOMAIN` cuando no se proporcionan.

---

## Requisitos

- Un dominio en Cloudflare con **Email Routing** disponible.
- Un **API Token** de Cloudflare con permisos minimos (ver **Seguridad**).
- Docker (para despliegue con Compose) o Node.js >= 18 (para ejecucion local).

---

## Variables de entorno

Crea un `.env` en la raiz del proyecto:

**Scopes minimos sugeridos para el token:**

- **Account -> Email Routing Addresses: Read & Edit**
- **Zone -> Email Routing Rules: Read & Edit**

```env
# Token con permisos de edicion para Email Routing en tu zona y cuenta
CF_API_TOKEN=tu_token_api_de_cloudflare
DOMAIN=tudominio.com

# Opcional: si se definen, el arranque no intenta autodetectarlos
CF_ZONE_ID=tu_zone_id_de_cloudflare
CF_ACCOUNT_ID=tu_account_id_de_cloudflare

# Credenciales del panel (obligatorias; no dejes AUTH_PASS vacío ni solo espacios — el arranque fallará)
AUTH_USER=admin
AUTH_PASS=tu_contraseña_segura

# Opcional: saltos de proxy de confianza para req.ip (p. ej. rate limit tras nginx). Por defecto: 1 si NODE_ENV=production, si no desactivado.
# TRUST_PROXY=1

# URL publica (opcional, para referencia)
BASE_URL=https://vuzon.tudominio.com

# Puerto en el host con Docker Compose (opcional; por defecto 8001). El compose fija PORT=8001 dentro del contenedor.
VUZON_PORT=8001
# Solo ejecucion local con `npm start`: PORT tiene prioridad sobre VUZON_PORT.
# PORT=8001

# Secreto de sesion (opcional; si falta, ./sessions/.session_secret; legado: ./.session_secret en la raiz)
SESSION_SECRET=tu_secreto_seguro
```

---

## Despliegue con Docker Compose

El [`docker-compose.yml`](docker-compose.yml) del repo usa **`ghcr.io/kernel-nomad/vuzon:latest`**, actualizado en cada release estable de GitHub. Sigue **[Instalacion recomendada](#instalacion-recomendada)** arriba para obtener `docker-compose.yml` y `.env.example` sin clonar.

Si el contenedor sale o el panel no arranca: **`docker compose logs -f vuzon`**.

**Fija la imagen al mismo release que tus ficheros:** si descargaste compose/env del tag `v1.2.3`, pon en el servicio la misma version semver publicada en GHCR (normalmente **sin** la `v` inicial), por ejemplo:

```yaml
image: ghcr.io/kernel-nomad/vuzon:1.2.3
```

Asi la imagen en ejecucion coincide con el `docker-compose.yml` y el `.env.example` de ese release.

**Si clonaste el repositorio**, deja `.env` en la raiz del proyecto y ejecuta `docker compose pull && docker compose up -d` igual. Para **construir la imagen en local** en lugar de GHCR:

`docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d` — ver [`docker-compose.build.yml`](docker-compose.build.yml).

**Detalles del compose:**

- **`PORT=8001` dentro del contenedor** lo fija el compose; **`VUZON_PORT`** en `.env` solo afecta el **host** en `ports`. No hace falta definir `PORT` en `.env` para este despliegue.
- **`env_file: .env`**: crea `.env` a partir de `.env.example` antes de `docker compose up`.

> El repo incluye `.dockerignore` para builds locales rapidos; mas en [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Ejecucion local sin Docker

```bash
npm install
npm start
# App en http://localhost:8001
```

`npm start` sigue un flujo build-first: ejecuta `npm run build`, que vendoriza Alpine en `public/vendor/alpine.js`, genera `dist/public` y despues arranca `node src/server.js`.

> Requiere Node.js >= 18.

---

## Validacion

```bash
npm run check
```

- `npm run check` ejecuta el build, el chequeo sintactico y la suite completa de tests.
- La validacion del contenedor se mantiene sobre el mismo layout con `docker build -t vuzon-local .`.
- Las pruebas de `tests/integration/server/` levantan un servidor temporal local. En sandboxes restringidos puede aparecer `listen EPERM` aunque las aserciones sean correctas.

---

## Estructura del repositorio

- `src/server/`: backend dividido en `bootstrap/`, `features/`, `platform/` y `config/`.
- `src/client/`: frontend dividido en `entrypoints/`, `app/`, `features/`, `shared/` y `compat/public-utils/`.
- `src/client/compat/public-utils/`: fuente de la capa publica de compatibilidad emitida como `/utils/*.js`.
- Los modulos internos del cliente deben depender de `src/client/shared/`; `src/client/compat/public-utils/` existe solo para preservar la superficie publica `/utils/*.js`.
- `public/`: fuentes estaticas (`pages/`, `styles/`, `assets/`, `vendor/`, `site.webmanifest`) usadas como input del build; no se sirven directamente.
- `public/vendor/alpine.js`: asset vendorizado por `npm run setup`; el build lo publica como `/js/alpine.js` y no se versiona.
- `dist/public/`: artefactos generados del frontend y unico directorio servido por Express en runtime.
- `src/shared/`: modulos pequeños compartidos entre capas (por ejemplo esquemas Zod usados por `config/` y `features/`). Mantenerlo acotado; no usarlo como cajon de sastre.
- `tests/unit/` y `tests/integration/`: cobertura principal automatizada.
- `tests/architecture/` y `tests/scripts/`: comprobaciones ligeras (layout del repo, `node --check` sobre scripts de build).

### Notas de despliegue

- Las **sesiones** se guardan en disco (`session-file-store`, por defecto `./sessions`). En Docker monta un volumen persistente (ver Compose) para que el login sobreviva a reinicios. El secreto de sesion autogenerado queda en **`./sessions/.session_secret`** por defecto (sigue leyendose **`./.session_secret`** en la raiz si existia).
- **Varias réplicas** (varios pods tras un balanceador) **no** comparten ficheros de sesión salvo que uses sticky sessions o un almacén de sesión compartido. Una sola réplica, o afinidad al mismo nodo, evita cierres de sesión inesperados.
- En **producción** los logs **no** imprimen `AUTH_USER`; solo si las credenciales del panel están configuradas.
- **Mitigación de fuerza bruta en login**: tras fallos repetidos por IP, la API responde `429` con `Retry-After`. Ajusta con `LOGIN_RATE_LIMIT_MAX` (por defecto `30`, `0` desactiva), `LOGIN_RATE_LIMIT_WINDOW_MS` (por defecto 15 minutos) y `LOGIN_RATE_LIMIT_MAX_BUCKETS` (por defecto `10000`) para acotar entradas en memoria por IP distinta.
- **`TRUST_PROXY`**: número de saltos de proxy de confianza de Express (`req.ip`, usado en el rate limit de login). Por defecto es `1` con `NODE_ENV=production`, si no está desactivado. Usa `TRUST_PROXY=1` (o `2`, etc.) si el TLS termina en nginx/Traefik y `NODE_ENV` no es `production`.
- **Cuerpos JSON** de la API limitados a **256kb**.
- **`CF_ZONE_ID` / `CF_ACCOUNT_ID`**: tras autodetección o configuración manual, ambos deben ser no vacíos y con formato de identificador Cloudflare (si no, el arranque falla).

---

## Flujo de build y runtime

1. `scripts/download-alpine.js` vendoriza Alpine en `public/vendor/alpine.js`.
2. `scripts/build-client.js` empaqueta `src/client/entrypoints/*`, emite `/utils/*.js` desde `src/client/compat/public-utils/*` y copia los estaticos a `dist/public`.
3. Express sirve exclusivamente `dist/public`, mientras las rutas backend viven en `src/server/features/*`.

Mapping canonico de fuentes a artefactos:

- `src/client/entrypoints/dashboard.js` -> `/app.js`
- `src/client/entrypoints/login.js` -> `/js/login.js`
- `src/client/compat/public-utils/*.js` -> `/utils/*.js`
- `public/pages/*.html` -> `/index.html` y `/login.html`
- `public/styles/ui.css` -> `/ui.css`
- `public/vendor/alpine.js` -> `/js/alpine.js`
- `public/assets/*` -> `/assets/*`
- `public/site.webmanifest` -> `/site.webmanifest`

La superficie publica generada es:

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

---

## Rutas del backend

El backend expone endpoints de login/sesion y un proxy REST hacia Cloudflare. Las rutas que hablan con Cloudflare y `GET /api/me` requieren sesion autenticada.

- `GET  /healthz` - Healthcheck publico que devuelve `{ ok: true }`.
- `POST /api/login` - Autentica con `{ username, password }`. Demasiados fallos desde una IP devuelve `429` con `Retry-After` (variables en notas de despliegue).
- `POST /api/logout` - Cierra la sesion actual.
- `GET  /api/me` - Devuelve `{ email, rootDomain }` para el usuario autenticado.
- `GET  /api/addresses` - Lista destinatarios.
- `POST /api/addresses` - Crea destinatario `{ email }`.
- `DELETE /api/addresses/:id` - Elimina destinatario.
- `GET  /api/rules` - Lista reglas/alias.
- `POST /api/rules` - Crea regla `{ localPart, destEmail }` donde `localPart` debe venir ya en minusculas y cumplir `^[a-z0-9._-]+$` (1-64 caracteres), y `destEmail` debe ser un correo valido.
- `DELETE /api/rules/:id` - Elimina regla.
- `POST /api/rules/:id/enable` - Habilita regla.
- `POST /api/rules/:id/disable` - Deshabilita regla.

Las peticiones no autenticadas a `/api/*` devuelven `401 { error: "No autorizado" }` y no redirigen a la pagina de login.

> Referencias de API (Cloudflare): reglas y direcciones en la documentacion oficial.

---

## Uso basico

1. **Activa Email Routing** en tu zona (desde la UI o dashboard de Cloudflare).
2. Añade una **direccion de destino** (se enviara un correo de verificacion).
3. Inicia sesion en el panel de vuzon y crea un **alias (regla)** usando un local-part en minusculas y un **destino verificado**.

---

## Seguridad

- Usa **API Tokens** con **privilegios minimos** en lugar de la Global API Key.
- Define un **`AUTH_PASS`** fuerte; valores vacíos o solo espacios se rechazan en el arranque.
- Ubica la app tras un reverse proxy con **TLS** y, si procede, añade **autenticacion**.
