import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteTask, getTask, patchTask } from '../api/tasks';
import StatusBadge from '../components/tasks/StatusBadge';
import PriorityBadge from '../components/tasks/PriorityBadge';
import OverdueBadge from '../components/tasks/OverdueBadge';
import DeleteTaskDialog from '../components/tasks/DeleteTaskDialog';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { TaskNotFound } from './TaskFormPage';
import { parseApiError } from '../utils/apiErrors';
import { formatDate, formatDateTime } from '../utils/dates';
import { STATUSES } from '../utils/labels';
import usePageTitle from '../utils/usePageTitle';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  usePageTitle(task?.title ?? 'Task');

  const load = useCallback(() => {
    setLoading(true); setError(null);
    getTask(id).then(setTask).catch(setError).finally(() => setLoading(false));
  }, [id]);
  useEffect(load, [load]);

  async function changeStatus(status) {
    setBusy(true);
    try {
      setTask(await patchTask(task.id, { status }));
      toast.success('Status updated.');
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success(`Deleted “${task.title}”.`);
      navigate('/tasks', { replace: true });
    } catch (err) {
      toast.error(parseApiError(err).message);
      setDeleting(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return error.response?.status === 404 ? <TaskNotFound /> : <ErrorState message={parseApiError(error).message} onRetry={load} />;

  const rows = [
    ['Due date', <span key="d" className="flex flex-wrap items-center gap-2">{formatDate(task.due_date)} <OverdueBadge task={task} /></span>],
    ['Created', formatDateTime(task.created_at)],
    ['Last updated', formatDateTime(task.updated_at)],
    ['Completed', task.completed_at ? formatDateTime(task.completed_at) : '—'],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link to="/tasks" className="hover:text-indigo-700">My Tasks</Link> / <span>Details</span>
      </nav>

      <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className={`min-w-0 break-words text-2xl font-bold ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{task.title}</h1>
          <div className="flex gap-2">
            <Link to={`/tasks/${task.id}/edit`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</Link>
            <Button variant="danger" onClick={() => setConfirming(true)}>Delete</Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} /><StatusBadge status={task.status} />
        </div>

        <section aria-labelledby="desc-h" className="mt-6">
          <h2 id="desc-h" className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
          {task.description
            ? <p className="preserve-lines mt-2 text-slate-800">{task.description}</p>
            : <p className="mt-2 text-sm italic text-slate-500">No description.</p>}
        </section>

        <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="text-sm font-semibold text-slate-500">{k}</dt><dd className="mt-1 text-sm text-slate-900">{v}</dd></div>
          ))}
        </dl>

        <section aria-labelledby="move-h" className="mt-6 border-t border-slate-100 pt-6">
          <h2 id="move-h" className="text-sm font-semibold uppercase tracking-wide text-slate-500">Change status</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button key={s.value} variant={task.status === s.value ? 'primary' : 'secondary'} size="sm" disabled={busy || task.status === s.value} aria-pressed={task.status === s.value} onClick={() => changeStatus(s.value)}>
                {s.label}
              </Button>
            ))}
          </div>
        </section>
      </article>

      <DeleteTaskDialog task={confirming ? task : null} deleting={deleting} onCancel={() => setConfirming(false)} onConfirm={confirmDelete} />
    </div>
  );
}
