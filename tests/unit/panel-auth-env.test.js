import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertPanelAuthConfigured,
  getPanelAuthCredentials,
} from '../../src/server/config/panel-auth-env.js';

test('assertPanelAuthConfigured: acepta usuario y contraseña', () => {
  assertPanelAuthConfigured({
    AUTH_USER: 'admin',
    AUTH_PASS: 'secret',
  });
});

test('assertPanelAuthConfigured: rechaza contraseña vacía', () => {
  assert.throws(
    () => assertPanelAuthConfigured({
      AUTH_USER: 'admin',
      AUTH_PASS: '',
    }),
    /AUTH_USER y AUTH_PASS/,
  );
});

test('assertPanelAuthConfigured: rechaza solo espacios', () => {
  assert.throws(
    () => assertPanelAuthConfigured({
      AUTH_USER: 'admin',
      AUTH_PASS: '   ',
    }),
    /AUTH_USER y AUTH_PASS/,
  );
});

test('getPanelAuthCredentials: recorta espacios', () => {
  const { authUser, authPass } = getPanelAuthCredentials({
    AUTH_USER: '  admin  ',
    AUTH_PASS: '  secret  ',
  });
  assert.equal(authUser, 'admin');
  assert.equal(authPass, 'secret');
});

test('getPanelAuthCredentials: valores no string son vacíos', () => {
  const { authUser, authPass } = getPanelAuthCredentials({});
  assert.equal(authUser, '');
  assert.equal(authPass, '');
});
