/** Centered spinner for async states. */
export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      {label ? <span className="text-sm text-gray-500">{label}</span> : null}
    </div>
  );
}
