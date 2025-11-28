/**
 * Zustand Store - Centralized State Management
 * Clean separation of concerns with typed actions
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  SearchState,
  MovieState,
  SubscriptionState,
  UserState,
  SearchFilters,
  MovieSearchResult,
  APIError,
  UserPreferences,
} from '@/types/api';

// Search slice
interface SearchSlice extends SearchState {
  // Actions
  setSearching: (isSearching: boolean) => void;
  setQuery: (query: string) => void;
  setResults: (results: MovieSearchResult | null) => void;
  setError: (error: APIError | null) => void;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
}

// Movie slice
interface MovieSlice extends MovieState {
  // Actions
  toggleExpandedCard: (id: number) => void;
  toggleFavorite: (id: number) => void;
  toggleWatchlist: (id: number) => void;
  clearExpandedCards: () => void;
}

// Subscription slice
interface SubscriptionSlice extends SubscriptionState {
  // Actions
  setSubscriptionStatus: (isSubscribed: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setCustomerInfo: (customerInfo: unknown) => void;
  setOfferings: (offerings: unknown) => void;
}

// User slice
interface UserSlice extends UserState {
  // Actions
  setLanguage: (language: string) => void;
  setCountry: (country: string) => void;
  incrementPromptCount: () => void;
  resetPromptCount: () => void;
  setPromptCount: (count: number) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

// Combined store type
type FastFlixStore = SearchSlice & MovieSlice & SubscriptionSlice & UserSlice;

// Initial states
const initialSearchState: SearchState = {
  isSearching: false,
  currentQuery: '',
  results: null,
  error: null,
  filters: {
    sortBy: 'vote_average',
    selectedProviders: new Set(),
    genres: new Set(),
  },
};

const initialMovieState: MovieState = {
  expandedCards: new Set(),
  favorites: new Set(),
  watchlist: new Set(),
};

const initialSubscriptionState: SubscriptionState = {
  isSubscribed: false,
  isLoading: true,
  customerInfo: null,
  offerings: null,
};

const initialUserState: UserState = {
  language: 'en',
  country: 'FR',
  monthlyPromptCount: 0,
  preferences: {
    darkMode: false,
    notifications: true,
    autoPlay: false,
    dataUsage: 'medium',
  },
};

// Create the store
export const useFastFlixStore = create<FastFlixStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Search state and actions
        ...initialSearchState,
        setSearching: (isSearching: boolean) =>
          set(state => {
            state.isSearching = isSearching;
          }),
        setQuery: (query: string) =>
          set(state => {
            state.currentQuery = query;
          }),
        setResults: (results: MovieSearchResult | null) =>
          set(state => {
            state.results = results;
            state.error = null;
          }),
        setError: (error: APIError | null) =>
          set(state => {
            state.error = error;
            state.isSearching = false;
          }),
        updateFilters: (filters: Partial<SearchFilters>) =>
          set(state => {
            state.filters = { ...state.filters, ...filters };
          }),
        clearSearch: () =>
          set(state => {
            state.currentQuery = '';
            state.results = null;
            state.error = null;
            state.isSearching = false;
          }),

        // Movie state and actions
        ...initialMovieState,
        toggleExpandedCard: (id: number) =>
          set(state => {
            if (state.expandedCards.has(id)) {
              state.expandedCards.delete(id);
            } else {
              state.expandedCards.add(id);
            }
          }),
        toggleFavorite: (id: number) =>
          set(state => {
            if (state.favorites.has(id)) {
              state.favorites.delete(id);
            } else {
              state.favorites.add(id);
            }
          }),
        toggleWatchlist: (id: number) =>
          set(state => {
            if (state.watchlist.has(id)) {
              state.watchlist.delete(id);
            } else {
              state.watchlist.add(id);
            }
          }),
        clearExpandedCards: () =>
          set(state => {
            state.expandedCards.clear();
          }),

        // Subscription state and actions
        ...initialSubscriptionState,
        setSubscriptionStatus: (isSubscribed: boolean) =>
          set(state => {
            state.isSubscribed = isSubscribed;
          }),
        setLoading: (isLoading: boolean) =>
          set(state => {
            state.isLoading = isLoading;
          }),
        setCustomerInfo: (customerInfo: unknown) =>
          set(state => {
            state.customerInfo = customerInfo;
          }),
        setOfferings: (offerings: unknown) =>
          set(state => {
            state.offerings = offerings;
          }),

        // User state and actions
        ...initialUserState,
        setLanguage: (language: string) =>
          set(state => {
            state.language = language;
          }),
        setCountry: (country: string) =>
          set(state => {
            state.country = country;
          }),
        incrementPromptCount: () =>
          set(state => {
            state.monthlyPromptCount += 1;
          }),
        resetPromptCount: () =>
          set(state => {
            state.monthlyPromptCount = 0;
          }),
        setPromptCount: (count: number) =>
          set(state => {
            state.monthlyPromptCount = count;
          }),
        updatePreferences: (preferences: Partial<UserPreferences>) =>
          set(state => {
            state.preferences = { ...state.preferences, ...preferences };
          }),
      })),
      {
        name: 'fastflix-storage',
        partialize: state => ({
          // Only persist user preferences and non-sensitive data
          language: state.language,
          country: state.country,
          monthlyPromptCount: state.monthlyPromptCount,
          preferences: state.preferences,
          favorites: Array.from(state.favorites),
          watchlist: Array.from(state.watchlist),
        }),
        onRehydrateStorage: () => state => {
          // Convert arrays back to Sets on rehydration
          if (state) {
            const persisted = state as unknown as {
              favorites?: number[];
              watchlist?: number[];
            };
            state.favorites = new Set(persisted.favorites || []);
            state.watchlist = new Set(persisted.watchlist || []);
            state.expandedCards = new Set();
          }
        },
      }
    ),
    {
      name: 'fastflix-store',
    }
  )
);

// Selectors for better performance
export const useSearchState = () =>
  useFastFlixStore(state => ({
    isSearching: state.isSearching,
    currentQuery: state.currentQuery,
    results: state.results,
    error: state.error,
    filters: state.filters,
  }));

export const useMovieState = () =>
  useFastFlixStore(state => ({
    expandedCards: state.expandedCards,
    favorites: state.favorites,
    watchlist: state.watchlist,
  }));

export const useSubscriptionState = () =>
  useFastFlixStore(state => ({
    isSubscribed: state.isSubscribed,
    isLoading: state.isLoading,
    customerInfo: state.customerInfo,
    offerings: state.offerings,
  }));

export const useUserState = () =>
  useFastFlixStore(state => ({
    language: state.language,
    country: state.country,
    monthlyPromptCount: state.monthlyPromptCount,
    preferences: state.preferences,
  }));

// Action selectors
export const useSearchActions = () =>
  useFastFlixStore(state => ({
    setSearching: state.setSearching,
    setQuery: state.setQuery,
    setResults: state.setResults,
    setError: state.setError,
    updateFilters: state.updateFilters,
    clearSearch: state.clearSearch,
  }));

export const useMovieActions = () =>
  useFastFlixStore(state => ({
    toggleExpandedCard: state.toggleExpandedCard,
    toggleFavorite: state.toggleFavorite,
    toggleWatchlist: state.toggleWatchlist,
    clearExpandedCards: state.clearExpandedCards,
  }));

export const useSubscriptionActions = () =>
  useFastFlixStore(state => ({
    setSubscriptionStatus: state.setSubscriptionStatus,
    setLoading: state.setLoading,
    setCustomerInfo: state.setCustomerInfo,
    setOfferings: state.setOfferings,
  }));

export const useUserActions = () =>
  useFastFlixStore(state => ({
    setLanguage: state.setLanguage,
    setCountry: state.setCountry,
    incrementPromptCount: state.incrementPromptCount,
    resetPromptCount: state.resetPromptCount,
    setPromptCount: state.setPromptCount,
    updatePreferences: state.updatePreferences,
  }));
