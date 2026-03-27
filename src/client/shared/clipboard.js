function scheduleCopiedReset(state) {
  if (state.copiedTimer != null) {
    clearTimeout(state.copiedTimer);
  }
  state.copiedTimer = setTimeout(() => {
    state.copiedTimer = null;
    state.copied = false;
  }, 2000);
}

export async function copyPreviewToClipboard(state, { setStatus }) {
  if (!state.profile.rootDomain) {
    return;
  }

  const text = state.previewText;

  try {
    await navigator.clipboard.writeText(text);
    state.copied = true;
    scheduleCopiedReset(state);
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
      scheduleCopiedReset(state);
      setStatus(state, '');
    } catch (fallbackErr) {
      prompt('Copia tu alias manualmente:', text);
    }

    document.body.removeChild(textArea);
  }
}
