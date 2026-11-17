import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell';
import { PasswordInput, PasswordStrength } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { resetPassword } from '../api/auth';
import { parseApiError } from '../utils/apiErrors';
import usePageTitle from '../utils/usePageTitle';

export default function ResetPasswordPage() {
  usePageTitle('Reset password');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      await resetPassword({ token, email, ...form });
      toast.success('Password reset. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell
      title="Choose a new password" subtitle={email}
      footer={<Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">Back to log in</Link>}
    >
      {!token || !email ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          This reset link is invalid. <Link to="/forgot-password" className="underline">Request a new one</Link>.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.email && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.email}</p>}
          <PasswordInput label="New password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} error={errors.password} />
          <PasswordStrength password={form.password} />
          <PasswordInput label="Confirm password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
          <Button type="submit" className="w-full" loading={saving} loadingText="Saving…">Reset password</Button>
        </form>
      )}
    </AuthShell>
  );
}
