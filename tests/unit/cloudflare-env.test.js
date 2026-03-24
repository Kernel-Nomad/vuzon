import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertCloudflareEnvConfigured } from '../../src/server/config/cloudflare-env.js';

test('assertCloudflareEnvConfigured: acepta IDs válidos', () => {
  assertCloudflareEnvConfigured({
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
  });
});

test('assertCloudflareEnvConfigured: rechaza zone vacío', () => {
  assert.throws(
    () => assertCloudflareEnvConfigured({
      CF_ZONE_ID: '',
      CF_ACCOUNT_ID: 'acct_test_1',
    }),
    /CF_ZONE_ID/,
  );
});

test('assertCloudflareEnvConfigured: rechaza account con caracteres inválidos', () => {
  assert.throws(
    () => assertCloudflareEnvConfigured({
      CF_ZONE_ID: 'valid_zone_id',
      CF_ACCOUNT_ID: 'bad id',
    }),
    /CF_ACCOUNT_ID/,
  );
});
