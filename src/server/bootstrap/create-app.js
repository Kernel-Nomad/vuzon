import express from 'express';
import path from 'node:path';
import { getServerRuntime } from '../config/runtime.js';
import { resolveSessionSecret } from '../config/session-secret.js';
import { createRequireAuth } from '../features/auth/require-auth.js';
import {
  createSessionMiddleware,
  getSessionCookieClearOptions,
  SESSION_COOKIE_NAME,
} from '../platform/session/middleware.js';
import { registerAuthRoutes } from '../features/auth/routes.js';
import { registerApiRoutes } from '../features/email-routing/routes.js';
import { registerPageRoutes } from '../features/pages/routes.js';
import { createCloudflareClient } from '../platform/cloudflare/client.js';

const JSON_BODY_LIMIT = '256kb';

export function createApp({
  env = process.env,
  cloudflareClient = createCloudflareClient({ env }),
  sessionStorePath = './sessions',
  sessionSecret = resolveSessionSecret({ env, sessionStorePath }),
  publicDir = path.resolve('dist/public'),
} = {}) {
  const runtime = getServerRuntime(env);
  const app = express();

  app.set('trust proxy', runtime.trustProxy);

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
  app.use(createSessionMiddleware({
    sessionSecret,
    isProduction: runtime.isProduction,
    storePath: sessionStorePath,
  }));

  const requireAuth = createRequireAuth({ env });

  registerAuthRoutes(app, {
    env,
    sessionCookieName: SESSION_COOKIE_NAME,
    sessionCookieClearOptions: getSessionCookieClearOptions({ isProduction: runtime.isProduction }),
  });
  registerApiRoutes(app, { env, requireAuth, cloudflareClient });
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'No encontrado' });
  });
  registerPageRoutes(app, { publicDir, requireAuth });
  app.use(express.static(publicDir, { index: false }));

  return {
    app,
    runtime,
  };
}
