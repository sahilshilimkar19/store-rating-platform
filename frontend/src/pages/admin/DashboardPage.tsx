import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStats, type AdminStats } from '../../api/admin.api';
import { AdminLayout } from '../../components/AdminLayout';
import { getErrorMessage } from '../../utils/errors';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStats()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(getErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout>
      <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading || !stats ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <StatCard label="Total Users" value={stats.total_users} />
            <StatCard label="Total Stores" value={stats.total_stores} />
            <StatCard label="Total Ratings" value={stats.total_ratings} />
          </>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to="/admin/users"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Manage Users
        </Link>
        <Link
          to="/admin/stores"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Manage Stores
        </Link>
      </div>
    </AdminLayout>
  );
}
