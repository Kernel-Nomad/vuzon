import crypto from 'crypto';
import fs from 'fs';
import path from 'node:path';

const LEGACY_SECRET_FILE = '.session_secret';

function secretFileInStore(sessionStorePath) {
  return path.join(sessionStorePath, '.session_secret');
}

/**
 * Resuelve el secreto de sesión: env, archivo junto al store, luego legado en cwd.
 * @param {{ env?: NodeJS.ProcessEnv, sessionStorePath?: string }} [opts]
 */
export function resolveSessionSecret({
  env = process.env,
  sessionStorePath = './sessions',
} = {}) {
  const sessionSecret = env.SESSION_SECRET;

  if (sessionSecret) {
    return sessionSecret;
  }

  const storeSecretPath = secretFileInStore(sessionStorePath);

  if (fs.existsSync(storeSecretPath)) {
    const existingSecret = fs.readFileSync(storeSecretPath, 'utf-8').trim();
    if (existingSecret) {
      return existingSecret;
    }
  }

  if (fs.existsSync(LEGACY_SECRET_FILE)) {
    const existingSecret = fs.readFileSync(LEGACY_SECRET_FILE, 'utf-8').trim();
    if (existingSecret) {
      return existingSecret;
    }
  }

  const newSecret = crypto.randomBytes(32).toString('hex');

  try {
    fs.mkdirSync(sessionStorePath, { recursive: true });
    fs.writeFileSync(storeSecretPath, newSecret);
    console.log(`Generado nuevo secreto de sesión en ${storeSecretPath}`);
  } catch (err) {
    console.warn(
      `⚠️ No se pudo guardar el secreto en ${storeSecretPath} (revisa permisos), pero se usará en memoria.`,
    );
  }

  return newSecret;
}
