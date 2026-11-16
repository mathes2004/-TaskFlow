import { useEffect, useState } from 'react';
import Select from '../ui/Select';
import Button from '../ui/Button';
import useDebounce from '../../hooks/useDebounce';
import { PRIORITIES, STATUSES } from '../../utils/labels';

const SORTS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'due_date:asc', label: 'Due date (soonest)' },
  { value: 'due_date:desc', label: 'Due date (latest)' },
  { value: 'priority:desc', label: 'Priority (high first)' },
  { value: 'priority:asc', label: 'Priority (low first)' },
  { value: 'title:asc', label: 'Title A–Z' },
  { value: 'title:desc', label: 'Title Z–A' },
];

export default function TaskFilters({ query, setFilter, setFilters, clearFilters, hasFilters }) {
  const [search, setSearch] = useState(query.search ?? '');
  const debounced = useDebounce(search, 300);

  // typing -> URL (debounced 300 ms)
  useEffect(() => {
    if (debounced !== (query.search ?? '')) setFilter('search', debounced.trim() ? debounced : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  // URL -> input (Back button, "Clear filters")
  useEffect(() => { setSearch(query.search ?? ''); }, [query.search]);

  const sortValue = `${query.sort ?? 'created_at'}:${query.direction ?? 'desc'}`;
  const onSort = (e) => {
    const [sort, direction] = e.target.value.split(':');
    setFilters({ sort: sort === 'created_at' && direction === 'desc' ? '' : sort, direction: sort === 'created_at' && direction === 'desc' ? '' : direction });
  };

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="task-search" className="mb-1 block text-sm font-medium text-slate-700">Search</label>
          <input
            id="task-search" type="search" value={search} maxLength={100} placeholder="Search by title…"
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <Select label="Status" placeholder="All statuses" options={STATUSES} value={query.status ?? ''} onChange={(e) => setFilter('status', e.target.value)} />
        <Select label="Priority" placeholder="All priorities" options={PRIORITIES} value={query.priority ?? ''} onChange={(e) => setFilter('priority', e.target.value)} />
        <Select label="Sort by" options={SORTS} value={sortValue} onChange={onSort} />
        <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-1">
          <label className="inline-flex cursor-pointer items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox" checked={query.overdue === '1'} onChange={(e) => setFilter('overdue', e.target.checked ? '1' : '')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Overdue only
          </label>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="mb-1">Clear filters</Button>}
        </div>
      </div>
    </form>
  );
}
