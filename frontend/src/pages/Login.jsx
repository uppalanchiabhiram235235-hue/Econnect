import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { homePathFor } from '../lib/routes';
import Button from '../components/Button';
import Card from '../components/Card';
import Field, { PasswordInput } from '../components/Field';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = 'Enter your email address.';
    if (!form.password) next.password = 'Enter your password.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(location.state?.from || homePathFor(u), { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="container auth-wrap">
      <Card className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Log in to join events and track your impact.</p>
        <form className="stack" onSubmit={submit} noValidate>
          {formError && <div className="form-error" role="alert">{formError}</div>}
          <Field label="Email" error={errors.email}>
            <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordInput autoComplete="current-password" value={form.password} onChange={set('password')} />
          </Field>
          <Button type="submit" icon={LogIn} loading={pending} block size="lg">Log in</Button>
        </form>
        <p className="muted" style={{ marginTop: 'var(--space-4)' }}>
          New to ECONNECT? <Link to="/register">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
