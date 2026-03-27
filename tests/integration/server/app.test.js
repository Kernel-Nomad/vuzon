import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import { createApp } from '../../../src/server/bootstrap/create-app.js';
import { CloudflareApiError } from '../../../src/server/platform/cloudflare/client.js';

function createMockCloudflareClient() {
  return {
    async fetchCloudflare(requestPath, method = 'GET', body = null) {
      if (requestPath.endsWith('/email/routing/rules/catch_all') && method === 'GET') {
        return {
          id: 'catch_all_rule',
          name: 'Catch-all',
          enabled: true,
          matchers: [{ type: 'all' }],
          actions: [{ type: 'forward', value: ['catchall@example.com'] }],
        };
      }

      const isRuleItem = /\/email\/routing\/rules\/[^/]+$/.test(requestPath)
        && !requestPath.endsWith('/email/routing/rules/catch_all');

      if (isRuleItem && method === 'GET') {
        return {
          id: 'rule1',
          name: 'alias@example.com',
          enabled: true,
          matchers: [{ type: 'literal', field: 'to', value: 'alias@example.com' }],
          actions: [{ type: 'forward', value: ['dest@example.com'] }],
        };
      }

      if (isRuleItem && method === 'PUT') {
        return { ...body, id: 'rule1' };
      }

      if (requestPath.includes('/email/routing/addresses') && method === 'DELETE') {
        return { id: 'deleted' };
      }

      if (requestPath.includes('/email/routing/rules') && method === 'DELETE') {
        return { id: 'deleted' };
      }

      if (requestPath.includes('/email/routing/rules') && method === 'POST') {
        return { id: 'new-rule', name: body?.name };
      }

      return {};
    },

    async fetchAllCloudflare(requestPath) {
      if (requestPath.includes('/email/routing/rules')) {
        return [{
          id: 'rule1',
          name: 'alias@example.com',
          enabled: true,
          matchers: [],
          actions: [],
        }];
      }
      if (requestPath.includes('/email/routing/addresses')) {
        return [{
          id: 'addr1',
          email: 'dest@example.com',
          verified: true,
        }];
      }
      return [];
    },
  };
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${addr.port}`,
      });
    });
    server.on('error', reject);
  });
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Cabeceras Set-Cookie firmadas (cookie + .sig); `get('set-cookie')` no es fiable con varias cookies. */
function sessionCookieHeaderFromResponse(res) {
  const list = res.headers.getSetCookie();
  assert.ok(list && list.length > 0, 'se esperaba al menos una Set-Cookie');
  return list.map((line) => line.split(';')[0].trim()).join('; ');
}

test('integración HTTP: healthz, auth, API con Cloudflare simulado', async () => {
  const env = {
    AUTH_USER: 'testuser',
    AUTH_PASS: 'test-secret-pass',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
  };

  const cloudflareClient = createMockCloudflareClient();
  const { app } = createApp({
    env,
    cloudflareClient,
    sessionSecret: 'test-session-secret-32chars!!',
  });

  const { server, baseUrl } = await listen(app);

  try {
    {
      const res = await fetch(`${baseUrl}/healthz`);
      assert.equal(res.status, 200);
      const data = await readJson(res);
      assert.deepEqual(data, { ok: true });
    }

    {
      const res = await fetch(`${baseUrl}/api/me`);
      assert.equal(res.status, 401);
    }

    {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'wrong' }),
      });
      assert.equal(res.status, 401);
    }

    let sessionCookie = '';
    {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'test-secret-pass' }),
      });
      assert.equal(res.status, 200);
      const data = await readJson(res);
      assert.deepEqual(data, { success: true });
      sessionCookie = sessionCookieHeaderFromResponse(res);
    }

    {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      const data = await readJson(res);
      assert.equal(data.email, 'testuser');
      assert.equal(data.rootDomain, 'example.com');
    }

    {
      const res = await fetch(`${baseUrl}/api/rules`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      const data = await readJson(res);
      assert.ok(Array.isArray(data.result));
      assert.equal(data.result[0].id, 'rule1');
    }

    {
      const res = await fetch(`${baseUrl}/api/rules/catch-all`, {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      const data = await readJson(res);
      assert.equal(data.result.id, 'catch_all_rule');
      assert.ok(Array.isArray(data.result.actions));
      assert.equal(data.result.actions[0].type, 'forward');
    }

    {
      const res = await fetch(`${baseUrl}/api/rules/not%20valid!/disable`, {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 400);
      const data = await readJson(res);
      assert.ok(data && typeof data.error === 'string');
    }

    {
      const res = await fetch(`${baseUrl}/api/rules/rule1/disable`, {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      const data = await readJson(res);
      assert.ok(data.result);
    }
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

test('integración HTTP: login con AUTH en env con espacios (trim)', async () => {
  const env = {
    AUTH_USER: '  trimuser  ',
    AUTH_PASS: '  trim-pass  ',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: '  example.com  ',
    NODE_ENV: 'development',
  };

  const { app } = createApp({
    env,
    cloudflareClient: createMockCloudflareClient(),
    sessionSecret: 'test-session-secret-32chars!!',
  });

  const { server, baseUrl } = await listen(app);

  try {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'trimuser', password: 'trim-pass' }),
    });
    assert.equal(res.status, 200);
    const data = await readJson(res);
    assert.deepEqual(data, { success: true });

    const sessionCookie = sessionCookieHeaderFromResponse(res);

    const me = await fetch(`${baseUrl}/api/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(me.status, 200);
    const meData = await readJson(me);
    assert.equal(meData.email, 'trimuser');
    assert.equal(meData.rootDomain, 'example.com');
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

test('integración HTTP: sin AUTH_USER/AUTH_PASS, POST /api/login responde 500', async () => {
  const env = {
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
  };

  const { app } = createApp({
    env,
    cloudflareClient: createMockCloudflareClient(),
    sessionSecret: 'test-session-secret-32chars!!',
  });

  const { server, baseUrl } = await listen(app);

  try {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cualquiera', password: 'cualquiera' }),
    });
    assert.equal(res.status, 500);
    const data = await readJson(res);
    assert.ok(data && typeof data.error === 'string');
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

test('integración HTTP: cabeceras de seguridad en /healthz', async () => {
  const env = {
    AUTH_USER: 'u',
    AUTH_PASS: 'p',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
  };

  const { app } = createApp({
    env,
    cloudflareClient: createMockCloudflareClient(),
    sessionSecret: 'test-session-secret-32chars!!',
  });

  const { server, baseUrl } = await listen(app);

  try {
    const res = await fetch(`${baseUrl}/healthz`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.ok((res.headers.get('referrer-policy') || '').length > 0);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

test('integración HTTP: rechazo async sin try/catch llega al manejador de errores API', async () => {
  const base = createMockCloudflareClient();
  const cloudflareClient = {
    ...base,
    async fetchAllCloudflare(requestPath) {
      if (requestPath.includes('/email/routing/rules')) {
        throw new Error('fallo simulado en listado');
      }
      return base.fetchAllCloudflare(requestPath);
    },
  };

  const env = {
    AUTH_USER: 'testuser',
    AUTH_PASS: 'test-secret-pass',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
  };

  const { app } = createApp({
    env,
    cloudflareClient,
    sessionSecret: 'test-session-secret-32chars!!',
  });

  const { server, baseUrl } = await listen(app);

  try {
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'test-secret-pass' }),
    });
    assert.equal(loginRes.status, 200);
    const sessionCookie = sessionCookieHeaderFromResponse(loginRes);

    const res = await fetch(`${baseUrl}/api/rules`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(res.status, 500);
    const data = await readJson(res);
    assert.equal(data.error, 'Error interno del servidor');
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

test('integración HTTP: CloudflareApiError 401 no se expone como 401 al cliente', async () => {
  const base = createMockCloudflareClient();
  const cloudflareClient = {
    ...base,
    async fetchAllCloudflare(requestPath) {
      if (requestPath.includes('/email/routing/addresses')) {
        throw new CloudflareApiError('mensaje_upstream_secreto', { status: 401, code: '9109' });
      }
      return base.fetchAllCloudflare(requestPath);
    },
  };

  const env = {
    AUTH_USER: 'testuser',
    AUTH_PASS: 'test-secret-pass',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
  };

  const { app } = createApp({
    env,
    cloudflareClient,
    sessionSecret: 'test-session-secret-32chars!!',
  });

  const { server, baseUrl } = await listen(app);

  try {
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'test-secret-pass' }),
    });
    assert.equal(loginRes.status, 200);
    const sessionCookie = sessionCookieHeaderFromResponse(loginRes);

    const res = await fetch(`${baseUrl}/api/addresses`, {
      headers: { Cookie: sessionCookie },
    });
    assert.equal(res.status, 502);
    const data = await readJson(res);
    assert.ok(typeof data.error === 'string');
    assert.ok(!data.error.includes('mensaje_upstream'));
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});
