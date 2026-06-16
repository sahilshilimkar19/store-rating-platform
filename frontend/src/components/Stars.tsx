const STAR_PATH =
  'M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.77l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z';

/** A single star glyph — filled (amber) or outline. */
export function StarIcon({
  size = 14,
  filled = true,
}: {
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#F59E0B' : 'none'}
      stroke={filled ? '#F59E0B' : '#E5E7EB'}
      strokeWidth={filled ? 0 : 1.5}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

/** Compact rating value for table cells: "4.3 ★", or muted "No ratings". */
export function RatingValue({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-gray-500">No ratings</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 font-medium text-gray-900">
      {value.toFixed(1)}
      <StarIcon size={14} />
    </span>
  );
}

/**
 * Read-only 5-star display with fractional fill (an amber overlay clipped to
 * value/5 over an outlined base row). `value` is 0–5; null renders empty stars.
 */
export function Stars({
  value,
  size = 26,
}: {
  value: number | null;
  size?: number;
}) {
  const pct = value != null ? Math.max(0, Math.min(100, (value / 5) * 100)) : 0;
  const Row = ({ filled }: { filled: boolean }) => (
    <span style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={filled ? '#F59E0B' : 'none'}
          stroke={filled ? undefined : '#E5E7EB'}
          strokeWidth={filled ? 0 : 1.5}
          style={{ flex: '0 0 auto' }}
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
  return (
    <span
      aria-hidden="true"
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      <Row filled={false} />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          width: `${pct}%`,
        }}
      >
        <Row filled={true} />
      </span>
    </span>
  );
}
