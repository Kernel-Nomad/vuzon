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

export function createApp({
  env = process.env,
  cloudflareClient = createCloudflareClient({ env }),
  sessionSecret = resolveSessionSecret({ env }),
  sessionStorePath = './sessions',
  publicDir = path.resolve('dist/public'),
} = {}) {
  const runtime = getServerRuntime(env);
  const app = express();

  if (runtime.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
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
