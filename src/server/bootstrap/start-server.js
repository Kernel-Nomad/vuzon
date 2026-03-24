import { createApp } from './create-app.js';
import { ensureCloudflareIdentifiers } from '../platform/cloudflare/auto-configure.js';
import { createCloudflareClient } from '../platform/cloudflare/client.js';

export async function startServer({ env = process.env } = {}) {
  const cloudflareClient = createCloudflareClient({ env });
  const { app, runtime } = createApp({ env, cloudflareClient });

  try {
    await ensureCloudflareIdentifiers({ env, cloudflareClient });

    const server = app.listen(runtime.port, () => {
      console.log(`🚀 Server running on port ${runtime.port}`);
      console.log(`🔒 Modo Producción: ${runtime.isProduction ? 'SI' : 'NO'}`);
      if (env.AUTH_USER) {
        console.log(`👤 Auth User: ${env.AUTH_USER}`);
      } else {
        console.log('👤 Auth User: no configurado');
      }
    });

    server.on('error', (err) => {
      console.error(`❌ Error al abrir puerto ${runtime.port}:`, err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Error fatal en arranque:', err.message);
    process.exit(1);
  }
}
