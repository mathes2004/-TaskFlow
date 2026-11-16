import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listTasks } from '../api/tasks';

export function useTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState({ items: [], meta: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const query = Object.fromEntries(searchParams);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    listTasks(query)
      .then((res) => !cancelled && setState({ items: res.data, meta: res.meta, loading: false, error: null }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: err })));
    return () => { cancelled = true; }; // ignore late responses when filters change fast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), reloadKey]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page'); // back to page 1 when a filter changes
    setSearchParams(next);
  };
  const setFilters = (obj) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(obj).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete('page');
    setSearchParams(next);
  };
  const clearFilters = () => setSearchParams(new URLSearchParams());
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  const hasFilters = ['search', 'status', 'priority', 'overdue'].some((k) => query[k]);

  return { ...state, query, setFilter, setFilters, clearFilters, reload, hasFilters };
}
