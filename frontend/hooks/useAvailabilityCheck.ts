/**
 * Hook for checking availability changes on watchlist items
 * Calls the check-availability endpoint and caches results
 */

import { useQuery } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import { useAuth } from '@/contexts/AuthContext';

const AVAILABILITY_CHECK_QUERY_KEY = ['availabilityCheck'];

export interface AvailabilityChange {
  watchlistId: string;
  title: string;
  newProviders: Array<{ name: string; logo: string }>;
  removedProviders: Array<{ name: string; logo: string }>;
}

/**
 * Hook for checking provider availability changes on watchlist items.
 * Results are cached with a 1 hour stale time.
 */
export function useAvailabilityCheck() {
  const { isAuthenticated } = useAuth();

  const {
    data,
    isLoading: isChecking,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: AVAILABILITY_CHECK_QUERY_KEY,
    queryFn: async (): Promise<AvailabilityChange[]> => {
      const response = await backendAPIService.checkAvailability();
      if (response.success && response.data) {
        return response.data.changes;
      }
      return [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });

  return {
    changes: data || [],
    isChecking,
    lastChecked: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    error,
    refetch,
  };
}
