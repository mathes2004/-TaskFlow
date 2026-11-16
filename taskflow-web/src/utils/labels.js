export const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];
export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v;
export const priorityLabel = (v) => PRIORITIES.find((s) => s.value === v)?.label ?? v;

export function timezoneList() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Asia/Colombo', 'UTC', 'Europe/London', 'America/New_York'];
  }
}
