import { interpretAddDestError } from '../../shared/error.js';

export async function addDest(state, { apiRequest, clearErrors, refreshAll, setStatus }) {
  if (!state.newDestInput) {
    return;
  }

  clearErrors(state);
  state.loading = true;

  try {
    await apiRequest('/api/addresses', 'POST', { email: state.newDestInput });
    setStatus(state, 'Añadido. Revisa tu correo para verificar.');
    state.newDestInput = '';
    await refreshAll();
  } catch (err) {
    const interpretation = interpretAddDestError(err);
    state.errors.dest = interpretation.message;
  } finally {
    state.loading = false;
  }
}

export async function deleteDest(state, id, { apiRequest, refreshAll, setStatus }) {
  if (!confirm('¿Eliminar destinatario? Si hay reglas usándolo, dejarán de funcionar.')) {
    return;
  }

  state.loading = true;

  try {
    await apiRequest(`/api/addresses/${id}`, 'DELETE');
    setStatus(state, 'Destinatario eliminado');
    await refreshAll();
  } catch (err) {
    setStatus(state, `Error: ${err.message}`);
  } finally {
    state.loading = false;
  }
}
