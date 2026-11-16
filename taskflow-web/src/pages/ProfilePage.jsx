import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteAccount, updatePassword, updateProfile } from '../api/profile';
import { useToast } from '../components/ui/Toast';
import Input, { PasswordInput, PasswordStrength } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { parseApiError } from '../utils/apiErrors';
import { timezoneList } from '../utils/labels';
import usePageTitle from '../utils/usePageTitle';

function Card({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const zones = useMemo(() => timezoneList().map((z) => ({ value: z, label: z.replace(/_/g, ' ') })), []);
  const [form, setForm] = useState({ name: user.name, email: user.email, timezone: user.timezone });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const updated = await updateProfile({ ...form, name: form.name.trim(), email: form.email.trim() });
      setUser(updated);
      toast.success('Profile updated.');
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields); toast.error(message);
    } finally { setSaving(false); }
  }

  return (
    <Card title="Profile" description="Your name, email and timezone. The timezone decides what “today” means for due dates and overdue tasks.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Input label="Name" name="name" required value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Email" type="email" name="email" required value={form.email} onChange={set('email')} error={errors.email} />
        <Select label="Timezone" name="timezone" options={zones} value={form.timezone} onChange={set('timezone')} error={errors.timezone} />
        <div className="flex justify-end"><Button type="submit" loading={saving} loadingText="Saving…">Save profile</Button></div>
      </form>
    </Card>
  );
}

const EMPTY_PW = { current_password: '', password: '', password_confirmation: '' };
function PasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_PW);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      await updatePassword(form);
      setForm(EMPTY_PW);
      toast.success('Password changed. Your other sessions were signed out.');
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields); toast.error(message);
    } finally { setSaving(false); }
  }

  return (
    <Card title="Change password" description="You need your current password. Other devices will be signed out.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <PasswordInput label="Current password" name="current_password" autoComplete="current-password" required value={form.current_password} onChange={set('current_password')} error={errors.current_password} />
        <PasswordInput label="New password" name="password" autoComplete="new-password" required value={form.password} onChange={set('password')} error={errors.password} />
        <PasswordStrength password={form.password} />
        <PasswordInput label="Confirm new password" name="password_confirmation" autoComplete="new-password" required value={form.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation} />
        <div className="flex justify-end"><Button type="submit" loading={saving} loadingText="Updating…">Update password</Button></div>
      </form>
    </Card>
  );
}

function DangerZone() {
  const { logout, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    try { await logout(); } catch { /* state already cleared */ }
    toast.info('You have been logged out.');
    navigate('/login', { replace: true });
  }

  async function handleDelete(e) {
    e?.preventDefault();
    setBusy(true); setError('');
    try {
      await deleteAccount({ password });
      setUser(null);
      toast.success('Your account and all its tasks were deleted.');
      navigate('/login', { replace: true });
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setError(fields.password ?? message);
    } finally { setBusy(false); }
  }

  const close = () => { if (!busy) { setOpen(false); setPassword(''); setError(''); } };

  return (
    <Card title="Session & account">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-medium text-slate-900">Log out</p><p className="text-sm text-slate-600">End your session on this device.</p></div>
        <Button variant="secondary" onClick={handleLogout}>Log out</Button>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div><p className="font-medium text-red-700">Delete account</p><p className="text-sm text-slate-600">Permanently removes your account and every task.</p></div>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete account</Button>
      </div>
      <Modal
        open={open} onClose={close} title="Delete your account?"
        footer={<><Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button><Button variant="danger" onClick={handleDelete} loading={busy} loadingText="Deleting…" disabled={!password}>Delete forever</Button></>}
      >
        <form onSubmit={handleDelete} className="space-y-3">
          <p>This cannot be undone. Enter your password to confirm.</p>
          <PasswordInput label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        </form>
      </Modal>
    </Card>
  );
}

export default function ProfilePage() {
  usePageTitle('Profile');
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <ProfileForm />
      <PasswordForm />
      <DangerZone />
    </div>
  );
}
