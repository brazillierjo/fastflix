/**
 * Hook for fetching home screen data
 * Uses TanStack React Query for caching and background refetching
 */

import { useQuery } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import { AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';

const HOME_DATA_QUERY_KEY = ['homeData'];

interface HomeData {
  dailyPick: any;
  trending: any[];
  recentSearches: any[];
  quota: any;
}

/**
 * Hook for fetching home screen data (daily pick, trending, recent searches, quota)
 * Works for both authenticated users and guests
 */
export function useHomeData() {
  const appState = useRef(AppState.currentState);

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<HomeData>({
    queryKey: HOME_DATA_QUERY_KEY,
    queryFn: async (): Promise<HomeData> => {
      const response = await backendAPIService.getHomeData();
      if (response.success && response.data) {
        return response.data;
      }
      return {
        dailyPick: null,
        trending: [],
        recentSearches: [],
        quota: null,
      };
    },
    enabled: true, // Fetch for both guests and authenticated users
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Refetch on app focus (window focus equivalent for React Native)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          refetch();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [refetch]);

  return {
    dailyPick: data?.dailyPick ?? null,
    trending: data?.trending ?? [],
    recentSearches: data?.recentSearches ?? [],
    quota: data?.quota ?? null,
    isLoading,
    isRefetching,
    error,
    refetch,
  };
}
