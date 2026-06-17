import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAnalytics,
  type AdminAnalytics,
  type ActivityEvent,
} from '../../api/admin.api';
import { AdminLayout } from '../../components/AdminLayout';
import { RatingBars } from '../../components/RatingBars';
import { RatingValue } from '../../components/Stars';
import { getErrorMessage } from '../../utils/errors';
import {
  formatAbsoluteTime,
  formatRelativeTime,
} from '../../utils/formatRelativeTime';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function activityText(e: ActivityEvent): string {
  switch (e.type) {
    case 'rating_submitted':
      return `${e.actorName} rated ${e.targetName} ${e.value}/5`;
    case 'user_registered':
      return `${e.actorName} registered`;
    case 'store_created':
      return `${e.targetName} was added`;
  }
}

const ACTIVITY_DOT: Record<ActivityEvent['type'], string> = {
  rating_submitted: 'bg-amber-500',
  user_registered: 'bg-indigo-500',
  store_created: 'bg-emerald-500',
};

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAnalytics()
      .then((d) => active && setData(d))
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

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !data ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <StatCard label="Total Users" value={data.kpis.totalUsers} />
            <StatCard label="Total Stores" value={data.kpis.totalStores} />
            <StatCard label="Total Ratings" value={data.kpis.totalRatings} />
            <StatCard
              label="Stores Awaiting Ratings"
              value={data.kpis.storesWithNoRatings}
            />
          </>
        )}
      </div>

      {data ? (
        <>
          {/* Distribution + activity, two columns on desktop */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900">
                Rating Distribution
              </h3>
              <div className="mt-4">
                <RatingBars distribution={data.ratingDistribution} />
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent Activity
              </h3>
              {data.recentActivity.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No activity yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.recentActivity.map((e, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT[e.type]}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-gray-700">
                        {activityText(e)}
                      </span>
                      <span
                        className="shrink-0 text-xs text-gray-400"
                        title={formatAbsoluteTime(e.createdAt)}
                      >
                        {formatRelativeTime(e.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Top stores */}
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
            <h3 className="text-sm font-semibold text-gray-900">
              Top Rated Stores
            </h3>
            {data.topStores.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No stores have enough ratings yet.
              </p>
            ) : (
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th scope="col" className="pb-2 font-medium">
                      #
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      Store
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      Rating
                    </th>
                    <th scope="col" className="pb-2 text-right font-medium">
                      Ratings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.topStores.map((s, i) => (
                    <tr key={s.id}>
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium text-gray-900">
                        {s.name}
                      </td>
                      <td className="py-2">
                        <RatingValue value={s.avgRating} />
                      </td>
                      <td className="py-2 text-right tabular-nums text-gray-500">
                        {s.totalRatings}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}

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
