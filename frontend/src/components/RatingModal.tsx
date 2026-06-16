import { useEffect, useState, type KeyboardEvent } from 'react';
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

const STAR_PATH =
  'M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.77l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z';

/** SVG star selector with hover preview, exposed as an accessible radiogroup. */
function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className="flex justify-center gap-2 py-2"
      onMouseLeave={() => setHover(0)}
      onKeyDown={handleKey}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= shown;
        // Roving tabindex: the selected star is tabbable (or the first if none).
        const tabbable = value === star || (value === 0 && star === 1);
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            tabIndex={tabbable ? 0 : -1}
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange(star)}
            className="rounded p-0.5"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill={filled ? '#F59E0B' : 'none'}
              stroke={filled ? '#F59E0B' : '#E5E7EB'}
              strokeWidth={filled ? 0 : 1.5}
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={STAR_PATH} />
            </svg>
          </button>
        );
      })}
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
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={value < 1 || loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving…' : isUpdate ? 'Update Rating' : 'Submit Rating'}
        </button>
      </div>
    </Modal>
  );
}
