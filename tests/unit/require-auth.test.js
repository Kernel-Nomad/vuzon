import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequireAuth } from '../../src/server/features/auth/require-auth.js';

test('requireAuth: API sin sesión responde 401 JSON', () => {
  const requireAuth = createRequireAuth({
    env: { AUTH_USER: 'u', AUTH_PASS: 'p' },
  });
  const req = {
    path: '/api/me',
    session: {},
    accepts: () => false,
  };
  const res = {
    statusCode: 0,
    status(c) {
      this.statusCode = c;
      return this;
    },
    json() {},
  };
  requireAuth(req, res, () => {
    assert.fail('no debía llamar next');
  });
  assert.equal(res.statusCode, 401);
});

test('requireAuth: ruta HTML sin sesión redirige a login', () => {
  const requireAuth = createRequireAuth({
    env: { AUTH_USER: 'u', AUTH_PASS: 'p' },
  });
  const req = {
    path: '/',
    session: {},
    accepts: (type) => type === 'html',
  };
  const res = {
    redirect(url) {
      this.redirectUrl = url;
    },
  };
  requireAuth(req, res, () => {
    assert.fail('no debía llamar next');
  });
  assert.equal(res.redirectUrl, '/login.html');
});

test('requireAuth: sesión autenticada llama next', () => {
  let called = false;
  const requireAuth = createRequireAuth({
    env: { AUTH_USER: 'u', AUTH_PASS: 'p' },
  });
  const req = {
    path: '/api/me',
    session: { authenticated: true },
    accepts: () => false,
  };
  requireAuth(req, {}, () => {
    called = true;
  });
  assert.equal(called, true);
});

test('requireAuth: sin AUTH_USER/AUTH_PASS en servidor responde 500', () => {
  const requireAuth = createRequireAuth({ env: {} });
  const req = {
    path: '/api/rules',
    session: {},
  };
  const res = {
    statusCode: 0,
    status(c) {
      this.statusCode = c;
      return this;
    },
    json() {},
  };
  requireAuth(req, res, () => {
    assert.fail('no debía llamar next');
  });
  assert.equal(res.statusCode, 500);
});
