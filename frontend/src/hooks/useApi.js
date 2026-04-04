/**
 * useApi — Generic data-fetching hook
 *
 * Wraps any async API call with loading / error / data state management.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => detectionApi.getHistory());
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @template T
 * @param {() => Promise<import('axios').AxiosResponse<T>>} fetchFn
 * @param {object} [options]
 * @param {boolean} [options.immediate=true] — run on mount
 * @param {any[]}   [options.deps=[]]        — re-run when these change
 * @returns {{ data: T|null, loading: boolean, error: string|null, refetch: () => void }}
 */
export function useApi(fetchFn, { immediate = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn();
      setData(response.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * useMutation — For write operations (POST / PUT / DELETE).
 * Does NOT run on mount.
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation((file) => detectionApi.detect(file));
 */
export function useMutation(mutateFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mutateFn(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutateFn]);

  return { mutate, loading, error, data };
}
