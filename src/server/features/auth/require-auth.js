export function createRequireAuth({ env = process.env } = {}) {
  return function requireAuth(req, res, next) {
    const isApiRequest = req.path === '/api' || req.path.startsWith('/api/');

    if (!env.AUTH_USER || !env.AUTH_PASS) {
      return res.status(500).json({ error: 'Credenciales de servidor no configuradas (AUTH_USER/AUTH_PASS)' });
    }

    if (req.session && req.session.authenticated) {
      return next();
    }

    if (isApiRequest) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (req.accepts('html')) {
      return res.redirect('/login.html');
    }

    return res.status(401).json({ error: 'No autorizado' });
  };
}
