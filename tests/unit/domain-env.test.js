import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertDomainConfigured,
  getPanelDomain,
} from '../../src/server/config/domain-env.js';

test('assertDomainConfigured: acepta dominio válido', () => {
  assertDomainConfigured({ DOMAIN: 'example.com' });
});

test('assertDomainConfigured: rechaza DOMAIN ausente', () => {
  assert.throws(
    () => assertDomainConfigured({}),
    /DOMAIN/,
  );
});

test('assertDomainConfigured: rechaza solo espacios', () => {
  assert.throws(
    () => assertDomainConfigured({ DOMAIN: '   ' }),
    /DOMAIN/,
  );
});

test('getPanelDomain: recorta espacios', () => {
  assert.equal(getPanelDomain({ DOMAIN: '  example.com  ' }), 'example.com');
});
