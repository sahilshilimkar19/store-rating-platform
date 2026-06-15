import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, type UserDetail } from '../../api/users.api';
import { AdminLayout } from '../../components/AdminLayout';
import { getErrorMessage } from '../../utils/errors';
import { formatRating, formatRole } from '../../utils/formatters';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b border-gray-100 py-3 sm:flex-row">
      <span className="w-48 text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    getUser(id)
      .then((u) => active && setUser(u))
      .catch((e) => active && setError(getErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <AdminLayout>
      <button
        onClick={() => navigate('/admin/users')}
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Back to users
      </button>

      <h2 className="mt-3 text-xl font-bold text-gray-900">User Detail</h2>

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading…</p>
      ) : user ? (
        <div className="mt-4 max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
          <DetailRow label="Name" value={user.name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Address" value={user.address || '—'} />
          <DetailRow label="Role" value={formatRole(user.role)} />
          {user.role === 'store_owner' ? (
            <DetailRow
              label="Store Average Rating"
              value={formatRating(user.avgRating)}
            />
          ) : null}
        </div>
      ) : null}
    </AdminLayout>
  );
}
