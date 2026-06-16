import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';

export type SortOrder = 'asc' | 'desc';

export interface Column<T> {
  /** Sort key sent to the backend; also the default cell accessor. */
  key: string;
  header: string;
  sortable?: boolean;
  /** Custom cell renderer; defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  sortBy?: string;
  sortOrder?: SortOrder;
  /** Called with the column key when a sortable header is clicked. */
  onSort?: (key: string) => void;
  emptyMessage?: string;
  /** When true, shows a spinner instead of the empty state while data loads. */
  loading?: boolean;
}

/** Dual-arrow when unsorted; single arrow (primary) when this column is active. */
function SortIcon({ state }: { state: 'none' | 'asc' | 'desc' }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (state === 'none') {
    return (
      <svg {...common} strokeWidth={1.8}>
        <path d="M4.5 6.5L8 3l3.5 3.5" />
        <path d="M4.5 9.5L8 13l3.5-3.5" />
      </svg>
    );
  }
  return (
    <svg {...common} strokeWidth={2}>
      {state === 'asc' ? (
        <path d="M4 10l4-4 4 4" />
      ) : (
        <path d="M4 6l4 4 4-4" />
      )}
    </svg>
  );
}

/** Reusable table with accessible, SVG-iconed sortable headers. */
export function SortableTable<T>({
  columns,
  data,
  rowKey,
  sortBy,
  sortOrder,
  onSort,
  emptyMessage = 'No records found',
  loading = false,
}: SortableTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-card">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => {
              const active = col.sortable === true && sortBy === col.key;
              const clickable = col.sortable === true && !!onSort;
              const ariaSort: 'ascending' | 'descending' | 'none' = active
                ? sortOrder === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none';
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={col.sortable ? ariaSort : undefined}
                  className="whitespace-nowrap px-4 py-3 text-left"
                >
                  {clickable ? (
                    <button
                      type="button"
                      onClick={() => onSort!(col.key)}
                      className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                        active
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {col.header}
                      <span
                        className={active ? 'text-indigo-600' : 'text-gray-400'}
                      >
                        <SortIcon state={active ? sortOrder ?? 'asc' : 'none'} />
                      </span>
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-500">
                      {col.header}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-2">
                {loading ? (
                  <LoadingSpinner label="Loading…" />
                ) : (
                  <EmptyState message={emptyMessage} />
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 text-gray-700"
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
