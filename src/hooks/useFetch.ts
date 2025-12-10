/**
 * useFetch Hook
 * 
 * File Purpose:
 * - Wrapper around SWR for consistent data fetching
 * - Handles loading, error, and data states
 * - Provides automatic caching and revalidation
 * 
 * Dependencies:
 * - swr - Data fetching library
 * 
 * High-Level Logic:
 * - Fetches data from API endpoint
 * - Caches results and reuses across app
 * - Automatically refetches on focus
 * - Handles errors with retry logic
 * 
 * Usage:
 * const { data, loading, error } = useFetch('/api/listings');
 * 
 * Assumptions:
 * - API endpoints return JSON
 * - Error responses have error message
 * 
 * Areas Needing Work:
 * - Add custom retry logic
 * - Add request cancellation
 * - Add request timeout
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import useSWR from 'swr';
import type { SWRConfiguration } from 'swr';

interface UseFetchReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
  mutate: () => void;
}

// Simple JSON fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.message = await res.text();
    throw error;
  }
  
  return res.json();
};

export const useFetch = <T>(
  endpoint: string,
  options?: SWRConfiguration
): UseFetchReturn<T> => {
  const { data, error, mutate } = useSWR<T>(
    endpoint ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      ...options,
    }
  );

  return {
    data,
    loading: !error && !data,
    error,
    mutate,
  };
};
