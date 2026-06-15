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

function sortIndicator(active: boolean, order: SortOrder | undefined): string {
  if (!active) return '↕';
  return order === 'asc' ? '↑' : '↓';
}

/** Reusable table with clickable sortable headers. */
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
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => {
              const active = col.sortable === true && sortBy === col.key;
              const clickable = col.sortable === true && !!onSort;
              return (
                <th
                  key={col.key}
                  scope="col"
                  onClick={clickable ? () => onSort!(col.key) : undefined}
                  className={`px-4 py-3 text-left font-semibold text-gray-600 ${
                    clickable ? 'cursor-pointer select-none hover:text-gray-900' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable ? (
                      <span className="text-xs text-gray-400">
                        {sortIndicator(active, active ? sortOrder : undefined)}
                      </span>
                    ) : null}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
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
              <tr key={rowKey(row)} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
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
