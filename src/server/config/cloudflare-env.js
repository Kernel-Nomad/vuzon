import { cloudflareResourceIdSchema } from '../../shared/cloudflare-schemas.js';

const ID_ENV_KEYS = ['CF_ZONE_ID', 'CF_ACCOUNT_ID'];

/**
 * Comprueba que CF_ZONE_ID y CF_ACCOUNT_ID existan y tengan formato válido tras autoconfiguración.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function assertCloudflareEnvConfigured(env = process.env) {
  for (const envKey of ID_ENV_KEYS) {
    const raw = typeof env[envKey] === 'string' ? env[envKey].trim() : '';
    const parsed = cloudflareResourceIdSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `${envKey} no válido o vacío. Debe ser un identificador Cloudflare (letras, números, guiones y guión bajo, 1-64 caracteres).`,
      );
    }
  }
}
