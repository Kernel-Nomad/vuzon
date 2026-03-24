import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

test('scripts/build-client.js pasa node --check', () => {
  const script = path.join(root, 'scripts', 'build-client.js');
  const r = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
