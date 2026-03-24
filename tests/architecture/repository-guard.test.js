import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

test('árbol: entrypoints del servidor y bootstrap existen', () => {
  assert.ok(fs.existsSync(path.join(root, 'src', 'server.js')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'server', 'bootstrap', 'create-app.js')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'server', 'bootstrap', 'start-server.js')));
});

test('árbol: esquemas compartidos en src/shared', () => {
  assert.ok(fs.existsSync(path.join(root, 'src', 'shared', 'cloudflare-schemas.js')));
});
