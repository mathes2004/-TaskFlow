export default function Spinner({ fullPage = false, label = 'Loading…' }) {
  const spinner = (
    <div role="status" className="flex flex-col items-center gap-3 text-slate-500">
      <svg className="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  );
  return fullPage ? <div className="flex min-h-screen items-center justify-center">{spinner}</div> : <div className="flex justify-center py-12">{spinner}</div>;
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} aria-hidden="true" />;
}
