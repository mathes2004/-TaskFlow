import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import RecentTasks from '../components/dashboard/RecentTasks';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines';
import { ErrorState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Spinner';
import { parseApiError } from '../utils/apiErrors';
import usePageTitle from '../utils/usePageTitle';

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    getDashboard()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: parseApiError(err).message }));
  }, []);
  useEffect(load, [load]);

  const { data, loading, error } = state;
  const c = data?.counts;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-600">Here is where your tasks stand today.</p>
        </div>
        <Link to="/tasks/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New task</Link>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
        </div>
      )}

      {data && (
        <>
          <section aria-label="Task statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total" value={c.total} to="/tasks" />
            <StatCard label="Pending" value={c.pending} tone="amber" to="/tasks?status=pending" />
            <StatCard label="In Progress" value={c.in_progress} tone="blue" to="/tasks?status=in_progress" />
            <StatCard label="Completed" value={c.completed} tone="green" to="/tasks?status=completed" />
            <StatCard label="Overdue" value={c.overdue} tone="red" to="/tasks?overdue=1" />
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentTasks tasks={data.recent} />
            <UpcomingDeadlines tasks={data.upcoming} />
          </div>
        </>
      )}
    </div>
  );
}
