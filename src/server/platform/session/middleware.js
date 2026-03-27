import cookieSession from 'cookie-session';

export const SESSION_COOKIE_NAME = 'vuzon_session';

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export function getSessionCookieClearOptions({ isProduction } = {}) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  };
}

export function getSessionCookieOptions({ isProduction } = {}) {
  return {
    ...getSessionCookieClearOptions({ isProduction }),
    maxAge: SESSION_MAX_AGE_MS,
  };
}

export function createSessionMiddleware({
  sessionSecret,
  isProduction,
} = {}) {
  const cookieOpts = getSessionCookieOptions({ isProduction });
  return cookieSession({
    name: SESSION_COOKIE_NAME,
    keys: [sessionSecret],
    ...cookieOpts,
  });
}
