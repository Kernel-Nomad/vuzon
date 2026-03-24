import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { resolveSessionSecret } from '../../src/server/config/session-secret.js';

test('resolveSessionSecret: SESSION_SECRET en env tiene prioridad', { concurrency: false }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-secret-'));
  const storePath = path.join(dir, 'sessions');
  fs.mkdirSync(storePath);
  fs.writeFileSync(path.join(storePath, '.session_secret'), 'from-file', 'utf-8');

  const secret = resolveSessionSecret({
    env: { SESSION_SECRET: 'from-env' },
    sessionStorePath: storePath,
  });

  assert.equal(secret, 'from-env');
});

test('resolveSessionSecret: lee archivo bajo sessionStorePath', { concurrency: false }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-secret-'));
  const storePath = path.join(dir, 'sessions');
  fs.mkdirSync(storePath);
  fs.writeFileSync(path.join(storePath, '.session_secret'), '  store-secret  \n', 'utf-8');

  const secret = resolveSessionSecret({
    env: {},
    sessionStorePath: storePath,
  });

  assert.equal(secret, 'store-secret');
});

test('resolveSessionSecret: fallback a .session_secret legado en cwd', { concurrency: false }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-secret-'));
  const storePath = path.join(dir, 'empty-sessions');
  fs.mkdirSync(storePath);
  const prev = process.cwd();
  process.chdir(dir);
  t.after(() => {
    process.chdir(prev);
  });
  fs.writeFileSync(path.join(dir, '.session_secret'), 'legacy-value', 'utf-8');

  const secret = resolveSessionSecret({
    env: {},
    sessionStorePath: storePath,
  });

  assert.equal(secret, 'legacy-value');
});

test('resolveSessionSecret: genera y escribe en sessionStorePath', { concurrency: false }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuzon-secret-'));
  const storePath = path.join(dir, 'sessions');
  const prev = process.cwd();
  process.chdir(dir);
  t.after(() => {
    process.chdir(prev);
  });

  const secret = resolveSessionSecret({
    env: {},
    sessionStorePath: storePath,
  });

  assert.match(secret, /^[a-f0-9]{64}$/);
  const filePath = path.join(storePath, '.session_secret');
  assert.ok(fs.existsSync(filePath));
  assert.equal(fs.readFileSync(filePath, 'utf-8'), secret);
});
