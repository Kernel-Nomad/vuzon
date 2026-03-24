import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getListenPort, getServerRuntime, parseTrustProxy } from '../../src/server/config/runtime.js';

test('parseTrustProxy: por defecto producción 1, desarrollo false', () => {
  assert.equal(parseTrustProxy(undefined, { isProduction: true }), 1);
  assert.equal(parseTrustProxy('', { isProduction: true }), 1);
  assert.equal(parseTrustProxy(undefined, { isProduction: false }), false);
});

test('parseTrustProxy: false explícito', () => {
  assert.equal(parseTrustProxy('false', { isProduction: true }), false);
  assert.equal(parseTrustProxy('0', { isProduction: true }), false);
});

test('parseTrustProxy: número de saltos', () => {
  assert.equal(parseTrustProxy('2', { isProduction: false }), 2);
});

test('getServerRuntime incluye trustProxy', () => {
  const r = getServerRuntime({ NODE_ENV: 'production', PORT: '3000' });
  assert.equal(r.trustProxy, 1);
  const r2 = getServerRuntime({ NODE_ENV: 'development', TRUST_PROXY: '1' });
  assert.equal(r2.trustProxy, 1);
});

test('getListenPort: PORT=0 es válido (efímero)', () => {
  assert.equal(getListenPort({ PORT: '0' }), 0);
  assert.equal(getListenPort({ PORT: 0 }), 0);
});

test('getListenPort: PORT tiene prioridad sobre VUZON_PORT', () => {
  assert.equal(getListenPort({ PORT: '3000', VUZON_PORT: '4000' }), 3000);
});

test('getListenPort: sin PORT usa VUZON_PORT', () => {
  assert.equal(getListenPort({ VUZON_PORT: '9000' }), 9000);
});

test('getListenPort: valor inválido o negativo cae al default', () => {
  assert.equal(getListenPort({ PORT: 'not-a-number' }), 8001);
  assert.equal(getListenPort({ PORT: '-1' }), 8001);
});
