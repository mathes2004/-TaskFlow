import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import OverdueBadge from './OverdueBadge';
import StatusSelect from './StatusSelect';
import { formatDate } from '../../utils/dates';

export default function TaskTable({ tasks, busyId, onStatusChange, onDelete }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Your tasks</caption>
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Title</th>
            <th scope="col" className="px-4 py-3 font-semibold">Priority</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            <th scope="col" className="px-4 py-3 font-semibold">Due date</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="max-w-xs px-4 py-3">
                <Link to={`/tasks/${t.id}`} className={`block truncate font-medium hover:text-indigo-700 ${t.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                  {t.title}
                </Link>
              </td>
              <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  <StatusSelect task={t} onChange={onStatusChange} disabled={busyId === t.id} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-700">{formatDate(t.due_date)}</span>
                  <OverdueBadge task={t} />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-3">
                  <Link to={`/tasks/${t.id}/edit`} className="font-medium text-indigo-600 hover:text-indigo-800">Edit</Link>
                  <button onClick={() => onDelete(t)} className="font-medium text-red-600 hover:text-red-800">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
