/**
 * Shimmering placeholder rows for a table while its data loads. Renders a
 * fragment of <tr> elements, so it must be placed inside a <tbody>.
 */
export function SkeletonTable({
  columnCount,
  rowCount = 6,
}: {
  columnCount: number;
  rowCount?: number;
}) {
  // Vary bar widths across columns so the skeleton reads as content, not blocks.
  const widths = ['70%', '85%', '55%', '60%', '40%', '50%'];
  return (
    <>
      {Array.from({ length: rowCount }).map((_, r) => (
        <tr key={r} className="border-b border-gray-100 last:border-0">
          {Array.from({ length: columnCount }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <div
                className="h-4 animate-pulse rounded bg-gray-200"
                style={{ width: widths[c % widths.length] }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
