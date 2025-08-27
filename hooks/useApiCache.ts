import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseApiCacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

export function useApiCache<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiCacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
} {
  const { ttl = 10 * 60 * 1000, key } = options; // Default 10 minutes
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const cacheKey = useRef<string>(key || JSON.stringify(dependencies));

  const isCacheValid = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp < entry.ttl;
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setData(null);
    setError(null);
  }, []);

  const fetchData = useCallback(async () => {
    const currentKey = cacheKey.current;
    const cachedEntry = cacheRef.current.get(currentKey);

    // Check if we have valid cached data
    if (cachedEntry && isCacheValid(cachedEntry)) {
      console.log('Using cached data for:', currentKey.substring(0, 50) + '...');
      setData(cachedEntry.data);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      // Cache the result
      cacheRef.current.set(currentKey, {
        data: result,
        timestamp: Date.now(),
        ttl
      });

      setData(result);
      console.log('API call successful, cached for', ttl / 1000 / 60, 'minutes');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('API call failed:', error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, ttl, isCacheValid]);

  const refetch = useCallback(async () => {
    // Clear cache for this key and fetch fresh data
    cacheRef.current.delete(cacheKey.current);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache
  };
}

// Hook for managing global cache stats
export function useCacheStats() {
  const [stats, setStats] = useState({ totalEntries: 0, validEntries: 0, expiredEntries: 0 });

  const updateStats = useCallback(() => {
    // This would integrate with the global cache from geminiService
    // For now, we'll return basic stats
    setStats({ totalEntries: 0, validEntries: 0, expiredEntries: 0 });
  }, []);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return stats;
}
