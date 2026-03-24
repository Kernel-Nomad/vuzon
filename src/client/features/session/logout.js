export async function logout({ apiRequest }) {
  try {
    await apiRequest('/api/logout', 'POST');
    window.location.href = '/login.html';
  } catch (err) {
    console.error(err);
    window.location.href = '/login.html';
  }
}
