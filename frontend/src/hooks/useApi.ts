import { useCallback, useState } from 'react';
import { getErrorMessage } from '../utils/errors';

interface UseApiResult<TArgs extends unknown[], TResult> {
  execute: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Wraps an async API call with loading + error state. The returned `execute`
 * resolves with the result or throws, while exposing a friendly `error` message
 * (parsed from the backend's standardized error shape) for inline display.
 */
export function useApi<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): UseApiResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  const clearError = useCallback(() => setError(null), []);

  return { execute, loading, error, clearError };
}
