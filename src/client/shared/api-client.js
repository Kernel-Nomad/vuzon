export async function apiRequest(requestPath, method = 'GET', body = null) {
  const options = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (method !== 'GET') {
    options.method = method;

    if (body) {
      options.body = JSON.stringify(body);
    }
  }

  const res = await fetch(requestPath, options);

  if (res.status === 401) {
    window.location.href = '/login.html';
    throw new Error('Sesión expirada');
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (!contentType.includes('application/json')) {
    if (res.redirected || res.url?.endsWith('/login.html')) {
      window.location.href = '/login.html';
      throw new Error('Sesión expirada');
    }

    throw new Error(`Respuesta inesperada del servidor (${res.status})`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Respuesta JSON inválida del servidor (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Error ${res.status}`);
  }

  return data;
}
