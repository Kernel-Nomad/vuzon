import path from 'node:path';
import rateLimit from 'express-rate-limit';

const pagesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

export function registerPageRoutes(app, { publicDir, requireAuth } = {}) {
  app.get('/healthz', (_req, res) => {
    res.json({ ok: true });
  });

  app.get(['/', '/index.html'], requireAuth, pagesLimiter, (req, res, next) => {
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}
