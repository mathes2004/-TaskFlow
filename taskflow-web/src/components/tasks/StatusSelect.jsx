import { STATUSES } from '../../utils/labels';

/** Quick status change straight from the list (sends PATCH with status only). */
export default function StatusSelect({ task, onChange, disabled }) {
  return (
    <select
      aria-label={`Status of ${task.title}`}
      value={task.status}
      disabled={disabled}
      onChange={(e) => onChange(task, e.target.value)}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
    >
      {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}
