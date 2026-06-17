/**
 * Reusable pagination control: a summary, prev/next buttons, and an optional
 * items-per-page selector. Controlled — the parent owns page/limit state.
 */
export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 25, 50],
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span>
          {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
        </span>
        {onLimitChange ? (
          <label className="flex items-center gap-1 text-gray-500">
            <span className="sr-only sm:not-sr-only">Per page</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Items per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1 font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1 font-medium transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
