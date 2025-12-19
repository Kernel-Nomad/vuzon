<p align="center">
  <img src="./assets/logo.png" alt="vuzon" width="200"/>
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
  <img src="./assets/dashboard.png" alt="dashboard" width="auto" height="auto">
</p>

<a id="english"></a>

# vuzon

Lightweight UI that uses the **Cloudflare Email Routing API** to easily create and manage **aliases** and **destination addresses**.

> What is Email Routing: https://developers.cloudflare.com/email-routing/

---

## Features
- Create **aliases/rules** that route emails to **verified destination addresses**.
- List and manage **destination addresses** (add/remove).
- **Enable/Disable** rules directly from the UI.
- **Enable Email Routing** in the zone (adds/locks required MX and SPF records).
- Responsive UI and PWA (manifest + icons).

---

## Requirements
- A Cloudflare domain with **Email Routing** available.
- A Cloudflare **API Token** with minimal permissions (see **Security**).
- Docker (for deployment with Compose) or Node.js ≥ 18 (for local execution).

---

## Environment Variables

Create a `.env` file in the project root:

**Suggested minimal token scopes:**
- **Account → Email Routing Addresses: Read & Edit**
- **Zone → Email Routing Rules: Read & Edit**
- **Zone → Email Routing DNS: Edit** (only if you plan to enable Email Routing via API)

```env
# Cloudflare Email Routing
CF_API_TOKEN=
DOMAIN=

AUTH_USER=
AUTH_PASS=

BASE_URL=[https://vuzon.mydomain.com](https://vuzon.mydomain.com)

VUZON_PORT=8001

```

---

## Deployment with Docker Compose

> Tip: the repository includes a `.dockerignore` file that excludes dependencies, logs, and environment files, reducing the build context for lighter images and faster builds.

```yaml
services:
  vuzon:
    image: ghcr.io/Kernel-Nomad/vuzon
    env_file:
      - .env
    restart: unless-stopped
    ports:
      - "${VUZON_PORT:-8001}:8001"
    volumes:
      - ./sessions:/app/sessions

```

**Run:**

```bash
docker compose up -d
# Open http://localhost:8001

```

---

## Local Execution without Docker

```bash
npm install
npm start
# App at http://localhost:8001

```

> Requires Node.js ≥ 18.

---

## Backend Routes

The backend exposes a REST proxy to Cloudflare:

* `GET  /api/addresses` — Lists destination addresses.
* `POST /api/addresses` — Creates destination address `{ email }`.
* `DELETE /api/addresses/:id` — Deletes destination address.
* `GET  /api/rules` — Lists rules/aliases.
* `POST /api/rules` — Creates rule `{ localPart, destEmail }` (the `localPart` is trimmed and only allows letters, numbers, dots, and hyphens; `destEmail` must be a valid email).
* `DELETE /api/rules/:id` — Deletes rule.
* `POST /api/rules/:id/enable` — Enables rule.
* `POST /api/rules/:id/disable` — Disables rule.
* `POST /api/enable-routing` — Enables Email Routing in the zone (adds/locks MX and SPF).

> API References (Cloudflare): rules, addresses, and DNS activation in the official documentation.

---

## Basic Usage

1. **Enable Email Routing** in your zone (from the Cloudflare UI or dashboard).
2. Add a **destination address** (a verification email will be sent).
3. Create an **alias (rule)** choosing a *local-part* and the **verified destination**.

---

## Security

* Use **API Tokens** with **minimal privileges** instead of the Global API Key.
* Place the app behind a *reverse proxy* with **TLS** and, if applicable, add **authentication**.

---

<a id="spanish"></a>

# vuzon

UI ligera que usa la **API de Cloudflare Email Routing** para crear y gestionar **alias** y **destinatarios** de forma sencilla.

> Qué es Email Routing: https://developers.cloudflare.com/email-routing/

---

## Características

* Crear **alias/reglas** que enrutan correos a **destinatarios verificados**.
* Listado y gestión de **destinatarios** (añadir/eliminar).
* **Habilitar/Deshabilitar** reglas desde la UI.
* **Activar Email Routing** en la zona (añade/bloquea MX y SPF requeridos).
* UI responsive y PWA (manifest + iconos).

---

## Requisitos

* Un dominio en Cloudflare con **Email Routing** disponible.
* Un **API Token** de Cloudflare con permisos mínimos (ver **Seguridad**).
* Docker (para despliegue con Compose) o Node.js ≥ 18 (para ejecución local).

---

## Variables de entorno

Crea un `.env` en la raíz del proyecto:

**Scopes mínimos sugeridos para el token:**

* **Account → Email Routing Addresses: Read & Edit**
* **Zone → Email Routing Rules: Read & Edit**
* **Zone → Email Routing DNS: Edit** (solo si vas a activar Email Routing por API)

```env
# Cloudflare Email Routing
CF_API_TOKEN=
DOMAIN=

AUTH_USER=
AUTH_PASS=

BASE_URL=[https://vuzon.midominio.com](https://vuzon.midominio.com)

VUZON_PORT=8001

```

---

## Despliegue con Docker Compose

> Consejo: el repositorio incluye un `.dockerignore` que excluye dependencias, logs y archivos de entorno, reduciendo el contexto de build y logrando imágenes más ligeras y compilaciones más rápidas.

```yaml
services:
  vuzon:
    image: ghcr.io/Kernel-Nomad/vuzon
    env_file:
      - .env
    restart: unless-stopped
    ports:
      - "${VUZON_PORT:-8001}:8001"
    volumes:
      - ./sessions:/app/sessions

```

**Levantar:**

```bash
docker compose up -d
# Abre http://localhost:8001

```

---

## Ejecución local sin Docker

```bash
npm install
npm start
# App en http://localhost:8001

```

> Requiere Node.js ≥ 18.

---

## Rutas del backend

El backend expone un proxy REST hacia Cloudflare:

* `GET  /api/addresses` — Lista destinatarios.
* `POST /api/addresses` — Crea destinatario `{ email }`.
* `DELETE /api/addresses/:id` — Elimina destinatario.
* `GET  /api/rules` — Lista reglas/alias.
* `POST /api/rules` — Crea regla `{ localPart, destEmail }` (el `localPart` se recorta y solo admite letras, números, puntos y guiones; `destEmail` debe ser un correo válido).
* `DELETE /api/rules/:id` — Elimina regla.
* `POST /api/rules/:id/enable` — Habilita regla.
* `POST /api/rules/:id/disable` — Deshabilita regla.
* `POST /api/enable-routing` — Activa Email Routing en la zona (añade/bloquea MX y SPF).

> Referencias de API (Cloudflare): reglas, direcciones y activación DNS en la documentación oficial.

---

## Uso básico

1. **Activa Email Routing** en tu zona (desde la UI o dashboard de Cloudflare).
2. Añade una **dirección de destino** (se enviará un correo de verificación).
3. Crea un **alias (regla)** eligiendo *local-part* y el **destino verificado**.

---

## Seguridad

* Usa **API Tokens** con **privilegios mínimos** en lugar de la Global API Key.
* Ubica la app tras un *reverse proxy* con **TLS** y, si procede, añade **autenticación**.
