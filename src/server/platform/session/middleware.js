import session from 'express-session';
import FileStoreFactory from 'session-file-store';

const FileStore = FileStoreFactory(session);
export const SESSION_COOKIE_NAME = 'connect.sid';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

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
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };
}

export function createSessionMiddleware({
  sessionSecret,
  isProduction,
  storePath = './sessions',
} = {}) {
  return session({
    name: SESSION_COOKIE_NAME,
    store: new FileStore({
      path: storePath,
      ttl: SESSION_TTL_SECONDS,
      retries: 0,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: getSessionCookieOptions({ isProduction }),
  });
}
