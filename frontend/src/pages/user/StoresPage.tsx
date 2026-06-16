import { useEffect, useMemo, useState } from 'react';
import { listStores, type UserStoreItem } from '../../api/stores.api';
import { RatingModal } from '../../components/RatingModal';
import {
  SortableTable,
  type Column,
  type SortOrder,
} from '../../components/SortableTable';
import { RatingValue } from '../../components/Stars';
import { UserLayout } from '../../components/UserLayout';
import { getErrorMessage } from '../../utils/errors';

type SortKey = 'name' | 'address' | 'overall_rating' | 'user_rating';

function sortStores(
  list: UserStoreItem[],
  sortBy: SortKey,
  order: SortOrder,
): UserStoreItem[] {
  const dir = order === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls always last
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export function StoresPage() {
  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selected, setSelected] = useState<UserStoreItem | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listStores()
      .then(setStores)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Search by Name OR Address (client-side), then sort.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? stores.filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            (s.address ?? '').toLowerCase().includes(term),
        )
      : stores;
    return sortStores(filtered, sortBy, sortOrder);
  }, [stores, search, sortBy, sortOrder]);

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
      render: (s) =>
        s.user_rating != null ? (
          <span className="text-gray-900">
            <span className="font-semibold">{s.user_rating}</span> / 5
          </span>
        ) : (
          <span className="text-gray-500">Not rated</span>
        ),
    },
    {
      key: 'action',
      header: '',
      render: (s) => (
        <button
          onClick={() => setSelected(s)}
          className={`rounded-md px-3 py-1 text-xs font-semibold ${
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
          data={visible}
          rowKey={(s) => s.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage={loading ? 'Loading…' : 'No stores found'}
        />
      </div>

      <RatingModal
        store={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </UserLayout>
  );
}
