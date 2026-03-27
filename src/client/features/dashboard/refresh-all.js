import { getDestSelectionState } from '../../shared/dest-selection.js';

const REFRESH_ENDPOINTS = [
  { path: '/api/me', label: 'perfil' },
  { path: '/api/rules', label: 'reglas' },
  { path: '/api/addresses', label: 'destinatarios' },
];

export async function refreshAll(state, { apiRequest, setStatus }) {
  state._refreshDepth = (state._refreshDepth || 0) + 1;
  if (state._refreshDepth === 1) {
    state.loading = true;
  }

  try {
    const results = await Promise.allSettled(
      REFRESH_ENDPOINTS.map((e) => apiRequest(e.path)),
    );

    const failures = [];

    results.forEach((result, i) => {
      const { path, label } = REFRESH_ENDPOINTS[i];
      if (result.status !== 'fulfilled') {
        const msg = result.reason?.message || String(result.reason);
        failures.push(`${label}: ${msg}`);
        return;
      }

      const data = result.value;
      if (path === '/api/me') {
        state.profile = data || { rootDomain: '' };
      } else if (path === '/api/rules') {
        state.rules = data?.result || [];
      } else if (path === '/api/addresses') {
        state.dests = data?.result || [];
      }
    });

    const { selectedValue } = getDestSelectionState(state.dests, state.newAlias.dest);
    state.newAlias.dest = selectedValue;

    if (failures.length > 0) {
      setStatus(state, `Carga parcial: ${failures.join(' · ')}`);
    }
  } catch (err) {
    console.error('Error cargando datos:', err);
    setStatus(state, `Error de carga: ${err.message}`);
    state.profile = state.profile || { rootDomain: '' };
    state.rules = state.rules || [];
    state.dests = state.dests || [];
  } finally {
    state._refreshDepth = Math.max(0, (state._refreshDepth || 1) - 1);
    if (state._refreshDepth === 0) {
      state.loading = false;
    }
  }
}
