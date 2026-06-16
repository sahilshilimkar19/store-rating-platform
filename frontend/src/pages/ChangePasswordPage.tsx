import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/auth.api';
import { FormField } from '../components/FormField';
import { Layout } from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import {
  validatePassword,
  validateRequiredPassword,
} from '../utils/validators';

/**
 * Shared change-password page. The role-aware Layout/Navbar means this works
 * unchanged for both Normal Users (/profile) and Store Owners
 * (/owner/change-password).
 */
export function ChangePasswordPage() {
  const { execute, loading, error } = useApi(changePassword);
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    current: validateRequiredPassword(current),
    next: validatePassword(next),
    confirm:
      confirm !== next
        ? 'Passwords do not match'
        : validateRequiredPassword(confirm),
  };
  const isInvalid = Object.values(errors).some((e) => e !== null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (isInvalid) return;
    try {
      await execute({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      setSubmitted(false);
      toast.success('Password updated successfully');
    } catch {
      // error surfaced below
    }
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-900">Change Password</h2>

      <form
        onSubmit={handleSubmit}
        className="mt-4 max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-6"
        noValidate
      >
        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <FormField
          label="Current Password"
          name="currentPassword"
          type="password"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
          error={submitted ? errors.current : null}
        />
        <FormField
          label="New Password"
          name="newPassword"
          type="password"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          placeholder="8-16 chars, 1 uppercase & 1 special"
          error={submitted ? errors.next : null}
        />
        <FormField
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={submitted ? errors.confirm : null}
        />

        <button
          type="submit"
          disabled={isInvalid || loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </Layout>
  );
}
