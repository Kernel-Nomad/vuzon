import path from 'node:path';

export function registerPageRoutes(app, { publicDir, requireAuth } = {}) {
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.get(['/', '/index.html'], requireAuth, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}
