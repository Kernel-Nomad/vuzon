/**
 * Credenciales del panel normalizadas (trim). Misma fuente que assertPanelAuthConfigured.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ authUser: string, authPass: string }}
 */
export function getPanelAuthCredentials(env = process.env) {
  const authUser = typeof env.AUTH_USER === 'string' ? env.AUTH_USER.trim() : '';
  const authPass = typeof env.AUTH_PASS === 'string' ? env.AUTH_PASS.trim() : '';
  return { authUser, authPass };
}

/**
 * Credenciales del panel: obligatorias y no triviales (sin cadena vacía ni solo espacios).
 * @param {NodeJS.ProcessEnv} [env]
 */
export function assertPanelAuthConfigured(env = process.env) {
  const { authUser, authPass } = getPanelAuthCredentials(env);

  if (!authUser || !authPass) {
    throw new Error(
      'AUTH_USER y AUTH_PASS son obligatorias y no pueden estar vacías (ni solo espacios).',
    );
  }
}
