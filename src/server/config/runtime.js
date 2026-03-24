export function getServerRuntime(env = process.env) {
  return {
    port: Number(env.PORT || env.VUZON_PORT) || 8001,
    isProduction: env.NODE_ENV === 'production',
  };
}
