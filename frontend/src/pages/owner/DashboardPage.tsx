import { useEffect, useMemo, useState } from 'react';
import { getOwnerDashboard, type Rater } from '../../api/owner.api';
import { Layout } from '../../components/Layout';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
  SortableTable,
  type Column,
  type SortOrder,
} from '../../components/SortableTable';
import { getErrorMessage } from '../../utils/errors';
import { formatDateTime, formatRating } from '../../utils/formatters';

type SortKey = 'name' | 'email' | 'submitted_value' | 'submitted_at';

function sortRaters(list: Rater[], sortBy: SortKey, order: SortOrder): Rater[] {
  const dir = order === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export function OwnerDashboardPage() {
  const [avg, setAvg] = useState<number | null>(null);
  const [raters, setRaters] = useState<Rater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('submitted_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    let active = true;
    getOwnerDashboard()
      .then((d) => {
        if (!active) return;
        setAvg(d.avg_rating);
        setRaters(d.raters);
      })
      .catch((e) => active && setError(getErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const sorted = useMemo(
    () => sortRaters(raters, sortBy, sortOrder),
    [raters, sortBy, sortOrder],
  );

  const handleSort = (key: string) => {
    const k = key as SortKey;
    if (k === sortBy) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(k);
      setSortOrder('asc');
    }
  };

  const columns: Column<Rater>[] = [
    { key: 'name', header: 'User Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'submitted_value',
      header: 'Rating Given',
      sortable: true,
      render: (r) => `${r.submitted_value} / 5`,
    },
    {
      key: 'submitted_at',
      header: 'Submitted At',
      sortable: true,
      render: (r) => formatDateTime(r.submitted_at),
    },
  ];

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-900">Store Owner Dashboard</h2>

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <LoadingSpinner label="Loading dashboard…" />
      ) : (
        <>
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">
              Your Store's Average Rating
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {avg != null ? avg.toFixed(2) : formatRating(null)}
            </p>
          </div>

          <h3 className="mt-8 text-lg font-semibold text-gray-900">
            Users who rated your store
          </h3>
          <div className="mt-3">
            <SortableTable
              columns={columns}
              data={sorted}
              rowKey={(r) => r.user_id}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              emptyMessage="No ratings yet"
            />
          </div>
        </>
      )}
    </Layout>
  );
}
