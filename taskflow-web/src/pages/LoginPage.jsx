import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import AuthShell from '../components/layout/AuthShell';
import Input, { Checkbox, PasswordInput } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { parseApiError } from '../utils/apiErrors';
import usePageTitle from '../utils/usePageTitle';

export default function LoginPage() {
  usePageTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErrors({}); setFormError('');
    try {
      await login({ ...form, email: form.email.trim() });
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search ?? ''}` : '/dashboard', { replace: true });
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      if (!Object.keys(fields).length) { setFormError(message); toast.error(message); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back" subtitle="Log in to manage your tasks."
      footer={<>New to TaskFlow? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-800">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        <Input label="Email" type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordInput label="Password" name="password" autoComplete="current-password" required value={form.password} onChange={set('password')} error={errors.password} />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={form.remember} onChange={set('remember')} />
          <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={saving} loadingText="Logging in…">Log in</Button>
      </form>
    </AuthShell>
  );
}
