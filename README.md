<p align="center">
  <img src="./public/assets/logo.png" alt="vuzon" width="200"/>
</p>

<div align="center">

<h3>
  <a href="#english">English</a> | <a href="#español">Español</a>
</h3>

</div>

<p align="center">
  <a href="https://github.com/KN990x/vuzon/stargazers">
    <img src="https://img.shields.io/github/stars/KN990x/vuzon?style=social" alt="GitHub stars"/>
  </a>
  &nbsp;
  <a href="https://github.com/KN990x/vuzon/issues">
    <img src="https://img.shields.io/github/issues/KN990x/vuzon" alt="GitHub issues"/>
  </a>
  &nbsp;
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/KN990x/vuzon" alt="License"/>
  </a>
  &nbsp;
  <img src="https://img.shields.io/github/last-commit/KN990x/vuzon" alt="Last commit"/>
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

### Docker Compose

**Quick install** (files from the [`main`](https://github.com/KN990x/vuzon/tree/main) branch):

```bash
mkdir vuzon && cd vuzon
curl -fsSL -O https://raw.githubusercontent.com/KN990x/vuzon/main/docker-compose.yml \
  -O https://raw.githubusercontent.com/KN990x/vuzon/main/.env.example
cp .env.example .env
docker compose pull && docker compose up -d
```

**Manual:** put [`docker-compose.yml`](docker-compose.yml) and [`.env.example`](.env.example) in the same directory (from the repo, e.g. [raw `docker-compose.yml`](https://raw.githubusercontent.com/KN990x/vuzon/main/docker-compose.yml) and [raw `.env.example`](https://raw.githubusercontent.com/KN990x/vuzon/main/.env.example)), run **`cp .env.example .env`**, edit **`.env`**, then **`docker compose pull && docker compose up -d`**.

Open **http://localhost:8001** (or `http://<server-ip>:<port>` on your LAN). Another host port: **`VUZON_PORT`** in `.env`.

Problems: **`docker compose logs -f vuzon`**.

Login uses a signed **`vuzon_session`** cookie only (nothing on disk). For local image builds, pinning, and HTTP details, see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Requirements

- **Docker** and **Docker Compose**
- A **Cloudflare** zone (domain) with **Email Routing** enabled for that zone.
- A Cloudflare **API token** with the permissions below (see **[Cloudflare API token](#cloudflare-api-token)**). Official guide: [Create API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).

### Cloudflare API token

1. Open the Cloudflare dashboard → **My Profile** (avatar, top right) → **[API Tokens](https://dash.cloudflare.com/profile/api-tokens)**.
2. Click **Create Token** → **Create Custom Token**.
3. Under **Permissions**, add these rows (names match the English Cloudflare UI):

   | Scope | Permission | Why vuzon needs it |
   |-------|------------|-------------------|
   | **Account** → **Email Routing Addresses** | **Edit** | List, add, and remove destination addresses (`/accounts/.../email/routing/addresses`). |
   | **Zone** → **Email Routing Rules** | **Edit** | List, create, update, enable/disable, and delete routing rules (`/zones/.../email/routing/rules`). |
   | **Zone** → **Zone** | **Read** | On startup, resolve **`CF_ZONE_ID`** and **`CF_ACCOUNT_ID`** from **`DOMAIN`** via `GET /zones?name=...`. Skip this row only if you set both IDs manually in `.env`. |

4. Under **Account Resources**, choose the account that owns the zone (or **All accounts** if you accept broader access).
5. Under **Zone Resources**, restrict to **Specific zone** → your domain (recommended), or **All zones** for that account.
6. Create the token and copy the value into **`CF_API_TOKEN`** in `.env` (Cloudflare shows it **once**).

Use an **API token**, not the **Global API Key**. Prefer **least privilege** (one zone, one account) over “all zones” when possible.

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

**vuzon** es un panel web ligero para gestionar **alias y reglas** de [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/) y **direcciones de destino**. Está pensado para **uso personal** con tu cuenta de Cloudflare en **homelab o red privada**, no como despliegue público multiinquilino ni como despliegue SaaS de "producción".

---

## Instalación

### Docker Compose

**Instalación rápida** (archivos desde la rama [`main`](https://github.com/KN990x/vuzon/tree/main)):

```bash
mkdir vuzon && cd vuzon
curl -fsSL -O https://raw.githubusercontent.com/KN990x/vuzon/main/docker-compose.yml \
  -O https://raw.githubusercontent.com/KN990x/vuzon/main/.env.example
cp .env.example .env
docker compose pull && docker compose up -d
```

**Manual:** coloca [`docker-compose.yml`](docker-compose.yml) y [`.env.example`](.env.example) en el mismo directorio (desde el repo, p. ej. [`docker-compose.yml` en raw](https://raw.githubusercontent.com/KN990x/vuzon/main/docker-compose.yml) y [`.env.example` en raw](https://raw.githubusercontent.com/KN990x/vuzon/main/.env.example)), ejecuta **`cp .env.example .env`**, edita **`.env`**, y luego **`docker compose pull && docker compose up -d`**.

Abre **http://localhost:8001** (o `http://<server-ip>:<port>` en tu LAN). Otro puerto del anfitrión: **`VUZON_PORT`** en `.env`.

Problemas: **`docker compose logs -f vuzon`**.

El inicio de sesión usa solo una cookie firmada **`vuzon_session`** (nada en disco). Para build local de imagen, pinning y detalles HTTP, ver **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Requisitos

- **Docker** y **Docker Compose**
- Una **zona** (dominio) en **Cloudflare** con **Email Routing** habilitado para esa zona.
- Un **token de API** de Cloudflare con los permisos siguientes (ver **[Token de API de Cloudflare](#token-de-api-de-cloudflare)**). Guía oficial: [Crear tokens de API](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).

### Token de API de Cloudflare

1. Abre el panel de Cloudflare → **My Profile** (avatar, arriba a la derecha) → **[API Tokens](https://dash.cloudflare.com/profile/api-tokens)**.
2. Pulsa **Create Token** → **Create Custom Token**.
3. En **Permissions**, añade estas filas (los nombres coinciden con la interfaz en inglés de Cloudflare):

   | Ámbito | Permiso | Para qué lo necesita vuzon |
   |--------|---------|----------------------------|
   | **Account** → **Email Routing Addresses** | **Edit** | Listar, añadir y quitar direcciones de destino (`/accounts/.../email/routing/addresses`). |
   | **Zone** → **Email Routing Rules** | **Edit** | Listar, crear, actualizar, habilitar/deshabilitar y borrar reglas de enrutamiento (`/zones/.../email/routing/rules`). |
   | **Zone** → **Zone** | **Read** | Al arrancar, resolver **`CF_ZONE_ID`** y **`CF_ACCOUNT_ID`** a partir de **`DOMAIN`** mediante `GET /zones?name=...`. Omite esta fila solo si defines ambos IDs manualmente en `.env`. |

4. En **Account Resources**, elige la cuenta propietaria de la zona (o **All accounts** si aceptas un acceso más amplio).
5. En **Zone Resources**, restringe a **Specific zone** → tu dominio (recomendado), o **All zones** de esa cuenta.
6. Crea el token y copia el valor en **`CF_API_TOKEN`** de `.env` (Cloudflare lo muestra **una sola vez**).

Usa un **token de API**, no la **Global API Key**. Prioriza **el menor privilegio posible** (una zona, una cuenta) frente a «todas las zonas» cuando puedas.

---

## Variables de entorno

Si existe **`.env`** junto a `docker-compose.yml`, Compose lo pasa al contenedor (`env_file` con `required: false` en Compose **v2.24+**). Sin un **`.env`** rellenado, el contenedor puede arrancar pero el proceso termina hasta que estén definidos **`CF_API_TOKEN`**, **`DOMAIN`**, **`AUTH_USER`** y **`AUTH_PASS`**.

### Referencia rápida

Mínimo: **`CF_API_TOKEN`**, **`DOMAIN`**, **`AUTH_USER`**, **`AUTH_PASS`**. **`VUZON_PORT`** cambia el puerto del **anfitrión** (por defecto **8001**); dentro del contenedor Compose define **`PORT=8001`** — en Docker sueles omitir **`PORT`** en `.env`.

| Variable | Propósito |
|----------|-----------|
| **`CF_API_TOKEN`** | Token de API de Cloudflare (Email Routing; ver **Requisitos**). |
| **`DOMAIN`** | Apex de la zona en Cloudflare; sirve para resolver zona/cuenta si no hay IDs. |
| **`AUTH_USER`** / **`AUTH_PASS`** | Inicio de sesión en el panel (la contraseña no puede estar vacía). |
| **`VUZON_PORT`** | Puerto TCP del anfitrión asignado a la app (por defecto **8001**). |
| **`SESSION_SECRET`** | Firma **`vuzon_session`**. **Recomendado:** un valor aleatorio estable; si falta, se genera un secreto nuevo en cada arranque y **las sesiones se reinician al reiniciar**. |

**Si la autodetección a partir de `DOMAIN` falla:** define **`CF_ZONE_ID`** y **`CF_ACCOUNT_ID`** en `.env`.

**Detrás de un proxy inverso (nginx, Traefik, etc.):** define **`TRUST_PROXY=1`** (o `2`, …) para que Express confíe en `X-Forwarded-*` y vea la IP real del cliente. **Desactivado por defecto.**

**`npm start` en local:** **`PORT`** tiene prioridad sobre **`VUZON_PORT`** para el puerto de escucha. **`NODE_ENV=production`** habilita cookies de sesión **`secure`** (úsalo con HTTPS).

Otras variables orientadas a desarrollo (`VUZON_PUBLIC_DIR`, **`BASE_URL`** solo a efectos de documentación): **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Uso básico

1. **Habilita Email Routing** en la zona (panel de Cloudflare).
2. Añade una **dirección de destino** (se envía un correo de verificación).
3. Inicia sesión en vuzon y crea un **alias (regla)** con una parte local en minúsculas y un destino **verificado**.

---

## Seguridad

- Prioriza **tokens de API** con **el menor privilegio posible**, no la Global API Key.
- Usa una **`AUTH_PASS`** fuerte.
- Si el panel es accesible desde internet, usa **TLS** (proxy inverso) y buenas prácticas de red.

---

## Desarrollo

Clona el repositorio, ejecuta tests y haz build sin Docker: **[CONTRIBUTING.md](CONTRIBUTING.md)**.
