/**
 * Hook for managing user search preferences
 * Handles fetching, caching, and updating preferences from the backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  backendAPIService,
  UserPreferences,
  AvailableProvider,
} from '@/services/backend-api.service';
import { useAuth } from '@/contexts/AuthContext';

const PREFERENCES_QUERY_KEY = ['userPreferences'];
const PROVIDERS_QUERY_KEY = ['availableProviders'];

const DEFAULT_PREFERENCES: UserPreferences = {
  country: 'FR',
  contentType: 'all',
  platforms: [],
  includeFlatrate: true,
  includeRent: false,
  includeBuy: false,
};

export function useUserPreferences() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences
  const {
    data: preferences,
    isLoading: isLoadingPreferences,
    error: preferencesError,
    refetch: refetchPreferences,
  } = useQuery({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const response = await backendAPIService.getUserPreferences();
      if (response.success && response.data) {
        return response.data.preferences;
      }
      return DEFAULT_PREFERENCES;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const response =
        await backendAPIService.updateUserPreferences(newPreferences);
      if (!response.success) {
        throw new Error(
          response.error?.message || 'Failed to update preferences'
        );
      }
      return response.data?.preferences;
    },
    onSuccess: updatedPreferences => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEY, updatedPreferences);
    },
  });

  return {
    preferences: preferences || DEFAULT_PREFERENCES,
    isLoading: isLoadingPreferences,
    error: preferencesError,
    updatePreferences: updatePreferencesMutation.mutate,
    updatePreferencesAsync: updatePreferencesMutation.mutateAsync,
    isUpdating: updatePreferencesMutation.isPending,
    refetch: refetchPreferences,
  };
}

export function useAvailableProviders(country: string = 'FR') {
  const { isAuthenticated } = useAuth();

  const {
    data: providers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...PROVIDERS_QUERY_KEY, country],
    queryFn: async () => {
      const response = await backendAPIService.getAvailableProviders(country);
      if (response.success && response.data) {
        return response.data.providers;
      }
      return [] as AvailableProvider[];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    providers: providers || [],
    isLoading,
    error,
    refetch,
  };
}
