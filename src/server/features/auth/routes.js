import { getPanelAuthCredentials } from '../../config/panel-auth-env.js';
import { SESSION_COOKIE_NAME } from '../../platform/session/middleware.js';
import { createLoginFailureRateLimiter } from './login-failure-rate-limit.js';
import { timingSafeStringEqual } from './safe-string-equal.js';

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function registerAuthRoutes(app, {
  env = process.env,
  sessionCookieName = SESSION_COOKIE_NAME,
  sessionCookieClearOptions = {},
  loginFailureRateLimiter = createLoginFailureRateLimiter({ env }),
} = {}) {
  app.post('/api/login', (req, res) => {
    const { authUser, authPass } = getPanelAuthCredentials(env);
    if (!authUser || !authPass) {
      return res.status(500).json({ error: 'Credenciales de servidor no configuradas (AUTH_USER/AUTH_PASS)' });
    }

    const ip = getClientIp(req);

    if (loginFailureRateLimiter.isBlocked(ip)) {
      const retryAfter = loginFailureRateLimiter.retryAfterSeconds(ip);
      if (retryAfter > 0) {
        res.setHeader('Retry-After', String(retryAfter));
      }
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera e inténtalo de nuevo.' });
    }

    const { username, password } = req.body;

    const userOk = timingSafeStringEqual(username, authUser);
    const passOk = timingSafeStringEqual(password, authPass);

    if (!userOk || !passOk) {
      loginFailureRateLimiter.recordFailure(ip);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!req.session) {
      return res.status(500).json({ error: 'Sesión no disponible' });
    }

    return req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'No se pudo iniciar sesión' });
      }

      req.session.authenticated = true;

      return req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ error: 'No se pudo iniciar sesión' });
        }

        loginFailureRateLimiter.clear(ip);
        return res.json({ success: true });
      });
    });
  });

  app.post('/api/logout', (req, res) => {
    if (!req.session) {
      res.clearCookie(sessionCookieName, sessionCookieClearOptions);
      return res.json({ success: true });
    }

    return req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al cerrar sesión' });
      }

      res.clearCookie(sessionCookieName, sessionCookieClearOptions);
      return res.json({ success: true });
    });
  });
}
