import { useEffect, useState } from 'react';
import { submitRating, updateRating } from '../../api/ratings.api';
import {
  listStores,
  type Paginated,
  type UserStoreItem,
} from '../../api/stores.api';
import { Pagination } from '../../components/Pagination';
import { RatingModal } from '../../components/RatingModal';
import {
  SortableTable,
  type Column,
  type SortOrder,
} from '../../components/SortableTable';
import { RatingValue } from '../../components/Stars';
import { UserLayout } from '../../components/UserLayout';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../utils/errors';

type SortKey = 'name' | 'address' | 'overall_rating' | 'user_rating';

/** Small inline spinner shown on a row while its rating saves. */
function RowSpinner() {
  return (
    <svg
      className="animate-spin text-indigo-500"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Saving"
    >
      <circle cx="12" cy="12" r="9" stroke="#E5E7EB" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StoresPage() {
  const toast = useToast();
  const [result, setResult] = useState<Paginated<UserStoreItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<UserStoreItem | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const debSearch = useDebounce(search);

  // Reset to the first page whenever the search, sort, or page size changes.
  useEffect(() => {
    setPage(1);
  }, [debSearch, sortBy, sortOrder, limit]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listStores({ search: debSearch, sortBy, sortOrder, page, limit })
      .then((res) => active && setResult(res))
      .catch((e) => active && setError(getErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debSearch, sortBy, sortOrder, page, limit]);

  const patchRow = (id: string, partial: Partial<UserStoreItem>) =>
    setResult((r) =>
      r
        ? {
            ...r,
            data: r.data.map((s) => (s.id === id ? { ...s, ...partial } : s)),
          }
        : r,
    );

  // Silent refresh (no skeleton) to reconcile the store's overall_rating.
  const silentReload = () => {
    listStores({ search: debSearch, sortBy, sortOrder, page, limit })
      .then((res) => setResult(res))
      .catch(() => {
        /* keep optimistic state on a refresh failure */
      });
  };

  /** Optimistically apply the rating, then persist; revert + toast on failure. */
  const handleRate = async (store: UserStoreItem, value: number) => {
    const snapshot = {
      user_rating: store.user_rating,
      user_rating_id: store.user_rating_id,
    };
    const isUpdate = !!store.user_rating_id;

    patchRow(store.id, { user_rating: value });
    setSavingIds((prev) => new Set(prev).add(store.id));
    setSelected(null);

    try {
      const saved =
        isUpdate && store.user_rating_id
          ? await updateRating(store.user_rating_id, value)
          : await submitRating({ store_id: store.id, value });
      patchRow(store.id, { user_rating: value, user_rating_id: saved.id });
      toast.success(isUpdate ? 'Rating updated' : 'Rating submitted');
      silentReload();
    } catch (e) {
      patchRow(store.id, snapshot);
      toast.error(getErrorMessage(e));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(store.id);
        return next;
      });
    }
  };

  const handleSort = (key: string) => {
    const k = key as SortKey;
    if (k === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(k);
      setSortOrder('asc');
    }
  };

  const columns: Column<UserStoreItem>[] = [
    { key: 'name', header: 'Store Name', sortable: true },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (s) => s.address || '—',
    },
    {
      key: 'overall_rating',
      header: 'Overall Rating',
      sortable: true,
      render: (s) => <RatingValue value={s.overall_rating} />,
    },
    {
      key: 'user_rating',
      header: 'My Rating',
      sortable: true,
      render: (s) => (
        <span className="inline-flex items-center gap-2">
          {s.user_rating != null ? (
            <span className="text-gray-900">
              <span className="font-semibold">{s.user_rating}</span> / 5
            </span>
          ) : (
            <span className="text-gray-500">Not rated</span>
          )}
          {savingIds.has(s.id) ? <RowSpinner /> : null}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (s) => (
        <button
          onClick={() => setSelected(s)}
          disabled={savingIds.has(s.id)}
          className={`rounded-md px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
            s.user_rating != null
              ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {s.user_rating != null ? 'Edit Rating' : 'Rate'}
        </button>
      ),
    },
  ];

  return (
    <UserLayout>
      <h2 className="text-xl font-bold text-gray-900">Stores</h2>

      <input
        type="text"
        placeholder="Search by name or address…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4">
        <SortableTable
          columns={columns}
          data={result?.data ?? []}
          rowKey={(s) => s.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          loading={loading}
          emptyTitle={
            debSearch ? 'No stores match your search' : 'No stores found'
          }
          emptySubtitle={
            debSearch ? 'Try a different name or address.' : undefined
          }
        />
      </div>

      <Pagination
        page={result?.page ?? 1}
        totalPages={result?.totalPages ?? 1}
        total={result?.total ?? 0}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      <RatingModal
        store={selected}
        onClose={() => setSelected(null)}
        onSubmit={(value) => {
          if (selected) void handleRate(selected, value);
        }}
      />
    </UserLayout>
  );
}
