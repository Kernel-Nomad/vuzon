import path from 'node:path';

export function registerPageRoutes(app, { publicDir, requireAuth } = {}) {
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.get(['/', '/index.html'], requireAuth, (req, res, next) => {
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}
