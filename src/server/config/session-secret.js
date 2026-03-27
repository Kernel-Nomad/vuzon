import crypto from 'crypto';

/**
 * Secreto para firmar la cookie de sesión.
 * Origen: SESSION_SECRET en el entorno. Si falta, se genera uno efímero al arrancar
 * (las sesiones dejan de ser válidas al reiniciar el proceso).
 *
 * @param {{ env?: NodeJS.ProcessEnv }} [opts]
 */
export function resolveSessionSecret({ env = process.env } = {}) {
  const raw = env.SESSION_SECRET;
  const sessionSecret = typeof raw === 'string' ? raw.trim() : '';

  if (sessionSecret) {
    return sessionSecret;
  }

  console.warn(
    'SESSION_SECRET no está definido: se ha generado un secreto efímero. '
      + 'Las sesiones de login no sobreviven al reinicio. '
      + 'En despliegue define SESSION_SECRET (p. ej. openssl rand -hex 32 en .env).',
  );

  return crypto.randomBytes(32).toString('hex');
}
