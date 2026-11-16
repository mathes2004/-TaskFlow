import { Logo } from './Navbar';
import { USE_MOCK } from '../../api/client';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>}
        {USE_MOCK && (
          <p className="mt-6 rounded-lg bg-indigo-50 px-4 py-3 text-center text-xs text-indigo-900">
            Demo mode: data is stored in this browser only.<br />
            Try <strong>alice@example.com</strong> / <strong>Password123</strong> or register a new account.
          </p>
        )}
      </div>
    </div>
  );
}
