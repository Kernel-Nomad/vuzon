const loginForm = document.getElementById('loginForm');

async function buildLoginErrorMessage(res) {
  let apiMessage = '';
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    try {
      const payload = await res.json();
      apiMessage = payload?.error || payload?.message || '';
    } catch {
      apiMessage = '';
    }
  }

  if (res.status === 401) {
    return apiMessage || 'Credenciales incorrectas';
  }

  if (res.status === 429) {
    return apiMessage || 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }

  if (res.status >= 500) {
    return apiMessage || 'Error del servidor. Inténtalo de nuevo.';
  }

  return apiMessage || `No se pudo iniciar sesión (HTTP ${res.status})`;
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const errorMsg = document.getElementById('errorMsg');
    const button = event.target.querySelector('button');

    if (!errorMsg || !button) {
      return;
    }

    button.disabled = true;
    button.textContent = 'Verificando...';
    errorMsg.style.display = 'none';

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        throw new Error(await buildLoginErrorMessage(res));
      }
    } catch (err) {
      errorMsg.textContent = err?.message || 'No se pudo iniciar sesión';
      errorMsg.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Entrar';
    }
  });
}
