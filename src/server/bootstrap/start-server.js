import fs from 'node:fs';
import {
  assertCloudflareEnvConfigured,
  getCfApiToken,
  getCfApiTokenConfigurationIssue,
  getCloudflareIdsConfigurationIssueIfFullySpecified,
} from '../config/cloudflare-env.js';
import { getDomainConfigurationIssue } from '../config/domain-env.js';
import { getPanelAuthConfigurationIssue, getPanelAuthCredentials } from '../config/panel-auth-env.js';
import { createApp } from './create-app.js';
import { ensureCloudflareIdentifiers } from '../platform/cloudflare/auto-configure.js';
import { createCloudflareClient } from '../platform/cloudflare/client.js';

const RUNNING_IN_DOCKER = fs.existsSync('/.dockerenv');
const REQUIRED_ENV_HELP =
  '   Obligatorio en .env (plantilla .env.example): CF_API_TOKEN, DOMAIN, AUTH_USER, AUTH_PASS.';

function logDockerComposeHint() {
  if (RUNNING_IN_DOCKER) {
    console.error('   En Docker: docker compose logs -f vuzon');
  }
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {string[]}
 */
function collectSynchronousStartupConfigurationIssues(env) {
  return [
    getPanelAuthConfigurationIssue(env),
    getDomainConfigurationIssue(env),
    getCfApiTokenConfigurationIssue(env),
    getCloudflareIdsConfigurationIssueIfFullySpecified(env),
  ].filter((msg) => typeof msg === 'string' && msg.length > 0);
}

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
    const syncIssues = collectSynchronousStartupConfigurationIssues(env);
    if (syncIssues.length > 0) {
      console.error('Error fatal en arranque: revisa .env');
      for (const issue of syncIssues) {
        console.error(`   - ${issue}`);
      }
      console.error(REQUIRED_ENV_HELP);
      logDockerComposeHint();
      exitProcess(1);
      return;
    }

    env.CF_API_TOKEN = getCfApiToken(env);

    await ensureCloudflareIdentifiers({ env, cloudflareClient });
    assertCloudflareEnvConfigured(env);

    const server = await listenWhenReady(app, runtime.port);
    const addr = server.address();
    const boundPort =
      typeof addr === 'object' && addr !== null && typeof addr.port === 'number'
        ? addr.port
        : runtime.port;

    server.on('error', (err) => {
      console.error(`Error en el servidor HTTP (puerto ${boundPort}):`, err.message);
      exitProcess(1);
    });

    const { authUser } = getPanelAuthCredentials(env);
    const panelUserLine = authUser
      ? runtime.isProduction
        ? 'Usuario del panel: configurado'
        : `Usuario del panel: ${authUser}`
      : 'Usuario del panel: no configurado';
    console.log(
      `Servidor en puerto ${boundPort} · producción: ${runtime.isProduction ? 'sí' : 'no'} · ${panelUserLine}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error fatal en arranque: ${message}`);
    console.error(REQUIRED_ENV_HELP);
    if (
      /CF_ZONE_ID|CF_ACCOUNT_ID|\bzonas?\b|autoconfigur/i.test(message)
    ) {
      console.error(
        '   Zona/cuenta: el token debe ser de la cuenta donde está DOMAIN; si hay varias zonas con el mismo nombre, define CF_ZONE_ID y CF_ACCOUNT_ID.',
      );
    }
    logDockerComposeHint();
    exitProcess(1);
  }
}
