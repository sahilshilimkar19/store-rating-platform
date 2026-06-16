import type { ToastVariant } from '../components/Toast';

export interface ToastInput {
  message: string;
  variant?: ToastVariant;
}

type Handler = (toast: ToastInput) => void;

let handler: Handler | null = null;

/**
 * A tiny bridge so non-React code (e.g. the Axios interceptor) can raise toasts.
 * The ToastProvider registers its handler on mount; emit() is a no-op until then.
 */
export const toastBus = {
  register(fn: Handler | null): void {
    handler = fn;
  },
  emit(toast: ToastInput): void {
    handler?.(toast);
  },
};
