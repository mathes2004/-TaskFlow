import { useId } from 'react';
import { Field } from './Input';

export default function Select({ label, error, hint, options, placeholder, className = '', ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select
        id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'} ${className}`}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}
