import fs from 'node:fs';
import { assertCloudflareEnvConfigured } from '../config/cloudflare-env.js';
import { assertDomainConfigured } from '../config/domain-env.js';
import { assertPanelAuthConfigured, getPanelAuthCredentials } from '../config/panel-auth-env.js';
import { createApp } from './create-app.js';
import { ensureCloudflareIdentifiers } from '../platform/cloudflare/auto-configure.js';
import { createCloudflareClient } from '../platform/cloudflare/client.js';

function listenWhenReady(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    const onError = (err) => {
      server.removeListener('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve(server);
    };
    server.once('error', onError);
    server.once('listening', onListening);
  });
}

export async function startServer({
  env = process.env,
  exitProcess = (code) => process.exit(code),
} = {}) {
  const cloudflareClient = createCloudflareClient({ env });
  const { app, runtime } = createApp({ env, cloudflareClient });

  try {
    await ensureCloudflareIdentifiers({ env, cloudflareClient });
    assertCloudflareEnvConfigured(env);
    assertPanelAuthConfigured(env);
    assertDomainConfigured(env);

    const server = await listenWhenReady(app, runtime.port);
    const addr = server.address();
    const boundPort =
      typeof addr === 'object' && addr !== null && typeof addr.port === 'number'
        ? addr.port
        : runtime.port;

    server.on('error', (err) => {
      console.error(`❌ Error en el servidor HTTP (puerto ${boundPort}):`, err.message);
      exitProcess(1);
    });

    const { authUser } = getPanelAuthCredentials(env);
    const panelUserLine = authUser
      ? runtime.isProduction
        ? 'Usuario del panel: configurado'
        : `Usuario del panel: ${authUser}`
      : 'Usuario del panel: no configurado';
    console.log(
      `🚀 Servidor en puerto ${boundPort} · producción: ${runtime.isProduction ? 'sí' : 'no'} · ${panelUserLine}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const inDocker = fs.existsSync('/.dockerenv');
    const logHint = inDocker
      ? ' Logs: docker compose logs -f vuzon (o docker logs -f vuzon).'
      : '';
    console.error(`❌ Error fatal en arranque: ${message}`);
    console.error(
      `   Revisa .env: CF_API_TOKEN, DOMAIN, AUTH_USER, AUTH_PASS; y CF_ZONE_ID/CF_ACCOUNT_ID tras la autodeteción.${logHint}`,
    );
    exitProcess(1);
  }
}
