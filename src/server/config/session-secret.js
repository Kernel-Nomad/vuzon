import crypto from 'crypto';
import fs from 'fs';

const DEFAULT_SECRET_FILE = '.session_secret';

export function resolveSessionSecret({
  env = process.env,
  secretFile = DEFAULT_SECRET_FILE,
} = {}) {
  let sessionSecret = env.SESSION_SECRET;

  if (sessionSecret) {
    return sessionSecret;
  }

  if (fs.existsSync(secretFile)) {
    const existingSecret = fs.readFileSync(secretFile, 'utf-8').trim();
    if (existingSecret) {
      return existingSecret;
    }
  }

  sessionSecret = crypto.randomBytes(32).toString('hex');

  try {
    fs.writeFileSync(secretFile, sessionSecret);
    console.log('Generado nuevo secreto de sesión en .session_secret');
  } catch (err) {
    console.warn('⚠️ No se pudo guardar .session_secret (revisa permisos), pero se usará en memoria.');
  }

  return sessionSecret;
}
