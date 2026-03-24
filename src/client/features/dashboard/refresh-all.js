import { getDestSelectionState } from '../../shared/dest-selection.js';

export async function refreshAll(state, { apiRequest, setStatus }) {
  state.loading = true;

  try {
    const [meData, rulesData, destsData] = await Promise.all([
      apiRequest('/api/me'),
      apiRequest('/api/rules'),
      apiRequest('/api/addresses'),
    ]);

    state.profile = meData || { rootDomain: '' };
    state.rules = rulesData?.result || [];
    state.dests = destsData?.result || [];

    const { selectedValue } = getDestSelectionState(state.dests, state.newAlias.dest);
    state.newAlias.dest = selectedValue;
  } catch (err) {
    console.error('Error cargando datos:', err);
    setStatus(state, `Error de carga: ${err.message}`);
    state.profile = state.profile || { rootDomain: '' };
    state.rules = state.rules || [];
    state.dests = state.dests || [];
  } finally {
    state.loading = false;
  }
}
