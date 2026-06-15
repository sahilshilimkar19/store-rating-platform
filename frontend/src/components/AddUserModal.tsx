import { useState, type FormEvent } from 'react';
import { createUser } from '../api/users.api';
import type { Role } from '../types';
import { useApi } from '../hooks/useApi';
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validators';
import { FormField } from './FormField';
import { Modal } from './Modal';
import { SelectField } from './SelectField';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS = [
  { value: 'normal', label: 'Normal User' },
  { value: 'admin', label: 'System Administrator' },
  { value: 'store_owner', label: 'Store Owner' },
];

export function AddUserModal({ open, onClose, onCreated }: AddUserModalProps) {
  const { execute, loading, error, clearError } = useApi(createUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<Role>('normal');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    address: validateAddress(address),
  };
  const isInvalid = Object.values(errors).some((e) => e !== null);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setAddress('');
    setRole('normal');
    setSubmitted(false);
    clearError();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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
        role,
      });
      reset();
      onCreated();
      onClose();
    } catch {
      // error surfaced below
    }
  };

  return (
    <Modal open={open} title="Add User" onClose={handleClose}>
      {error ? (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <FormField
          label="Name"
          name="name"
          value={name}
          onChange={setName}
          placeholder="At least 20 characters"
          error={submitted ? errors.name : null}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          error={submitted ? errors.email : null}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="8-16 chars, 1 uppercase & 1 special"
          error={submitted ? errors.password : null}
        />
        <FormField
          label="Address (optional)"
          name="address"
          value={address}
          onChange={setAddress}
          multiline
          error={submitted ? errors.address : null}
        />
        <SelectField
          label="Role"
          name="role"
          value={role}
          onChange={(v) => setRole(v as Role)}
          options={ROLE_OPTIONS}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isInvalid || loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
