import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/layout/AuthShell';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { forgotPassword } from '../api/auth';
import { parseApiError } from '../utils/apiErrors';
import usePageTitle from '../utils/usePageTitle';

export default function ForgotPasswordPage() {
  usePageTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setErrors({}); setFormError('');
    try {
      await forgotPassword(email.trim());
      setSent(true); // same message whether or not the account exists
    } catch (err) {
      const { message, fields } = parseApiError(err);
      setErrors(fields);
      if (!Object.keys(fields).length) setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?" subtitle="Enter your email and we will send you a reset link."
      footer={<Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">Back to log in</Link>}
    >
      {sent ? (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          If that email exists, a link has been sent. The link expires in 60 minutes.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          <Input label="Email" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Button type="submit" className="w-full" loading={saving} loadingText="Sending…">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
