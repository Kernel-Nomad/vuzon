import express from 'express';
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
import { createApiErrorHandler } from '../platform/http/api-route-error.js';
import { resolvePublicDir } from './resolve-public-dir.js';

const JSON_BODY_LIMIT = '256kb';

function securityHeadersMiddleware(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

export function createApp({
  env = process.env,
  cloudflareClient = createCloudflareClient({ env }),
  sessionSecret = resolveSessionSecret({ env }),
  publicDir = resolvePublicDir(env),
} = {}) {
  const runtime = getServerRuntime(env);
  const app = express();

  app.set('trust proxy', runtime.trustProxy);

  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));
  app.use(createSessionMiddleware({
    sessionSecret,
    isProduction: runtime.isProduction,
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
  app.use(createApiErrorHandler());

  return {
    app,
    runtime,
  };
}
