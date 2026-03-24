export function registerAuthRoutes(app, {
  env = process.env,
  sessionCookieName = 'connect.sid',
  sessionCookieClearOptions = {},
} = {}) {
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username !== env.AUTH_USER || password !== env.AUTH_PASS) {
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
