import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLoginFailureRateLimiter } from '../../src/server/features/auth/login-failure-rate-limit.js';

test('rate limit desactivado: LOGIN_RATE_LIMIT_MAX=0', () => {
  const limiter = createLoginFailureRateLimiter({
    env: { LOGIN_RATE_LIMIT_MAX: '0' },
  });
  assert.equal(limiter.isBlocked('10.0.0.1'), false);
  limiter.recordFailure('10.0.0.1');
  assert.equal(limiter.isBlocked('10.0.0.1'), false);
  assert.equal(limiter.retryAfterSeconds('10.0.0.1'), 0);
});

test('rate limit: bloqueo y Retry-After tras N fallos', (t) => {
  t.mock.timers.enable({ apis: ['Date'] });

  const limiter = createLoginFailureRateLimiter({
    env: {
      LOGIN_RATE_LIMIT_MAX: '3',
      LOGIN_RATE_LIMIT_WINDOW_MS: '60000',
    },
  });

  limiter.recordFailure('10.0.0.2');
  limiter.recordFailure('10.0.0.2');
  assert.equal(limiter.isBlocked('10.0.0.2'), false);

  limiter.recordFailure('10.0.0.2');
  assert.equal(limiter.isBlocked('10.0.0.2'), true);
  const retryAfter = limiter.retryAfterSeconds('10.0.0.2');
  assert.ok(retryAfter > 0 && retryAfter <= 60);

  t.mock.timers.tick(60_001);
  assert.equal(limiter.isBlocked('10.0.0.2'), false);
});

test('rate limit: login correcto limpia contador (clear)', () => {
  const limiter = createLoginFailureRateLimiter({
    env: { LOGIN_RATE_LIMIT_MAX: '2', LOGIN_RATE_LIMIT_WINDOW_MS: '60000' },
  });
  limiter.recordFailure('10.0.0.3');
  limiter.recordFailure('10.0.0.3');
  assert.equal(limiter.isBlocked('10.0.0.3'), true);
  limiter.clear('10.0.0.3');
  assert.equal(limiter.isBlocked('10.0.0.3'), false);
});

test('rate limit: cap de un bucket desplaza la IP anterior', () => {
  const limiter = createLoginFailureRateLimiter({
    env: {
      LOGIN_RATE_LIMIT_MAX: '5',
      LOGIN_RATE_LIMIT_WINDOW_MS: '600000',
      LOGIN_RATE_LIMIT_MAX_BUCKETS: '1',
    },
  });

  limiter.recordFailure('10.0.0.20');
  assert.equal(limiter.isBlocked('10.0.0.20'), false);
  limiter.recordFailure('10.0.0.21');
  assert.equal(limiter.isBlocked('10.0.0.20'), false);
});
