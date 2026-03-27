/**
 * @param {string | undefined} raw
 * @returns {boolean | number}
 */
export function parseTrustProxy(raw) {
  if (raw === undefined || raw === '') {
    return false;
  }

  const s = String(raw).trim().toLowerCase();
  if (s === 'false' || s === '0' || s === 'no') {
    return false;
  }
  if (s === 'true' || s === 'yes' || s === '1') {
    return 1;
  }

  const n = Number.parseInt(s, 10);
  if (Number.isFinite(n) && n >= 0) {
    return n === 0 ? false : n;
  }

  return false;
}

/**
 * Puerto de escucha: `PORT` tiene prioridad sobre `VUZON_PORT`.
 * En Docker Compose el servicio suele fijar `PORT` dentro del contenedor; `VUZON_PORT` en `.env`
 * a menudo solo alimenta el mapeo `ports` del host (ver docker-compose.yml).
 * Valores vacíos (solo espacios) se ignoran. `0` es válido (puerto efímero en Node).
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number}
 */
export function getListenPort(env = process.env) {
  let raw;
  if (env.PORT !== undefined && String(env.PORT).trim() !== '') {
    raw = env.PORT;
  } else if (env.VUZON_PORT !== undefined && String(env.VUZON_PORT).trim() !== '') {
    raw = env.VUZON_PORT;
  }
  if (raw === undefined) {
    return 8001;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return 8001;
  }
  return n;
}

export function getServerRuntime(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';

  return {
    port: getListenPort(env),
    isProduction,
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
  };
}
