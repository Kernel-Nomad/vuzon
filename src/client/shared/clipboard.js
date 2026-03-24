export async function copyPreviewToClipboard(state, { setStatus }) {
  if (!state.profile.rootDomain) {
    return;
  }

  const text = state.previewText;

  try {
    await navigator.clipboard.writeText(text);
    state.copied = true;
    setTimeout(() => {
      state.copied = false;
    }, 2000);
  } catch (err) {
    console.error('Error al copiar:', err);
    setStatus(state, 'No se pudo copiar (¿Usas HTTPS?)');

    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      state.copied = true;
      setTimeout(() => {
        state.copied = false;
      }, 2000);
      setStatus(state, '');
    } catch (fallbackErr) {
      prompt('Copia tu alias manualmente:', text);
    }

    document.body.removeChild(textArea);
  }
}
