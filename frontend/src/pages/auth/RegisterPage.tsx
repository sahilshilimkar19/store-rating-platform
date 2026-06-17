import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../../api/auth.api';
import { FormField } from '../../components/FormField';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dashboardPath } from '../../utils/roles';
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validators';

export function RegisterPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { execute, loading, error } = useApi(registerApi);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  // Already logged in? Send them to their dashboard.
  if (isAuthenticated && user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    address: validateAddress(address),
  };
  const isInvalid = Object.values(errors).some((e) => e !== null);

  const showError = (field: keyof typeof errors) =>
    submitted || touched[field] ? errors[field] : null;

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (isInvalid) return;
    try {
      await execute({
        name: name.trim(),
        email: email.trim(),
        password,
        address: address.trim() || undefined,
      });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch {
      // error surfaced via useApi `error` below
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="animate-card-rise w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-card">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">Sign up as a normal user</p>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Full name"
            name="name"
            value={name}
            onChange={setName}
            onBlur={() => markTouched('name')}
            placeholder="At least 20 characters"
            error={showError('name')}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            onBlur={() => markTouched('email')}
            autoComplete="email"
            error={showError('email')}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            onBlur={() => markTouched('password')}
            autoComplete="new-password"
            placeholder="8-16 chars, 1 uppercase & 1 special"
            error={showError('password')}
          />
          <FormField
            label="Address (optional)"
            name="address"
            value={address}
            onChange={setAddress}
            onBlur={() => markTouched('address')}
            multiline
            error={showError('address')}
          />

          <button
            type="submit"
            disabled={isInvalid || loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
