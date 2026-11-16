import { Link } from 'react-router-dom';
import StatusBadge from '../tasks/StatusBadge';
import PriorityBadge from '../tasks/PriorityBadge';
import { formatDateTime } from '../../utils/dates';

export default function RecentTasks({ tasks }) {
  return (
    <section aria-labelledby="recent-h" className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 id="recent-h" className="text-base font-semibold text-slate-900">Recently updated</h2>
        <Link to="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View all</Link>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          No tasks yet. <Link to="/tasks/new" className="font-medium text-indigo-600 underline">Create your first task</Link>.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <Link to={`/tasks/${t.id}`} className="block truncate font-medium text-slate-900 hover:text-indigo-700">{t.title}</Link>
                <p className="text-xs text-slate-500">Updated {formatDateTime(t.updated_at)}</p>
              </div>
              <div className="flex items-center gap-2"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
