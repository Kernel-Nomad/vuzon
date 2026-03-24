import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createApp } from '../../../src/server/bootstrap/create-app.js';

function createMockCloudflareClient() {
  return {
    async fetchCloudflare(requestPath, method = 'GET', body = null) {
      const isRuleItem = /\/email\/routing\/rules\/[^/]+$/.test(requestPath);

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

test('integración HTTP: healthz, auth, API con Cloudflare simulado', async () => {
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-test-sess-'));

  const env = {
    AUTH_USER: 'testuser',
    AUTH_PASS: 'test-secret-pass',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
    LOGIN_RATE_LIMIT_MAX: '0',
  };

  const cloudflareClient = createMockCloudflareClient();
  const { app } = createApp({
    env,
    cloudflareClient,
    sessionSecret: 'test-session-secret-32chars!!',
    sessionStorePath: sessionDir,
    publicDir: path.resolve('dist/public'),
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
      const raw = res.headers.get('set-cookie');
      assert.ok(raw);
      sessionCookie = raw.split(';')[0];
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
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
});

test('integración HTTP: login con AUTH en env con espacios (trim)', async () => {
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-test-sess-'));

  const env = {
    AUTH_USER: '  trimuser  ',
    AUTH_PASS: '  trim-pass  ',
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: '  example.com  ',
    NODE_ENV: 'development',
    LOGIN_RATE_LIMIT_MAX: '0',
  };

  const { app } = createApp({
    env,
    cloudflareClient: createMockCloudflareClient(),
    sessionSecret: 'test-session-secret-32chars!!',
    sessionStorePath: sessionDir,
    publicDir: path.resolve('dist/public'),
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

    const raw = res.headers.get('set-cookie');
    assert.ok(raw);
    const sessionCookie = raw.split(';')[0];

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
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
});

test('integración HTTP: login sin AUTH configurado rechaza cuerpo vacío (500)', async () => {
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-test-sess-'));

  const env = {
    CF_ZONE_ID: 'zone_test_1',
    CF_ACCOUNT_ID: 'acct_test_1',
    DOMAIN: 'example.com',
    NODE_ENV: 'development',
    LOGIN_RATE_LIMIT_MAX: '0',
  };

  const { app } = createApp({
    env,
    cloudflareClient: createMockCloudflareClient(),
    sessionSecret: 'test-session-secret-32chars!!',
    sessionStorePath: sessionDir,
    publicDir: path.resolve('dist/public'),
  });

  const { server, baseUrl } = await listen(app);

  try {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }),
    });
    assert.equal(res.status, 500);
    const data = await readJson(res);
    assert.ok(data && typeof data.error === 'string');
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }
});
