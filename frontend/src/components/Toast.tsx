import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

const VARIANT: Record<
  ToastVariant,
  { bg: string; role: 'status' | 'alert'; live: 'polite' | 'assertive' }
> = {
  success: { bg: 'bg-green-600', role: 'status', live: 'polite' },
  error: { bg: 'bg-red-600', role: 'alert', live: 'assertive' },
  info: { bg: 'bg-indigo-600', role: 'status', live: 'polite' },
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  // error + info share the circular-glyph shape (info uses an "i", error a "!").
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      {variant === 'info' ? (
        <path d="M12 8h.01M11 12h1v4h1" />
      ) : (
        <path d="M12 8v5M12 16h.01" />
      )}
    </svg>
  );
}

/**
 * A single auto-dismissing notification with a shrinking progress bar. Rendered
 * (and stacked) by the ToastProvider — pages raise toasts via useToast(), not by
 * mounting this directly.
 */
export function ToastItem({
  message,
  onClose,
  variant = 'success',
  duration = 4000,
}: {
  message: string;
  onClose: () => void;
  variant?: ToastVariant;
  duration?: number;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    // Kick the bar from 100% → 0% on the next frame so the CSS transition runs.
    const frame = requestAnimationFrame(() => setProgress(0));
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [onClose, duration]);

  const v = VARIANT[variant];

  return (
    <div
      role={v.role}
      aria-live={v.live}
      className={`animate-toast-in relative flex max-w-sm items-center gap-2 overflow-hidden rounded-lg px-4 py-3 text-sm font-medium text-white shadow-pop ${v.bg}`}
    >
      <span className="flex-none">
        <VariantIcon variant={variant} />
      </span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="flex-none text-white/80 transition-colors hover:text-white"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>
      <span
        className="absolute bottom-0 left-0 h-0.5 bg-white/40 transition-[width] ease-linear"
        style={{ width: `${progress}%`, transitionDuration: `${duration}ms` }}
        aria-hidden="true"
      />
    </div>
  );
}
