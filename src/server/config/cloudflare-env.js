import { cloudflareResourceIdSchema } from '../../shared/cloudflare-schemas.js';

const ID_ENV_KEYS = ['CF_ZONE_ID', 'CF_ACCOUNT_ID'];

/**
 * Token de API (trim). Misma fuente que assertCfApiTokenConfigured.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function getCfApiToken(env = process.env) {
  return typeof env.CF_API_TOKEN === 'string' ? env.CF_API_TOKEN.trim() : '';
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string | null} Mensaje de error o null si el token está presente (puede incluir solo espacios antes de normalizar).
 */
export function getCfApiTokenConfigurationIssue(env = process.env) {
  const token = getCfApiToken(env);
  if (!token) {
    return 'CF_API_TOKEN es obligatorio en .env y no puede estar vacío (ni solo espacios). Revisa la plantilla .env.example.';
  }
  return null;
}

/**
 * CF_API_TOKEN obligatorio; normaliza env asignando el valor sin espacios laterales.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function assertCfApiTokenConfigured(env = process.env) {
  const issue = getCfApiTokenConfigurationIssue(env);
  if (issue) {
    throw new Error(issue);
  }
  env.CF_API_TOKEN = getCfApiToken(env);
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string | null}
 */
function cloudflareIdsValidationIssue(env) {
  for (const envKey of ID_ENV_KEYS) {
    const raw = typeof env[envKey] === 'string' ? env[envKey].trim() : '';
    const parsed = cloudflareResourceIdSchema.safeParse(raw);
    if (!parsed.success) {
      return `${envKey} no válido o vacío. Debe ser un identificador Cloudflare (letras, números, guiones y guión bajo, 1-64 caracteres). Si acabas de autodetectar y falla, revisa DOMAIN y el token, o define ambos IDs a mano en .env.`;
    }
  }
  return null;
}

/**
 * Si ambos IDs están definidos en .env, valida formato antes de la autoconfiguración.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string | null}
 */
export function getCloudflareIdsConfigurationIssueIfFullySpecified(env = process.env) {
  const zoneRaw = typeof env.CF_ZONE_ID === 'string' ? env.CF_ZONE_ID.trim() : '';
  const accountRaw = typeof env.CF_ACCOUNT_ID === 'string' ? env.CF_ACCOUNT_ID.trim() : '';
  if (!zoneRaw || !accountRaw) {
    return null;
  }
  return cloudflareIdsValidationIssue(env);
}

/**
 * Comprueba que CF_ZONE_ID y CF_ACCOUNT_ID existan y tengan formato válido tras autoconfiguración.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function assertCloudflareEnvConfigured(env = process.env) {
  const issue = cloudflareIdsValidationIssue(env);
  if (issue) {
    throw new Error(issue);
  }
}
