export function interpretAddDestError(err) {
  const rawMessage = String(err?.message || err || '').trim();
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes('rate limited')) {
    return {
      message: 'Límite de solicitudes alcanzado. Espera unos segundos.',
      redirect: false,
    };
  }

  return {
    message: `Error: ${rawMessage || 'Desconocido'}`,
    redirect: false,
  };
}
