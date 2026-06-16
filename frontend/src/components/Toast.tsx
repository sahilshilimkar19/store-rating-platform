import { useEffect } from 'react';

export type ToastVariant = 'success' | 'error';

const VARIANT: Record<
  ToastVariant,
  { bg: string; role: 'status' | 'alert'; live: 'polite' | 'assertive' }
> = {
  success: { bg: 'bg-green-600', role: 'status', live: 'polite' },
  error: { bg: 'bg-red-600', role: 'alert', live: 'assertive' },
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  return variant === 'success' ? (
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
  ) : (
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
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

/** Auto-dismissing notification (bottom-right). Defaults to success. */
export function Toast({
  message,
  onClose,
  variant = 'success',
  duration = 3000,
}: {
  message: string;
  onClose: () => void;
  variant?: ToastVariant;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const v = VARIANT[variant];

  return (
    <div
      role={v.role}
      aria-live={v.live}
      className={`animate-toast-in fixed bottom-4 right-4 z-[60] flex max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-pop ${v.bg}`}
    >
      <span className="flex-none">
        <VariantIcon variant={variant} />
      </span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
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
    </div>
  );
}
