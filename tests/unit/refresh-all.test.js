import assert from 'node:assert/strict';
import { test } from 'node:test';
import { refreshAll } from '../../src/client/features/dashboard/refresh-all.js';

test('refreshAll: sin fallos limpia el mensaje de estado', async () => {
  const state = {
    profile: {},
    rules: [],
    dests: [],
    catchAll: null,
    newAlias: { dest: '' },
    statusMsg: 'Carga parcial: catch-all: error antiguo',
  };

  const payloads = {
    '/api/me': { email: 'u', rootDomain: 'x.com' },
    '/api/rules': { result: [] },
    '/api/addresses': { result: [] },
    '/api/rules/catch-all': { result: { id: 'ca', enabled: true, actions: [] } },
  };

  const apiRequest = async (path) => {
    const body = payloads[path];
    if (!body) {
      throw new Error('ruta desconocida');
    }
    return body;
  };

  const statusCalls = [];
  const setStatus = (s, msg) => {
    statusCalls.push(msg);
    s.statusMsg = msg;
  };

  await refreshAll(state, { apiRequest, setStatus });

  assert.deepEqual(statusCalls, ['']);
  assert.equal(state.statusMsg, '');
});
