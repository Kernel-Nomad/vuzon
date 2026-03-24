import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startServer } from '../../src/server/bootstrap/start-server.js';

test('startServer: sin credenciales del panel invoca exitProcess(1)', async () => {
  let exitCode = null;
  const exitProcess = (code) => {
    exitCode = code;
    throw new Error('TEST_EXIT');
  };
  const env = {
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
    SESSION_SECRET: 'test-session-secret-32chars!!',
  };

  await assert.rejects(
    () => startServer({ env, exitProcess }),
    /TEST_EXIT/,
  );
  assert.equal(exitCode, 1);
});
