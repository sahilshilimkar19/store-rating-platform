import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listUsers,
  type PaginatedUsers,
  type UserListItem,
} from '../../api/users.api';
import { AddUserModal } from '../../components/AddUserModal';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';
import {
  SortableTable,
  type Column,
  type SortOrder,
} from '../../components/SortableTable';
import { useDebounce } from '../../hooks/useDebounce';
import type { Role } from '../../types';
import { getErrorMessage } from '../../utils/errors';
import { formatRole } from '../../utils/formatters';
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from '../../utils/formatRelativeTime';

export function AdminUsersPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debName = useDebounce(name);
  const debEmail = useDebounce(email);
  const debAddress = useDebounce(address);
  const hasFilters = !!(debName || debEmail || debAddress || role !== 'all');

  const [result, setResult] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset to first page whenever filters, sort, or page size change.
  useEffect(() => {
    setPage(1);
  }, [debName, debEmail, debAddress, role, sortBy, sortOrder, limit]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listUsers({
      name: debName,
      email: debEmail,
      address: debAddress,
      role: role === 'all' ? undefined : role,
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
  }, [debName, debEmail, debAddress, role, sortBy, sortOrder, page, limit, refreshKey]);

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const columns: Column<UserListItem>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (u) => u.address || '—',
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => formatRole(u.role),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u) => (
        <span title={formatAbsoluteTime(u.createdAt)} className="text-gray-500">
          {formatRelativeTime(u.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <button
          onClick={() => navigate(`/admin/users/${u.id}`)}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add User
        </button>
      </div>

      {/* Filter bar */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <FilterInput placeholder="Filter by name" value={name} onChange={setName} />
        <FilterInput placeholder="Filter by email" value={email} onChange={setEmail} />
        <FilterInput
          placeholder="Filter by address"
          value={address}
          onChange={setAddress}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'all' | Role)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All roles</option>
          <option value="admin">System Administrator</option>
          <option value="normal">Normal User</option>
          <option value="store_owner">Store Owner</option>
        </select>
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
          rowKey={(u) => u.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          loading={loading}
          emptyTitle={hasFilters ? 'No users match your filters' : 'No users found'}
          emptySubtitle={
            hasFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Add your first user to get started.'
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

      <AddUserModal
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
