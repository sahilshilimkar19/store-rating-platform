import { AxiosError } from 'axios';

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

/**
 * Extracts a human-readable message from an API error, understanding the
 * backend's standardized error shape ({ message: string | string[] }).
 *
 * - 403 -> "Access denied"
 * - 400/422 validation -> all field messages joined (field-level feedback)
 * - 401 is handled globally by the axios interceptor (auto-logout)
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    if (status === 403) return 'Access denied';

    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message)
        ? body.message.join('; ')
        : body.message;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
