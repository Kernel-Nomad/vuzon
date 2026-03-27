import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRuleDest } from '../../src/client/features/aliases/index.js';

test('getRuleDest: forward une correos', () => {
  assert.equal(
    getRuleDest({
      actions: [{ type: 'forward', value: ['a@x.com', 'b@x.com'] }],
    }),
    'a@x.com, b@x.com',
  );
});

test('getRuleDest: worker con value', () => {
  assert.equal(
    getRuleDest({
      actions: [{ type: 'worker', value: ['mi-worker'] }],
    }),
    'Worker: mi-worker',
  );
});

test('getRuleDest: worker sin value', () => {
  assert.equal(
    getRuleDest({
      actions: [{ type: 'worker', value: [] }],
    }),
    'Email Worker',
  );
});

test('getRuleDest: drop', () => {
  assert.equal(
    getRuleDest({
      actions: [{ type: 'drop' }],
    }),
    'Descartar',
  );
});

test('getRuleDest: varias acciones', () => {
  assert.equal(
    getRuleDest({
      actions: [
        { type: 'forward', value: ['u@d.com'] },
        { type: 'drop' },
      ],
    }),
    'u@d.com · Descartar',
  );
});

test('getRuleDest: sin acciones', () => {
  assert.equal(getRuleDest({ actions: [] }), '');
  assert.equal(getRuleDest({}), '');
});
