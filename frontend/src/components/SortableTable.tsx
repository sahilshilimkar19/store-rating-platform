import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { SkeletonTable } from './SkeletonTable';

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
  /** Richer empty state (title + subtitle) shown instead of emptyMessage. */
  emptyTitle?: string;
  emptySubtitle?: string;
  /** When true, shows shimmering skeleton rows while data loads. */
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
  emptyTitle,
  emptySubtitle,
  loading = false,
}: SortableTableProps<T>) {
  return (
    <>
    {/* Desktop / tablet: full table (sm and up) */}
    <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-card sm:block">
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
          {loading ? (
            <SkeletonTable columnCount={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-2">
                <EmptyState
                  message={emptyMessage}
                  title={emptyTitle}
                  subtitle={emptySubtitle}
                />
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

    {/* Mobile: one card per row (below sm) */}
    <div className="space-y-3 sm:hidden">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-card"
          >
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        ))
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-card">
          <EmptyState
            message={emptyMessage}
            title={emptyTitle}
            subtitle={emptySubtitle}
          />
        </div>
      ) : (
        data.map((row) => (
          <div
            key={rowKey(row)}
            className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-card"
          >
            {columns.map((col) => {
              const content = col.render
                ? col.render(row)
                : String((row as Record<string, unknown>)[col.key] ?? '');
              // A header-less column (e.g. actions) spans the full card width.
              if (!col.header) {
                return (
                  <div key={col.key} className="pt-1">
                    {content}
                  </div>
                );
              }
              return (
                <div
                  key={col.key}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-gray-500">{col.header}</span>
                  <span className="text-right text-gray-800">{content}</span>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
    </>
  );
}
