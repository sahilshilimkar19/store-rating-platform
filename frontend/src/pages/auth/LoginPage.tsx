import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../../api/auth.api';
import { FormField } from '../../components/FormField';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dashboardPath } from '../../utils/roles';
import {
  validateEmail,
  validateRequiredPassword,
} from '../../utils/validators';

export function LoginPage() {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { execute, loading, error } = useApi(loginApi);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Already logged in? Send them to their dashboard.
  if (isAuthenticated && user) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }

  const emailError = validateEmail(email);
  const passwordError = validateRequiredPassword(password);
  const isInvalid = !!emailError || !!passwordError;
  const justRegistered = (location.state as { registered?: boolean } | null)
    ?.registered;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (isInvalid) return;
    try {
      const res = await execute({ email: email.trim(), password });
      login(res.accessToken, res.user);
      navigate(dashboardPath(res.user.role), { replace: true });
    } catch {
      // error is surfaced via the useApi `error` state below
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4 py-12">
      <div className="animate-card-rise w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-card">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">Store Rating Platform</p>
        </div>

        {justRegistered ? (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            Registration successful. Please sign in.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            error={submitted ? emailError : null}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={submitted ? passwordError : null}
          />

          <button
            type="submit"
            disabled={isInvalid || loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          No account?{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
