const DEFAULT_MAX_FAILURES = 30;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_BUCKETS = 10_000;

function parseMaxFailures(raw) {
  if (raw === undefined || raw === '') {
    return DEFAULT_MAX_FAILURES;
  }
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_MAX_FAILURES;
  }
  return n;
}

function parseWindowMs(raw) {
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_WINDOW_MS;
}

function parseMaxBuckets(raw) {
  if (raw === undefined || raw === '') {
    return DEFAULT_MAX_BUCKETS;
  }
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_MAX_BUCKETS;
  }
  return n;
}

function evictBucketsToCap(buckets, now, maxBuckets) {
  for (const [key, state] of buckets) {
    if (now >= state.resetAt) {
      buckets.delete(key);
    }
  }

  while (buckets.size >= maxBuckets) {
    let evictKey = null;
    let evictReset = Infinity;
    for (const [key, state] of buckets) {
      if (state.resetAt <= evictReset) {
        evictReset = state.resetAt;
        evictKey = key;
      }
    }
    if (evictKey === null) {
      break;
    }
    buckets.delete(evictKey);
  }
}

/**
 * Limita intentos fallidos de login por IP. Tras un login correcto se limpia el contador.
 * LOGIN_RATE_LIMIT_MAX=0 desactiva el límite.
 * LOGIN_RATE_LIMIT_MAX_BUCKETS acota entradas en memoria por IP distintas.
 */
export function createLoginFailureRateLimiter({ env = process.env } = {}) {
  const maxFailures = parseMaxFailures(env.LOGIN_RATE_LIMIT_MAX);
  const windowMs = parseWindowMs(env.LOGIN_RATE_LIMIT_WINDOW_MS);
  const maxBuckets = parseMaxBuckets(env.LOGIN_RATE_LIMIT_MAX_BUCKETS);

  if (maxFailures <= 0) {
    return {
      isBlocked() {
        return false;
      },
      recordFailure() {},
      retryAfterSeconds() {
        return 0;
      },
      clear() {},
    };
  }

  const buckets = new Map();

  function getState(ip, now) {
    let state = buckets.get(ip);
    if (!state || now >= state.resetAt) {
      if (state && now >= state.resetAt) {
        buckets.delete(ip);
      }
      if (!buckets.has(ip)) {
        evictBucketsToCap(buckets, now, maxBuckets);
      }
      state = { failures: 0, resetAt: now + windowMs };
      buckets.set(ip, state);
    }
    return state;
  }

  return {
    isBlocked(ip) {
      const now = Date.now();
      const state = getState(ip, now);
      return state.failures >= maxFailures;
    },

    recordFailure(ip) {
      const now = Date.now();
      const state = getState(ip, now);
      state.failures += 1;
    },

    retryAfterSeconds(ip) {
      const state = buckets.get(ip);
      if (!state || state.failures < maxFailures) {
        return 0;
      }
      return Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000));
    },

    clear(ip) {
      buckets.delete(ip);
    },
  };
}
