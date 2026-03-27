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
  <img src="./public/assets/dashboard.png" alt="vuzon dashboard" width="auto" height="auto">
</p>

<a id="english"></a>

# vuzon

**vuzon** is a lightweight web UI to manage **aliases and rules** for [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) and **destination addresses**. It is meant for **personal use** with your Cloudflare account on a **homelab or private network**, not as a public multi-tenant or “production SaaS” deployment.

---

## Installation

### Homelab (Docker Compose)

Use **Docker Compose v2.24+** so `.env` can be optional at compose-parse time; the app still requires a configured `.env` (or equivalent env) to stay running.

**Quick install** (from [latest release](https://github.com/Kernel-Nomad/vuzon/releases/latest) assets — no clone):

```bash
mkdir vuzon && cd vuzon
curl -fsSL -O https://github.com/Kernel-Nomad/vuzon/releases/latest/download/docker-compose.yml \
  -O https://github.com/Kernel-Nomad/vuzon/releases/latest/download/.env.example
cp .env.example .env
# Edit .env: CF_API_TOKEN, DOMAIN, AUTH_USER, AUTH_PASS (see Requirements). Recommended: SESSION_SECRET (e.g. openssl rand -hex 32).
docker compose pull && docker compose up -d
```

**Manual:** put [`docker-compose.yml`](docker-compose.yml) and [`.env.example`](.env.example) in the same directory (e.g. from a [release](https://github.com/Kernel-Nomad/vuzon/releases)), run **`cp .env.example .env`**, edit **`.env`**, then **`docker compose pull && docker compose up -d`**.

Open **http://localhost:8001** (or `http://<server-ip>:<port>` on your LAN). Another host port: **`VUZON_PORT`** in `.env`.

Problems: **`docker compose logs -f vuzon`**.

Login uses a signed **`vuzon_session`** cookie only (nothing on disk). For local image builds, pinning, and HTTP details, see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Requirements

- **Docker** and **Docker Compose** (**v2.24+** recommended for the bundled `docker-compose.yml` optional `env_file`).
- A **Cloudflare** zone (domain) with **Email Routing** enabled for that zone.
- A Cloudflare **API token** used by vuzon to call Email Routing. **Suggested scopes:** **Account → Email Routing Addresses: Read & Edit** and **Zone → Email Routing Rules: Read & Edit**. Create tokens in the [Cloudflare dashboard](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).

---

## Environment variables

If **`.env`** exists next to `docker-compose.yml`, Compose passes it into the container (`env_file` with `required: false` on Compose **v2.24+**). Without a populated `.env`, the container may start but the process exits until **`CF_API_TOKEN`**, **`DOMAIN`**, **`AUTH_USER`**, and **`AUTH_PASS`** are set.

### Quick reference

Minimum: **`CF_API_TOKEN`**, **`DOMAIN`**, **`AUTH_USER`**, **`AUTH_PASS`**. **`VUZON_PORT`** changes the **host** port (default **8001**); inside the container Compose sets **`PORT=8001`** — you usually omit **`PORT`** in `.env` for Docker.

| Variable | Purpose |
|----------|---------|
| **`CF_API_TOKEN`** | Cloudflare API token (Email Routing; see **Requirements**). |
| **`DOMAIN`** | Zone apex in Cloudflare; used to resolve zone/account if IDs are not set. |
| **`AUTH_USER`** / **`AUTH_PASS`** | Panel login (password must be non-empty). |
| **`VUZON_PORT`** | Host TCP port mapped to the app (default **8001**). |
| **`SESSION_SECRET`** | Signs **`vuzon_session`**. **Recommended:** stable random value; if missing, a new secret is generated on each start and **sessions reset on restart**. |

**If autodetection from `DOMAIN` fails:** set both **`CF_ZONE_ID`** and **`CF_ACCOUNT_ID`** in `.env`.

**Behind a reverse proxy (nginx, Traefik, etc.):** set **`TRUST_PROXY=1`** (or `2`, …) so Express trusts `X-Forwarded-*` and sees the real client IP. **Off by default.**

**Local `npm start`:** **`PORT`** overrides **`VUZON_PORT`** for the listen port. **`NODE_ENV=production`** enables **`secure`** session cookies (use with HTTPS).

Other developer-oriented variables (`VUZON_PUBLIC_DIR`, **`BASE_URL`** as documentation only): **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Basic usage

1. **Enable Email Routing** on the zone (Cloudflare dashboard).
2. Add a **destination address** (a verification email is sent).
3. Sign in to vuzon and create an **alias (rule)** with a lowercase local part and a **verified** destination.

---

## Security

- Prefer **API tokens** with **least privilege**, not the Global API Key.
- Use a strong **`AUTH_PASS`**.
- If the panel is reachable from the internet, use **TLS** (reverse proxy) and sound network hygiene.

---

## Development

Clone the repo, run tests, and build without Docker: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

<a id="spanish"></a>

# vuzon

**vuzon** es un panel web ligero para gestionar **alias y reglas** de [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) y las **direcciones de destino** asociadas. Está pensado para **uso personal** con tu cuenta de Cloudflare, en **homelab o red privada**; no está orientado a despliegues públicos tipo SaaS.

---

## Instalación

### Homelab (Docker Compose)

Usa **Docker Compose v2.24+** para que `.env` sea opcional al parsear Compose; la app sigue necesitando variables configuradas para quedarse en marcha.

**Instalación rápida** (assets de la [última release](https://github.com/Kernel-Nomad/vuzon/releases/latest), sin clonar):

```bash
mkdir vuzon && cd vuzon
curl -fsSL -O https://github.com/Kernel-Nomad/vuzon/releases/latest/download/docker-compose.yml \
  -O https://github.com/Kernel-Nomad/vuzon/releases/latest/download/.env.example
cp .env.example .env
# Edita .env: CF_API_TOKEN, DOMAIN, AUTH_USER, AUTH_PASS (ver Requisitos). Recomendado: SESSION_SECRET (p. ej. openssl rand -hex 32).
docker compose pull && docker compose up -d
```

**Manual:** coloca [`docker-compose.yml`](docker-compose.yml) y [`.env.example`](.env.example) en el mismo directorio, **`cp .env.example .env`**, edita **`.env`** y **`docker compose pull && docker compose up -d`**.

Abre **http://localhost:8001** (o `http://<IP>:<puerto>` en tu LAN). Otro puerto en el anfitrión: **`VUZON_PORT`** en `.env`.

Si falla: **`docker compose logs -f vuzon`**.

El login usa solo la cookie firmada **`vuzon_session`**. Build local de imagen, pinning y rutas HTTP: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Requisitos

- **Docker** y **Docker Compose** (**v2.24+** recomendado para el `docker-compose.yml` incluido y `env_file` opcional).
- Una zona (dominio) en **Cloudflare** con **Email Routing** activado para esa zona.
- Un **token de API** de Cloudflare con permisos mínimos para Email Routing. **Scopes recomendados:** **Account → Email Routing Addresses: Read & Edit** y **Zone → Email Routing Rules: Read & Edit**. Creación de tokens: [documentación de Cloudflare](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).

---

## Variables de entorno

Si existe **`.env`** junto a `docker-compose.yml`, Compose lo inyecta en el contenedor (`env_file` con `required: false` en Compose **v2.24+**). Sin un **`.env`** rellenado, el contenedor puede arrancar pero el proceso sale hasta que estén **`CF_API_TOKEN`**, **`DOMAIN`**, **`AUTH_USER`** y **`AUTH_PASS`**.

### Referencia rápida

Mínimo: **`CF_API_TOKEN`**, **`DOMAIN`**, **`AUTH_USER`**, **`AUTH_PASS`**. **`VUZON_PORT`** cambia el puerto del **anfitrión** (por defecto **8001**); dentro del contenedor Compose fija **`PORT=8001`** — con Docker normalmente no pongas **`PORT`** en `.env`.

| Variable | Para qué sirve |
|----------|----------------|
| **`CF_API_TOKEN`** | Token de Cloudflare (Email Routing; ver **Requisitos**). |
| **`DOMAIN`** | Apex de la zona en Cloudflare; resuelve zona/cuenta si no hay IDs. |
| **`AUTH_USER`** / **`AUTH_PASS`** | Login del panel (la contraseña no puede estar vacía). |
| **`VUZON_PORT`** | Puerto TCP del anfitrión (por defecto **8001**). |
| **`SESSION_SECRET`** | Firma **`vuzon_session`**. **Recomendado:** valor aleatorio estable; si falta, un secreto nuevo en cada arranque y **las sesiones se invalidan al reiniciar**. |

**Si falla la autodetección desde `DOMAIN`:** define **`CF_ZONE_ID`** y **`CF_ACCOUNT_ID`** en `.env`.

**Detrás de un proxy inverso (nginx, Traefik, …):** **`TRUST_PROXY=1`** (o `2`, …). **Por defecto desactivado.**

**`npm start` en local:** **`PORT`** tiene prioridad sobre **`VUZON_PORT`**. **`NODE_ENV=production`** activa cookies de sesión **`secure`** (úsalas con HTTPS).

Más variables orientadas a desarrollo (`VUZON_PUBLIC_DIR`, **`BASE_URL`** solo documentación): **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Uso básico

1. Activa **Email Routing** en la zona (panel de Cloudflare).
2. Añade una **dirección de destino** (llegará un correo de verificación).
3. Entra en vuzon, inicia sesión y crea un **alias (regla)** con una parte local en minúsculas y un destino **ya verificado**.

---

## Seguridad

- Usa **tokens de API** con **privilegios mínimos**, no la Global API Key.
- **`AUTH_PASS`** fuerte.
- Si el panel es accesible desde Internet, **TLS** detrás de un proxy inverso y buenas prácticas de red.

---

## Desarrollo

Clonar el repositorio, tests y ejecución sin Docker: **[CONTRIBUTING.md](CONTRIBUTING.md)**.
