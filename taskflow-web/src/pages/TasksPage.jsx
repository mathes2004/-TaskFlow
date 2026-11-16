import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { deleteTask, patchTask } from '../api/tasks';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskTable from '../components/tasks/TaskTable';
import TaskCard from '../components/tasks/TaskCard';
import DeleteTaskDialog from '../components/tasks/DeleteTaskDialog';
import Pagination from '../components/ui/Pagination';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { parseApiError } from '../utils/apiErrors';
import { statusLabel } from '../utils/labels';
import usePageTitle from '../utils/usePageTitle';

export default function TasksPage() {
  usePageTitle('My Tasks');
  const toast = useToast();
  const t = useTasks();
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleStatusChange(task, status) {
    setBusyId(task.id);
    try {
      await patchTask(task.id, { status });
      toast.success(`Marked “${task.title}” as ${statusLabel(status)}.`);
      t.reload();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteTask(toDelete.id);
      toast.success(`Deleted “${toDelete.title}”.`);
      setToDelete(null);
      const page = Number(t.query.page) || 1;
      if (t.items.length === 1 && page > 1) t.setFilter('page', String(page - 1));
      else t.reload();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const firstLoad = t.loading && t.items.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
          {t.meta && <p className="text-sm text-slate-600">{t.meta.total} {t.meta.total === 1 ? 'task' : 'tasks'}{t.hasFilters ? ' match your filters' : ''}</p>}
        </div>
        <Link to="/tasks/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New task</Link>
      </div>

      <TaskFilters {...t} />

      {t.error && <ErrorState message={parseApiError(t.error).message} onRetry={t.reload} />}

      {firstLoad && !t.error && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading tasks">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      )}

      {!t.error && !firstLoad && t.items.length === 0 && (
        t.hasFilters ? (
          <EmptyState icon="🔍" title="No tasks match these filters" message="Try a different search or remove some filters." action={<Button variant="secondary" onClick={t.clearFilters}>Clear filters</Button>} />
        ) : (
          <EmptyState title="No tasks yet" message="Create your first task and start tracking your progress." action={<Link to="/tasks/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create your first task</Link>} />
        )
      )}

      {!t.error && t.items.length > 0 && (
        <div className={t.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={t.loading}>
          <TaskTable tasks={t.items} busyId={busyId} onStatusChange={handleStatusChange} onDelete={setToDelete} />
          <div className="space-y-3 md:hidden">
            {t.items.map((task) => (
              <TaskCard key={task.id} task={task} busy={busyId === task.id} onStatusChange={handleStatusChange} onDelete={setToDelete} />
            ))}
          </div>
        </div>
      )}

      <Pagination meta={t.meta} onPage={(p) => { t.setFilter('page', p > 1 ? String(p) : ''); window.scrollTo({ top: 0 }); }} />

      <DeleteTaskDialog task={toDelete} deleting={deleting} onCancel={() => setToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}
