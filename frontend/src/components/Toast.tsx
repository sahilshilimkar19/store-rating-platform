import { useEffect } from 'react';

export type ToastVariant = 'success' | 'error';

const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
};

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

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${VARIANT_CLASS[variant]}`}
    >
      {message}
    </div>
  );
}
