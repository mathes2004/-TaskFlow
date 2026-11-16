const fmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
});
const fmtTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

/** "YYYY-MM-DD" -> "Wed, 25 Nov 2026" (parsed as a local date to avoid timezone shifts) */
export function formatDate(value) {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  return fmt.format(new Date(y, m - 1, d));
}
export function formatDateTime(iso) {
  return iso ? fmtTime.format(new Date(iso)) : '—';
}
export function todayIn(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
/** Due today or tomorrow (user's timezone). Overdue is trusted from the server. */
export function isDueSoon(task, timeZone) {
  if (!task.due_date || task.status === 'completed' || task.is_overdue) return false;
  const today = todayIn(timeZone);
  return task.due_date === today || task.due_date === addDays(today, 1);
}
