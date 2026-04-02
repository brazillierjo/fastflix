/**
 * Hook for fetching home screen data
 * Uses TanStack React Query for caching and background refetching
 */

import { useQuery } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';

const HOME_DATA_QUERY_KEY = ['homeData'];
const API_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://fastflix-api.vercel.app';

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
  const { isAuthenticated } = useAuth();
  const { language, country } = useLanguage();

  // Map language code to TMDB language format
  const tmdbLanguage = language?.includes('-')
    ? language
    : `${language || 'en'}-${(country || 'US').toUpperCase()}`;
  const tmdbCountry = (country || 'US').toUpperCase();

  const { data, isLoading, error, refetch, isRefetching } = useQuery<HomeData>({
    queryKey: [HOME_DATA_QUERY_KEY, isAuthenticated, tmdbLanguage, tmdbCountry],
    queryFn: async (): Promise<HomeData> => {
      if (isAuthenticated) {
        const response = await backendAPIService.getHomeData({
          language: tmdbLanguage,
          country: tmdbCountry,
        });
        if (response.success && response.data) {
          return response.data;
        }
      }

      // Fallback: fetch public trending
      try {
        const res = await fetch(
          `${API_URL}/api/trending/public?language=${tmdbLanguage}&country=${tmdbCountry}`
        );
        const json = await res.json();
        return {
          dailyPick: null,
          trending: json.data?.items ?? [],
          recentSearches: [],
          quota: null,
        };
      } catch {
        return {
          dailyPick: null,
          trending: [],
          recentSearches: [],
          quota: null,
        };
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
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
