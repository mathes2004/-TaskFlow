export default function EmptyState({ title, message, action, icon = '📋' }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-3 text-4xl" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <div className="mb-2 text-3xl" aria-hidden="true">⚠️</div>
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 ring-1 ring-red-300 hover:bg-red-100">
          Try again
        </button>
      )}
    </div>
  );
}
