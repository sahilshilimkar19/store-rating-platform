import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ToastItem, type ToastVariant } from '../components/Toast';
import { toastBus } from '../utils/toastBus';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = 'success',
      duration = DEFAULT_DURATION,
    ) => {
      const id = nextId.current++;
      // Keep at most MAX_VISIBLE toasts (drop the oldest).
      setToasts((prev) =>
        [...prev, { id, message, variant, duration }].slice(-MAX_VISIBLE),
      );
    },
    [],
  );

  // Bridge non-React callers (Axios interceptor) into the toast system.
  useEffect(() => {
    toastBus.register((t) => show(t.message, t.variant ?? 'error'));
    return () => toastBus.register(null);
  }, [show]);

  const value: ToastContextValue = {
    show,
    success: useCallback((m: string) => show(m, 'success'), [show]),
    error: useCallback((m: string) => show(m, 'error'), [show]),
    info: useCallback((m: string) => show(m, 'info'), [show]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            message={t.message}
            variant={t.variant}
            duration={t.duration}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Access the global toast API. Must be used within <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
