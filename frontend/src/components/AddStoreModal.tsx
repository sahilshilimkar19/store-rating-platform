import { useEffect, useState, type FormEvent } from 'react';
import { createStore } from '../api/stores.api';
import { listStoreOwners, type StoreOwnerOption } from '../api/users.api';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import {
  validateAddress,
  validateEmail,
  validateStoreName,
} from '../utils/validators';
import { FormField } from './FormField';
import { Modal } from './Modal';
import { SelectField } from './SelectField';

interface AddStoreModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddStoreModal({ open, onClose, onCreated }: AddStoreModalProps) {
  const { execute, loading, error, clearError } = useApi(createStore);
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<StoreOwnerOption[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Load the store-owner options when the modal opens.
  useEffect(() => {
    if (!open) return;
    let active = true;
    listStoreOwners()
      .then((data) => {
        if (active) setOwners(data);
      })
      .catch(() => {
        if (active) setOwners([]);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const errors = {
    name: validateStoreName(name),
    email: validateEmail(email),
    address: validateAddress(address),
  };
  const isInvalid = Object.values(errors).some((e) => e !== null);

  const reset = () => {
    setName('');
    setEmail('');
    setAddress('');
    setOwnerId('');
    setSubmitted(false);
    clearError();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const ownerOptions = [
    { value: '', label: '— No owner —' },
    ...owners.map((o) => ({ value: o.id, label: `${o.name} (${o.email})` })),
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (isInvalid) return;
    try {
      await execute({
        name: name.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
        owner_id: ownerId || undefined,
      });
      reset();
      toast.success('Store created');
      onCreated();
      onClose();
    } catch {
      // error surfaced below
    }
  };

  return (
    <Modal open={open} title="Add Store" onClose={handleClose}>
      {error ? (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <FormField
          label="Name"
          name="storeName"
          value={name}
          onChange={setName}
          placeholder="Up to 60 characters"
          error={submitted ? errors.name : null}
        />
        <FormField
          label="Email"
          name="storeEmail"
          type="email"
          value={email}
          onChange={setEmail}
          error={submitted ? errors.email : null}
        />
        <FormField
          label="Address (optional)"
          name="storeAddress"
          value={address}
          onChange={setAddress}
          multiline
          error={submitted ? errors.address : null}
        />
        <SelectField
          label="Owner (optional)"
          name="ownerId"
          value={ownerId}
          onChange={setOwnerId}
          options={ownerOptions}
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
            {loading ? 'Creating…' : 'Create Store'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
