import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import OverdueBadge from './OverdueBadge';
import StatusSelect from './StatusSelect';
import { formatDate } from '../../utils/dates';

/** Mobile layout of a task row (shown below the md breakpoint). */
export default function TaskCard({ task, busy, onStatusChange, onDelete }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <Link to={`/tasks/${task.id}`} className={`block break-words font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
        {task.title}
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        <OverdueBadge task={task} />
      </div>
      <p className="mt-2 text-sm text-slate-600">Due: {formatDate(task.due_date)}</p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <StatusSelect task={task} onChange={onStatusChange} disabled={busy} />
        <div className="flex gap-4 text-sm">
          <Link to={`/tasks/${task.id}/edit`} className="font-medium text-indigo-600">Edit</Link>
          <button onClick={() => onDelete(task)} className="font-medium text-red-600">Delete</button>
        </div>
      </div>
    </article>
  );
}
