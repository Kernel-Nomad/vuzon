import { getPanelAuthCredentials } from '../../config/panel-auth-env.js';
import { SESSION_COOKIE_NAME } from '../../platform/session/middleware.js';
import { timingSafeStringEqual } from './safe-string-equal.js';

export function registerAuthRoutes(app, {
  env = process.env,
  sessionCookieName = SESSION_COOKIE_NAME,
  sessionCookieClearOptions = {},
} = {}) {
  app.post('/api/login', (req, res) => {
    const { authUser, authPass } = getPanelAuthCredentials(env);
    if (!authUser || !authPass) {
      return res.status(500).json({ error: 'Credenciales de servidor no configuradas (AUTH_USER/AUTH_PASS)' });
    }

    const { username, password } = req.body;

    const userOk = timingSafeStringEqual(username, authUser);
    const passOk = timingSafeStringEqual(password, authPass);

    if (!userOk || !passOk) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    req.session = {
      authenticated: true,
      username: authUser,
    };

    return res.json({ success: true });
  });

  app.post('/api/logout', (req, res) => {
    req.session = null;
    res.clearCookie(sessionCookieName, sessionCookieClearOptions);
    return res.json({ success: true });
  });
}
