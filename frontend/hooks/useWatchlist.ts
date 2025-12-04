/**
 * Hook for managing user watchlist
 * Handles fetching, adding, removing items and checking watchlist status
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';
import {
  WatchlistItem,
  WatchlistResponse,
  WatchlistCheckResponse,
  AddToWatchlistParams,
} from '@/types/api';

const WATCHLIST_QUERY_KEY = ['watchlist'];
const WATCHLIST_CHECK_QUERY_KEY = ['watchlistCheck'];

/**
 * Hook for managing the full watchlist
 */
export function useWatchlist(mediaType?: 'movie' | 'tv') {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch watchlist
  const {
    data: watchlistData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...WATCHLIST_QUERY_KEY, mediaType || 'all'],
    queryFn: async (): Promise<WatchlistResponse> => {
      const response = await backendAPIService.getWatchlist(mediaType);
      if (response.success && response.data) {
        return response.data;
      }
      return { items: [], count: 0, mediaType: 'all' };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Add to watchlist mutation
  const addMutation = useMutation({
    mutationFn: async (item: AddToWatchlistParams) => {
      const response = await backendAPIService.addToWatchlist(item);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add to watchlist');
      }
      return response.data?.item;
    },
    onSuccess: () => {
      // Invalidate all watchlist queries to refresh the data
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      // Also invalidate check queries
      queryClient.invalidateQueries({ queryKey: WATCHLIST_CHECK_QUERY_KEY });
    },
  });

  // Remove from watchlist mutation
  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await backendAPIService.removeFromWatchlist(itemId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to remove from watchlist');
      }
      return response.data?.deleted;
    },
    onSuccess: () => {
      // Invalidate all watchlist queries to refresh the data
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      // Also invalidate check queries
      queryClient.invalidateQueries({ queryKey: WATCHLIST_CHECK_QUERY_KEY });
    },
  });

  // Refresh providers mutation
  const refreshProvidersMutation = useMutation({
    mutationFn: async () => {
      const response = await backendAPIService.refreshWatchlistProviders();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to refresh providers');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate watchlist queries to get updated providers
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
    },
  });

  return {
    // Data
    items: watchlistData?.items || [],
    count: watchlistData?.count || 0,
    currentMediaType: watchlistData?.mediaType || 'all',

    // Loading states
    isLoading,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isRefreshingProviders: refreshProvidersMutation.isPending,

    // Errors
    error,
    addError: addMutation.error,
    removeError: removeMutation.error,

    // Actions
    addToWatchlist: addMutation.mutate,
    addToWatchlistAsync: addMutation.mutateAsync,
    removeFromWatchlist: removeMutation.mutate,
    removeFromWatchlistAsync: removeMutation.mutateAsync,
    refreshProviders: refreshProvidersMutation.mutate,
    refreshProvidersAsync: refreshProvidersMutation.mutateAsync,
    refetch,
  };
}

/**
 * Hook for checking if a specific item is in the watchlist
 */
export function useIsInWatchlist(tmdbId: number, mediaType: 'movie' | 'tv') {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: checkData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...WATCHLIST_CHECK_QUERY_KEY, tmdbId, mediaType],
    queryFn: async (): Promise<WatchlistCheckResponse> => {
      const response = await backendAPIService.checkInWatchlist(tmdbId, mediaType);
      if (response.success && response.data) {
        return response.data;
      }
      return { inWatchlist: false, itemId: null };
    },
    enabled: isAuthenticated && tmdbId > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    inWatchlist: checkData?.inWatchlist || false,
    itemId: checkData?.itemId || null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for toggling an item in the watchlist
 * Combines check + add/remove functionality
 */
export function useWatchlistToggle(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  itemData: Omit<AddToWatchlistParams, 'tmdbId' | 'mediaType'>
) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { inWatchlist, itemId, isLoading: isChecking } = useIsInWatchlist(tmdbId, mediaType);

  // Add to watchlist mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      console.log('🎬 Adding to watchlist:', { tmdbId, mediaType, ...itemData });
      const response = await backendAPIService.addToWatchlist({
        tmdbId,
        mediaType,
        ...itemData,
      });
      console.log('🎬 Add to watchlist response:', response);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to add to watchlist');
      }
      return response.data?.item;
    },
    onSuccess: (data) => {
      console.log('✅ Successfully added to watchlist:', data);
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WATCHLIST_CHECK_QUERY_KEY });
    },
    onError: (error) => {
      console.error('❌ Failed to add to watchlist:', error);
    },
  });

  // Remove from watchlist mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!itemId) throw new Error('No item ID found');
      const response = await backendAPIService.removeFromWatchlist(itemId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to remove from watchlist');
      }
      return response.data?.deleted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WATCHLIST_CHECK_QUERY_KEY });
    },
  });

  const toggle = () => {
    if (inWatchlist && itemId) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const toggleAsync = async () => {
    if (inWatchlist && itemId) {
      return removeMutation.mutateAsync();
    } else {
      return addMutation.mutateAsync();
    }
  };

  return {
    inWatchlist,
    isLoading: isChecking,
    isToggling: addMutation.isPending || removeMutation.isPending,
    toggle,
    toggleAsync,
    error: addMutation.error || removeMutation.error,
  };
}

/**
 * Hook for getting watchlist count (useful for badges)
 */
export function useWatchlistCount() {
  const { isAuthenticated } = useAuth();

  const { data: watchlistData, isLoading } = useQuery({
    queryKey: [...WATCHLIST_QUERY_KEY, 'count'],
    queryFn: async () => {
      const response = await backendAPIService.getWatchlist();
      if (response.success && response.data) {
        return response.data.count;
      }
      return 0;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  return {
    count: watchlistData || 0,
    isLoading,
  };
}
