import { AxiosError } from 'axios';

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

/**
 * Extracts a human-readable message from an API error, understanding the
 * backend's standardized error shape ({ message: string | string[] }).
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message[0] : body.message;
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
