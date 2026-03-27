import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveSessionSecret } from '../../src/server/config/session-secret.js';

test('resolveSessionSecret: SESSION_SECRET en env', () => {
  const secret = resolveSessionSecret({
    env: { SESSION_SECRET: 'from-env' },
  });
  assert.equal(secret, 'from-env');
});

test('resolveSessionSecret: aplica trim a SESSION_SECRET', () => {
  const secret = resolveSessionSecret({
    env: { SESSION_SECRET: '  trimmed-secret  \n' },
  });
  assert.equal(secret, 'trimmed-secret');
});

test('resolveSessionSecret: SESSION_SECRET solo espacios se trata como ausente', async (t) => {
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };
  t.after(() => {
    console.warn = origWarn;
  });

  const secret = resolveSessionSecret({
    env: { SESSION_SECRET: '   \t  ' },
  });

  assert.match(secret, /^[a-f0-9]{64}$/);
  assert.match(warnings.join('\n'), /SESSION_SECRET/i);
});

test('resolveSessionSecret: sin SESSION_SECRET genera hex 64 y avisa', async (t) => {
  const warnings = [];
  const origWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(' '));
  };
  t.after(() => {
    console.warn = origWarn;
  });

  const secret = resolveSessionSecret({ env: {} });

  assert.match(secret, /^[a-f0-9]{64}$/);
  assert.match(warnings.join('\n'), /SESSION_SECRET/i);
  assert.match(warnings.join('\n'), /reinicio/i);
});
