import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import AuthShell from '../components/layout/AuthShell';
import Input, { PasswordInput, PasswordStrength } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { parseApiError } from '../utils/apiErrors';
import usePageTitle from '../utils/usePageTitle';

export default function RegisterPage() {
  usePageTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success('Welcome to TaskFlow! Your account is ready.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell
      title="Create your account" subtitle="Start organising your tasks in under a minute."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input label="Name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" name="email" autoComplete="email" required value={form.email} onChange={set('email')} error={errors.email} />
        <PasswordInput label="Password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordStrength password={form.password} />
        <PasswordInput label="Confirm password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
        <Button type="submit" className="w-full" loading={saving} loadingText="Creating account…">Create account</Button>
      </form>
    </AuthShell>
  );
}
