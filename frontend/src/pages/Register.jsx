import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HandHeart, CalendarPlus, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { homePathFor } from '../lib/routes';
import Button from '../components/Button';
import Card from '../components/Card';
import Field, { PasswordInput } from '../components/Field';

const ROLES = [
  { value: 'VOLUNTEER', label: 'Volunteer', hint: 'Find and join events', icon: HandHeart },
  { value: 'ORGANIZER', label: 'Organizer', hint: 'Create and run events', icon: CalendarPlus },
];

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Enter your full name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
  if (f.password.length < 6) e.password = 'Use at least 6 characters.';
  return e;
}

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: '', role: 'VOLUNTEER' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setPending(true);
    try {
      const u = await register(form);
      toast.success('Account created. Welcome to ECONNECT!');
      navigate(homePathFor(u), { replace: true });
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
        <h1>Join ECONNECT</h1>
        <p className="muted">Create an account to start making a measurable difference.</p>
        <form className="stack" onSubmit={submit} noValidate>
          {formError && <div className="form-error" role="alert">{formError}</div>}

          <div role="radiogroup" aria-label="I want to join as" className="choice-cards">
            {ROLES.map(({ value, label, hint, icon: Icon }) => (
              <button key={value} type="button" role="radio" aria-checked={form.role === value} className="choice-card"
                onClick={() => setForm((f) => ({ ...f, role: value }))}>
                <strong><Icon size={18} aria-hidden="true" /> {label}</strong>
                <span>{hint}</span>
              </button>
            ))}
          </div>

          <Field label="Full name" error={errors.name}>
            <input className="input" autoComplete="name" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email" error={errors.email}>
            <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" hint="At least 6 characters." error={errors.password}>
            <PasswordInput autoComplete="new-password" value={form.password} onChange={set('password')} />
          </Field>
          <div className="form-grid">
            <Field label="Phone (optional)" error={errors.phone}>
              <input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Location (optional)" error={errors.location}>
              <input className="input" autoComplete="address-level2" value={form.location} onChange={set('location')} />
            </Field>
          </div>
          <Button type="submit" icon={UserPlus} loading={pending} block size="lg">Create account</Button>
        </form>
        <p className="muted" style={{ marginTop: 'var(--space-4)' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
