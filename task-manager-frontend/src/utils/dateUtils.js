export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
