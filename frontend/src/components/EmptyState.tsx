/** Shown when a list/table has no data. */
export function EmptyState({ message = 'No data found' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="text-3xl text-gray-300">🗒️</div>
      <p className="mt-2 text-sm text-gray-400">{message}</p>
    </div>
  );
}
