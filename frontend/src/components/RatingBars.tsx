import { StarIcon } from './Stars';

/**
 * Horizontal rating-distribution chart built from plain divs (no chart library).
 * Each row is a 1–5 bucket; bar width is proportional to the largest bucket so
 * the chart always fills its container.
 */
export function RatingBars({
  distribution,
}: {
  distribution: Record<string, number>;
}) {
  const buckets = ['5', '4', '3', '2', '1'];
  const counts = buckets.map((b) => distribution[b] ?? 0);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((sum, c) => sum + c, 0);

  return (
    <div className="space-y-2">
      {buckets.map((bucket) => {
        const count = distribution[bucket] ?? 0;
        const pct = (count / max) * 100;
        const share = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={bucket} className="flex items-center gap-3 text-sm">
            <span className="flex w-10 shrink-0 items-center gap-1 font-medium text-gray-700">
              {bucket}
              <StarIcon size={12} />
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
                role="img"
                aria-label={`${count} ${count === 1 ? 'rating' : 'ratings'} of ${bucket} stars (${share}%)`}
              />
            </div>
            <span className="w-12 shrink-0 text-right tabular-nums text-gray-500">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
