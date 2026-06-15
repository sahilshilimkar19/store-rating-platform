import { useEffect, useState } from 'react';
import { submitRating, updateRating } from '../api/ratings.api';
import type { UserStoreItem } from '../api/stores.api';
import { useApi } from '../hooks/useApi';
import { getErrorMessage } from '../utils/errors';
import { Modal } from './Modal';

interface RatingModalProps {
  store: UserStoreItem | null;
  onClose: () => void;
  onSaved: () => void;
}

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2 py-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`text-3xl leading-none ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function RatingModal({ store, onClose, onSaved }: RatingModalProps) {
  const submit = useApi(submitRating);
  const update = useApi(updateRating);
  const [value, setValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isUpdate = !!store?.user_rating_id;

  // Pre-fill with the existing rating (or 0) whenever the target store changes.
  useEffect(() => {
    setValue(store?.user_rating ?? 0);
    setError(null);
  }, [store]);

  if (!store) return null;

  const loading = submit.loading || update.loading;

  const handleSubmit = async () => {
    if (value < 1) return;
    setError(null);
    try {
      if (isUpdate && store.user_rating_id) {
        await update.execute(store.user_rating_id, value);
      } else {
        await submit.execute({ store_id: store.id, value });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      open={!!store}
      title={isUpdate ? `Update Rating for ${store.name}` : `Rate ${store.name}`}
      onClose={onClose}
    >
      {error ? (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <p className="text-center text-sm text-gray-500">
        Select a rating from 1 to 5
      </p>
      <StarSelector value={value} onChange={setValue} />
      <p className="text-center text-sm font-medium text-gray-700">
        {value > 0 ? `${value} / 5` : 'No rating selected'}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value < 1 || loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving…' : isUpdate ? 'Update Rating' : 'Submit Rating'}
        </button>
      </div>
    </Modal>
  );
}
