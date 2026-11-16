import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createTask, getTask, updateTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import Input, { Textarea } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/EmptyState';
import { parseApiError } from '../utils/apiErrors';
import { PRIORITIES, STATUSES } from '../utils/labels';
import { todayIn } from '../utils/dates';
import usePageTitle from '../utils/usePageTitle';

const EMPTY = { title: '', description: '', priority: 'medium', status: 'pending', due_date: '' };

export default function TaskFormPage() {
  const { id } = useParams();
  const editing = !!id;
  usePageTitle(editing ? 'Edit task' : 'New task');
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!editing) { setForm(EMPTY); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true); setLoadError(null);
    getTask(id)
      .then((t) => !cancelled && setForm({ title: t.title, description: t.description ?? '', priority: t.priority, status: t.status, due_date: t.due_date ?? '' }))
      .catch((err) => !cancelled && setLoadError(err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, editing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    const payload = { ...form, title: form.title.trim(), description: form.description.trim() || null, due_date: form.due_date || null };
    try {
      const saved = editing ? await updateTask(id, payload) : await createTask(payload);
      toast.success(editing ? 'Task updated.' : 'Task created.');
      navigate(`/tasks/${saved.id}`);
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (loadError) {
    return loadError.response?.status === 404
      ? <TaskNotFound />
      : <ErrorState message={parseApiError(loadError).message} onRetry={() => navigate(0)} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <Link to="/tasks" className="hover:text-indigo-700">My Tasks</Link> / <span>{editing ? 'Edit task' : 'New task'}</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{editing ? 'Edit task' : 'Create a task'}</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <Input label="Title" name="title" required maxLength={150} value={form.title} onChange={set('title')} error={errors.title} hint={`${form.title.length}/150`} />
        <Textarea label="Description" name="description" rows={5} maxLength={5000} value={form.description} onChange={set('description')} error={errors.description} hint="Optional. Up to 5,000 characters." />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Priority" name="priority" options={PRIORITIES} value={form.priority} onChange={set('priority')} error={errors.priority} />
          <Select label="Status" name="status" options={STATUSES} value={form.status} onChange={set('status')} error={errors.status} />
        </div>
        <Input
          label="Due date" type="date" name="due_date" value={form.due_date} onChange={set('due_date')} error={errors.due_date}
          min={editing ? undefined : todayIn(user?.timezone)}
          hint={editing ? 'Optional.' : 'Optional. Today or later.'}
        />
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button type="submit" loading={saving} loadingText="Saving…">{editing ? 'Save changes' : 'Create task'}</Button>
        </div>
      </form>
    </div>
  );
}

export function TaskNotFound() {
  usePageTitle('Task not found');
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
      <div className="text-4xl" aria-hidden="true">🕵️</div>
      <h1 className="mt-3 text-xl font-bold text-slate-900">Task not found</h1>
      <p className="mt-1 text-sm text-slate-600">It may have been deleted, or it never existed.</p>
      <Link to="/tasks" className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back to My Tasks</Link>
    </div>
  );
}
