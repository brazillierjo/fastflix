/**
 * Tests for useBackendMovieSearch hook
 * Tests movie/TV search functionality with user preferences
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    t: (key: string) => key,
    country: 'FR',
    language: 'fr',
  })),
}));

jest.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: jest.fn(() => ({
    preferences: {
      country: 'FR',
      contentType: 'all',
      platforms: [8, 337],
      includeFlatrate: true,
      includeRent: false,
      includeBuy: false,
    },
    isLoading: false,
  })),
}));

jest.mock('@/services/backend-api.service', () => ({
  backendAPIService: {
    search: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

jest.mock('@/constants/languages', () => ({
  getLanguageForTMDB: jest.fn((lang: string) => {
    const map: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      de: 'de-DE',
      it: 'it-IT',
    };
    return map[lang] || 'en-US';
  }),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { backendAPIService } from '@/services/backend-api.service';
import {
  useBackendMovieSearch,
  useBackendHealth,
} from '@/hooks/useBackendMovieSearch';
import { Alert } from 'react-native';

// Create wrapper with QueryClient - uses global cleanup
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
  // Store for global cleanup
  global.testQueryClient = queryClient;

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useBackendMovieSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should perform search with query', async () => {
      const mockResponse = {
        success: true,
        data: {
          recommendations: [
            {
              tmdb_id: 603,
              title: 'The Matrix',
              media_type: 'movie',
              overview: 'A computer hacker...',
              poster_path: '/matrix.jpg',
              vote_average: 8.7,
            },
          ],
          streamingProviders: {
            603: [{ provider_id: 8, provider_name: 'Netflix' }],
          },
          credits: {
            603: [{ id: 1, name: 'Keanu Reeves', character: 'Neo' }],
          },
          detailedInfo: {
            603: { genres: [{ id: 28, name: 'Action' }], runtime: 136 },
          },
          conversationalResponse: 'Here are some great sci-fi movies!',
          totalResults: 1,
        },
      };

      (backendAPIService.search as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'sci-fi movies',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.movies).toHaveLength(1);
      expect(result.current.data?.movies[0].id).toBe(603);
      expect(result.current.data?.geminiResponse).toBe(
        'Here are some great sci-fi movies!'
      );
    });

    it('should apply user preferences automatically', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [],
          streamingProviders: {},
          credits: {},
          detailedInfo: {},
          conversationalResponse: '',
          totalResults: 0,
        },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'action movies',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(backendAPIService.search).toHaveBeenCalled();
      });

      const searchCall = (backendAPIService.search as jest.Mock).mock
        .calls[0][0];
      // Should use preferences: platforms [8, 337], includeFlatrate true
      expect(searchCall.platforms).toEqual([8, 337]);
      expect(searchCall.includeFlatrate).toBe(true);
      expect(searchCall.includeRent).toBe(false);
    });

    it('should override preferences with explicit params', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [],
          totalResults: 0,
        },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'Netflix movies',
          includeMovies: true,
          includeTvShows: false,
          platforms: [8], // Override: Netflix only
          includeFlatrate: true,
          includeRent: true, // Override: include rent
        });
      });

      await waitFor(() => {
        expect(backendAPIService.search).toHaveBeenCalled();
      });

      const searchCall = (backendAPIService.search as jest.Mock).mock
        .calls[0][0];
      expect(searchCall.platforms).toEqual([8]); // Overridden
      expect(searchCall.includeRent).toBe(true); // Overridden
    });

    it('should use correct TMDB language', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: { recommendations: [], totalResults: 0 },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'comedy',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(backendAPIService.search).toHaveBeenCalled();
      });

      const searchCall = (backendAPIService.search as jest.Mock).mock
        .calls[0][0];
      expect(searchCall.language).toBe('fr-FR'); // Mapped from 'fr'
    });

    it('should use user country for search', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: { recommendations: [], totalResults: 0 },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'thriller',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(backendAPIService.search).toHaveBeenCalled();
      });

      const searchCall = (backendAPIService.search as jest.Mock).mock
        .calls[0][0];
      expect(searchCall.country).toBe('FR');
    });
  });

  describe('Content Type Handling', () => {
    it('should include both movies and TV shows when contentType is all', async () => {
      (useUserPreferences as jest.Mock).mockReturnValue({
        preferences: {
          contentType: 'all',
          platforms: [],
          includeFlatrate: true,
          includeRent: false,
          includeBuy: false,
        },
        isLoading: false,
      });

      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: { recommendations: [], totalResults: 0 },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'adventure',
          includeMovies: true,
          includeTvShows: true,
        });
      });

      const searchCall = (backendAPIService.search as jest.Mock).mock
        .calls[0][0];
      expect(searchCall.includeMovies).toBe(true);
      expect(searchCall.includeTvShows).toBe(true);
    });

    it('should handle movies only preference', async () => {
      (useUserPreferences as jest.Mock).mockReturnValue({
        preferences: {
          contentType: 'movies',
          platforms: [],
          includeFlatrate: true,
          includeRent: false,
          includeBuy: false,
        },
        isLoading: false,
      });

      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: { recommendations: [], totalResults: 0 },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'horror',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      const searchCall = (backendAPIService.search as jest.Mock).mock
        .calls[0][0];
      expect(searchCall.includeMovies).toBe(true);
      expect(searchCall.includeTvShows).toBe(false);
    });
  });

  describe('Response Transformation', () => {
    it('should transform movie results correctly', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [
            {
              tmdb_id: 550,
              title: 'Fight Club',
              media_type: 'movie',
              overview: 'An insomniac office worker...',
              poster_path: '/fightclub.jpg',
              release_date: '1999-10-15',
              vote_average: 8.4,
              vote_count: 25000,
            },
          ],
          streamingProviders: {},
          credits: {},
          detailedInfo: {},
          conversationalResponse: 'Great choice!',
          totalResults: 1,
        },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'cult classics',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const movie = result.current.data?.movies[0];
      expect(movie?.id).toBe(550);
      expect(movie?.title).toBe('Fight Club');
      expect(movie?.media_type).toBe('movie');
      expect(movie?.release_date).toBe('1999-10-15');
    });

    it('should transform TV show results correctly', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [
            {
              tmdb_id: 1399,
              title: 'Game of Thrones',
              media_type: 'tv',
              overview: 'Epic fantasy series...',
              poster_path: '/got.jpg',
              first_air_date: '2011-04-17',
              vote_average: 8.4,
            },
          ],
          totalResults: 1,
        },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'fantasy series',
          includeMovies: false,
          includeTvShows: true,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const show = result.current.data?.movies[0];
      expect(show?.id).toBe(1399);
      expect(show?.name).toBe('Game of Thrones');
      expect(show?.media_type).toBe('tv');
    });

    it('should include streaming providers in response', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [
            { tmdb_id: 603, title: 'Test', media_type: 'movie' },
          ],
          streamingProviders: {
            603: [
              {
                provider_id: 8,
                provider_name: 'Netflix',
                availability_type: 'flatrate',
              },
              {
                provider_id: 2,
                provider_name: 'Apple TV',
                availability_type: 'rent',
              },
            ],
          },
          totalResults: 1,
        },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'test',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.streamingProviders[603]).toHaveLength(2);
    });

    it('should include credits in response', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          recommendations: [
            { tmdb_id: 603, title: 'Test', media_type: 'movie' },
          ],
          credits: {
            603: [
              {
                id: 1,
                name: 'Actor 1',
                character: 'Character 1',
                profile_path: '/actor1.jpg',
              },
            ],
          },
          totalResults: 1,
        },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'test',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.credits[603]).toHaveLength(1);
      expect(result.current.data?.credits[603][0].name).toBe('Actor 1');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty query error', async () => {
      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: '   ',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('enterRequest');
    });

    it('should handle subscription required error', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'HTTP_402', message: 'Subscription required' },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'movies',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('subscriptionRequired');
      // Should not show alert for subscription errors
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should show alert for other errors', async () => {
      (backendAPIService.search as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      });

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'movies',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (backendAPIService.search as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate({
          query: 'test',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('Loading States', () => {
    it('should track loading state during search', async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve;
      });

      (backendAPIService.search as jest.Mock).mockReturnValue(searchPromise);

      const { result } = renderHook(() => useBackendMovieSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({
          query: 'test',
          includeMovies: true,
          includeTvShows: false,
        });
      });

      // Wait for the pending state to be true
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      await act(async () => {
        resolveSearch!({
          success: true,
          data: { recommendations: [], totalResults: 0 },
        });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });
});

describe('useBackendHealth', () => {
  it('should check backend health', async () => {
    (backendAPIService.healthCheck as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        database: 'connected',
        ai: 'connected',
      },
    });

    const { result } = renderHook(() => useBackendHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.status).toBe('healthy');
  });

  it('should handle health check failure', async () => {
    // Mock to reject - the hook throws when success is false
    (backendAPIService.healthCheck as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: 'Backend unavailable' },
    });

    const { result } = renderHook(() => useBackendHealth(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );
  });
});
