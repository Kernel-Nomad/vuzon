/**
 * Dominio del panel (trim). Usado en reglas de correo y /api/me.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function getPanelDomain(env = process.env) {
  return typeof env.DOMAIN === 'string' ? env.DOMAIN.trim() : '';
}

/**
 * DOMAIN obligatorio para construir alias y exponer el dominio raíz en la API.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function assertDomainConfigured(env = process.env) {
  if (!getPanelDomain(env)) {
    throw new Error(
      'DOMAIN es obligatorio y no puede estar vacío (ni solo espacios).',
    );
  }
}
