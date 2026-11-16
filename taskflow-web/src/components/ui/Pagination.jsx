export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null;
  const { current_page: page, last_page: last, total, per_page: perPage } = meta;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pages = [];
  for (let p = 1; p <= last; p++) {
    if (p === 1 || p === last || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = 'min-w-9 rounded-lg px-3 py-1.5 text-sm font-medium';

  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-600">Showing {from}–{to} of {total}</p>
      <ul className="flex flex-wrap items-center gap-1">
        <li><button disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40`}>Previous</button></li>
        {pages.map((p, i) => (
          <li key={`${p}-${i}`}>
            {p === '…' ? <span className="px-2 text-slate-400">…</span> : (
              <button onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined} className={`${btn} ${p === page ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{p}</button>
            )}
          </li>
        ))}
        <li><button disabled={page >= last} onClick={() => onPage(page + 1)} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40`}>Next</button></li>
      </ul>
    </nav>
  );
}
