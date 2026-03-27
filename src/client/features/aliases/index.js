export async function createAlias(state, { apiRequest, clearErrors, refreshAll, setStatus }) {
  if (!state.canCreateAlias) {
    return;
  }

  clearErrors(state);
  state.loading = true;
  const localPart = state.normalizedLocalPart;
  state.newAlias.local = localPart;

  try {
    await apiRequest('/api/rules', 'POST', {
      localPart,
      destEmail: state.newAlias.dest,
    });

    setStatus(state, 'Alias creado');
    state.newAlias.local = '';
    await refreshAll();
  } catch (err) {
    setStatus(state, `Error: ${err.message}`);
  } finally {
    state.loading = false;
  }
}

export async function toggleRule(state, rule, { apiRequest, refreshAll, setStatus }) {
  if (!Array.isArray(state.pendingRuleIds)) {
    state.pendingRuleIds = [];
  }

  if (state.pendingRuleIds.includes(rule.id)) {
    return;
  }

  state.pendingRuleIds.push(rule.id);

  try {
    const action = rule.enabled ? 'disable' : 'enable';
    await apiRequest(`/api/rules/${rule.id}/${action}`, 'POST');
    await refreshAll();
    setStatus(state, 'Alias actualizado');
  } catch (err) {
    setStatus(state, `Error: ${err.message}`);
  } finally {
    state.pendingRuleIds = state.pendingRuleIds.filter((pendingId) => pendingId !== rule.id);
  }
}

export async function deleteRule(state, id, { apiRequest, refreshAll, setStatus }) {
  if (!confirm('¿Eliminar alias permanentemente?')) {
    return;
  }

  try {
    await apiRequest(`/api/rules/${id}`, 'DELETE');
    state.rules = state.rules.filter((rule) => rule.id !== id);
    setStatus(state, 'Alias eliminado');
  } catch (err) {
    setStatus(state, `Error: ${err.message}`);
    await refreshAll();
  }
}

export function generateLocalPart(state, { clearErrors }) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < 8; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  state.newAlias.local = result;
  clearErrors(state);
}

export function getRuleDest(rule) {
  const destinations = rule.actions?.[0]?.value || [];
  return Array.isArray(destinations) ? destinations.join(', ') : destinations;
}
