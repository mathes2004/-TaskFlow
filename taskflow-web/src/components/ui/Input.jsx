import { forwardRef, useId, useState } from 'react';

const base =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100';
const ok = 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200';
const bad = 'border-red-500 focus:border-red-500 focus:ring-red-200';

export function Field({ id, label, error, hint, required, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-600" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const describe = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

const Input = forwardRef(function Input({ label, error, hint, required, className = '', ...rest }, ref) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <input
        ref={ref} id={id} required={required} aria-invalid={!!error}
        aria-describedby={describe(id, error, hint)}
        className={`${base} ${error ? bad : ok} ${className}`} {...rest}
      />
    </Field>
  );
});
export default Input;

export function Textarea({ label, error, hint, required, className = '', ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id} required={required} aria-invalid={!!error} aria-describedby={describe(id, error, hint)}
        className={`${base} ${error ? bad : ok} ${className}`} {...rest}
      />
    </Field>
  );
}

export function PasswordInput({ label, error, hint, required, ...rest }) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        <input
          id={id} required={required} type={show ? 'text' : 'password'} aria-invalid={!!error}
          aria-describedby={describe(id, error, hint)} className={`${base} pr-16 ${error ? bad : ok}`} {...rest}
        />
        <button
          type="button" onClick={() => setShow((s) => !s)} aria-pressed={show}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </Field>
  );
}

export function Checkbox({ label, ...rest }) {
  const id = useId();
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input id={id} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" {...rest} />
      {label}
    </label>
  );
}

export function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Za-z]/.test(password) && /\d/.test(password), password.length >= 12, /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600'];
  return (
    <div className="-mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs text-slate-600">Password strength: {labels[score]}. Use 8+ characters with letters and numbers.</p>
    </div>
  );
}
