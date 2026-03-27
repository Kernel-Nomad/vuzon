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

function formatActionDestination(action) {
  if (!action || typeof action.type !== 'string') {
    return '';
  }

  const { type } = action;
  const raw = action.value;
  const parts = Array.isArray(raw)
    ? raw.map((v) => (v == null ? '' : String(v))).filter(Boolean)
    : raw != null && raw !== ''
      ? [String(raw)]
      : [];

  if (type === 'forward') {
    return parts.length > 0 ? parts.join(', ') : '';
  }
  if (type === 'worker') {
    return parts.length > 0 ? `Worker: ${parts.join(', ')}` : 'Email Worker';
  }
  if (type === 'drop') {
    return 'Descartar';
  }
  return parts.length > 0 ? parts.join(', ') : '';
}

export function getRuleDest(rule) {
  const actions = rule?.actions;
  if (!Array.isArray(actions) || actions.length === 0) {
    return '';
  }
  const chunks = actions.map(formatActionDestination).filter(Boolean);
  return chunks.length > 0 ? chunks.join(' · ') : '';
}
