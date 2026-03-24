export function setStatus(state, message) {
  state.statusMsg = message;

  if (state.statusTimer) {
    clearTimeout(state.statusTimer);
  }

  state.statusTimer = setTimeout(() => {
    state.statusMsg = '';
  }, 5000);
}

export function clearErrors(state) {
  state.errors.alias = '';
  state.errors.dest = '';
}
