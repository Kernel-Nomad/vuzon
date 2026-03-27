import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createVuzonApp } from '../../src/client/app/create-vuzon-app.js';

test('filteredRules: sin catch-all cargado no oculta reglas', () => {
  const app = createVuzonApp();
  app.catchAll = null;
  app.rules = [
    {
      id: 'ca',
      name: 'catch@example.com',
      enabled: true,
      matchers: [{ type: 'all' }],
      actions: [{ type: 'drop' }],
    },
    {
      id: 'r1',
      name: 'a@example.com',
      enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: 'a@example.com' }],
      actions: [{ type: 'forward', value: ['d@x.com'] }],
    },
  ];
  assert.equal(app.filteredRules.length, 2);
});

test('filteredRules: excluye duplicado por id cuando hay catchAll', () => {
  const app = createVuzonApp();
  app.catchAll = { id: 'same', enabled: true, actions: [{ type: 'drop' }] };
  app.rules = [
    {
      id: 'same',
      name: 'Catch-all rule',
      enabled: true,
      matchers: [{ type: 'all' }],
      actions: [{ type: 'drop' }],
    },
    {
      id: 'r1',
      name: 'a@example.com',
      enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: 'a@example.com' }],
      actions: [],
    },
  ];
  assert.equal(app.filteredRules.length, 1);
  assert.equal(app.filteredRules[0].id, 'r1');
});

test('filteredRules: excluye regla con matcher type all si hay catchAll (id distinto)', () => {
  const app = createVuzonApp();
  app.catchAll = { id: 'from_api', enabled: true, actions: [] };
  app.rules = [
    {
      id: 'listed_elsewhere',
      name: 'Listed catch-all',
      enabled: true,
      matchers: [{ type: 'all' }],
      actions: [{ type: 'forward', value: ['x@y.com'] }],
    },
    {
      id: 'r1',
      name: 'lit@example.com',
      enabled: true,
      matchers: [{ type: 'literal', field: 'to', value: 'lit@example.com' }],
      actions: [],
    },
  ];
  assert.equal(app.filteredRules.length, 1);
  assert.equal(app.filteredRules[0].id, 'r1');
});

test('aliasListEmptyMessage: solo catch-all cuando quedan cero alias tras filtrar', () => {
  const app = createVuzonApp();
  app.search = '';
  app.catchAll = { id: 'ca', enabled: true, actions: [] };
  app.rules = [
    {
      id: 'ca',
      name: 'Catch',
      matchers: [{ type: 'all' }],
      actions: [],
    },
  ];
  assert.equal(app.filteredRules.length, 0);
  assert.equal(
    app.aliasListEmptyMessage,
    'No hay alias personalizados; solo aplica el catch-all.',
  );
});
