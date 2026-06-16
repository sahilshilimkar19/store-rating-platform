import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listAdminStores,
  type AdminStoreItem,
  type Paginated,
} from '../../api/stores.api';
import { AddStoreModal } from '../../components/AddStoreModal';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import {
  SortableTable,
  type Column,
  type SortOrder,
} from '../../components/SortableTable';
import { RatingValue } from '../../components/Stars';
import { useDebounce } from '../../hooks/useDebounce';
import { getErrorMessage } from '../../utils/errors';
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from '../../utils/formatRelativeTime';

export function AdminStoresPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debName = useDebounce(name);
  const debEmail = useDebounce(email);
  const debAddress = useDebounce(address);
  const hasFilters = !!(debName || debEmail || debAddress);

  const [result, setResult] = useState<Paginated<AdminStoreItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset to first page whenever filters, sort, or page size change.
  useEffect(() => {
    setPage(1);
  }, [debName, debEmail, debAddress, sortBy, sortOrder, limit]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listAdminStores({
      name: debName,
      email: debEmail,
      address: debAddress,
      sortBy,
      sortOrder,
      page,
      limit,
    })
      .then((res) => active && setResult(res))
      .catch((e) => active && setError(getErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [debName, debEmail, debAddress, sortBy, sortOrder, page, limit, refreshKey]);

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const columns: Column<AdminStoreItem>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (s) => s.address || '—',
    },
    {
      key: 'rating',
      header: 'Rating',
      sortable: true,
      render: (s) => <RatingValue value={s.overall_rating} />,
    },
    {
      key: 'created_at',
      header: 'Added',
      render: (s) => (
        <span title={formatAbsoluteTime(s.created_at)} className="text-gray-500">
          {formatRelativeTime(s.created_at)}
        </span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      // Link through to the store owner's detail page (incl. their rating).
      render: (s) =>
        s.owner_id ? (
          <Link
            to={`/admin/users/${s.owner_id}`}
            className="font-medium text-indigo-600 hover:underline"
          >
            {s.owner_name ?? 'View owner'}
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Stores</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add Store
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterInput placeholder="Filter by name" value={name} onChange={setName} />
        <FilterInput placeholder="Filter by email" value={email} onChange={setEmail} />
        <FilterInput
          placeholder="Filter by address"
          value={address}
          onChange={setAddress}
        />
      </div>

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
          emptyTitle={hasFilters ? 'No stores match your filters' : 'No stores yet'}
          emptySubtitle={
            hasFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Create one to start collecting ratings.'
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

      <AddStoreModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </AdminLayout>
  );
}

function FilterInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}
