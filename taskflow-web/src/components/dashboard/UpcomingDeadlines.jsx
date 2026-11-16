import { Link } from 'react-router-dom';
import PriorityBadge from '../tasks/PriorityBadge';
import OverdueBadge from '../tasks/OverdueBadge';
import { formatDate } from '../../utils/dates';

export default function UpcomingDeadlines({ tasks }) {
  return (
    <section aria-labelledby="upcoming-h" className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 id="upcoming-h" className="text-base font-semibold text-slate-900">Due in the next 7 days</h2>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Nothing due this week. Enjoy the calm. 🎉</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <Link to={`/tasks/${t.id}`} className="block truncate font-medium text-slate-900 hover:text-indigo-700">{t.title}</Link>
                <p className="text-xs text-slate-500">Due {formatDate(t.due_date)}</p>
              </div>
              <div className="flex items-center gap-2"><OverdueBadge task={t} /><PriorityBadge priority={t.priority} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
