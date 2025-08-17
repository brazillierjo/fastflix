/**
 * Optimized Movie Search Hook
 * Enhanced performance with proper memoization and error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { tmdbService } from '@/services/tmdb.service';
import { aiService } from '@/services/ai.service';
import { useSearchState, useSearchActions, useUserState } from '@/store';
import {
  SearchParams,
  MovieSearchResult,
  MediaItem,
  StreamingProvider,
  Cast,
  NormalizedData,
} from '@/types/api';
import { APP_CONFIG } from '@/constants/app';

interface UseMovieSearchReturn {
  // Search mutation
  searchMutation: ReturnType<
    typeof useMutation<MovieSearchResult, Error, SearchParams>
  >;

  // Derived state
  isSearching: boolean;
  searchResults: MovieSearchResult | null;
  searchError: string | null;

  // Actions
  executeSearch: (params: SearchParams) => Promise<void>;
  clearSearch: () => void;
}

// Normalize array data to entities and ids
function normalizeData<T extends { id: number }>(
  items: T[]
): NormalizedData<T> {
  const entities: Record<number, T> = {};
  const ids: number[] = [];

  items.forEach(item => {
    entities[item.id] = item;
    ids.push(item.id);
  });

  return { entities, ids };
}

export const useOptimizedMovieSearch = (): UseMovieSearchReturn => {
  const queryClient = useQueryClient();
  const { currentQuery, results, error } = useSearchState();
  const { setSearching, setResults, setError, clearSearch } =
    useSearchActions();
  const { language, country } = useUserState();

  // Memoized search parameters
  const searchParams = useMemo(
    () => ({
      language,
      country,
    }),
    [language, country]
  );

  // Search mutation with optimized error handling
  const searchMutation = useMutation({
    mutationFn: async (params: SearchParams): Promise<MovieSearchResult> => {
      const { query, includeMovies, includeTvShows } = params;

      if (!query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      setSearching(true);
      setError(null);

      try {
        // Step 1: AI recommendation
        const aiResponse = await aiService.getMovieRecommendations({
          query,
          language: searchParams.language,
          includeMovies,
          includeTvShows,
        });

        if (!aiResponse.success) {
          throw new Error(aiResponse.error?.message || 'AI service failed');
        }

        const { recommendations, explanation } = aiResponse.data;

        if (!recommendations || recommendations.length === 0) {
          return {
            movies: { entities: {}, ids: [] },
            streamingProviders: { entities: {}, ids: [] },
            cast: { entities: {}, ids: [] },
            genres: { entities: {}, ids: [] },
            geminiResponse: explanation || 'No recommendations found',
            searchQuery: query,
            timestamp: Date.now(),
          };
        }

        // Step 2: Fetch detailed data for each recommendation
        const detailedResults = await Promise.allSettled(
          recommendations
            .slice(0, APP_CONFIG.RECOMMENDED_MOVIES_LIMIT)
            .map(async (title: string) => {
              // Search for the movie/TV show
              const searchResult = await tmdbService.searchMulti({
                query: title,
                includeMovies,
                includeTvShows,
                language: searchParams.language,
              });

              if (!searchResult.success || !searchResult.data) {
                return null;
              }

              const mediaItem = searchResult.data;
              const mediaType = mediaItem.mediaType;

              // Fetch additional data in parallel
              const [providersResult, creditsResult, detailsResult] =
                await Promise.allSettled([
                  tmdbService.getWatchProviders(
                    mediaItem.tmdbId,
                    mediaType,
                    searchParams.country
                  ),
                  tmdbService.getCredits(
                    mediaItem.tmdbId,
                    mediaType,
                    searchParams.language
                  ),
                  tmdbService.getDetailedInfo(
                    mediaItem.tmdbId,
                    mediaType,
                    searchParams.language
                  ),
                ]);

              return {
                mediaItem,
                providers:
                  providersResult.status === 'fulfilled' &&
                  providersResult.value.success
                    ? providersResult.value.data
                    : [],
                cast:
                  creditsResult.status === 'fulfilled' &&
                  creditsResult.value.success
                    ? creditsResult.value.data
                    : [],
                details:
                  detailsResult.status === 'fulfilled' &&
                  detailsResult.value.success
                    ? detailsResult.value.data
                    : {},
              };
            })
        );

        // Process results and normalize data
        const validResults = detailedResults
          .filter(
            (result): result is PromiseFulfilledResult<any> =>
              result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);

        if (validResults.length === 0) {
          return {
            movies: { entities: {}, ids: [] },
            streamingProviders: { entities: {}, ids: [] },
            cast: { entities: {}, ids: [] },
            genres: { entities: {}, ids: [] },
            geminiResponse: explanation || 'No valid results found',
            searchQuery: query,
            timestamp: Date.now(),
          };
        }

        // Normalize and structure the data
        const movies: MediaItem[] = [];
        const allProviders: StreamingProvider[] = [];
        const allCast: Cast[] = [];

        validResults.forEach(result => {
          // Update media item with detailed info
          const updatedMediaItem = {
            ...result.mediaItem,
            ...result.details,
          };
          movies.push(updatedMediaItem);

          // Collect providers and cast
          allProviders.push(...result.providers);
          allCast.push(...result.cast);
        });

        // Remove duplicates and normalize
        const uniqueProviders = allProviders.filter(
          (provider, index, arr) =>
            arr.findIndex(p => p.id === provider.id) === index
        );
        const uniqueCast = allCast.filter(
          (actor, index, arr) => arr.findIndex(a => a.id === actor.id) === index
        );

        const normalizedResult: MovieSearchResult = {
          movies: normalizeData(movies),
          streamingProviders: normalizeData(uniqueProviders),
          cast: normalizeData(uniqueCast),
          genres: { entities: {}, ids: [] }, // TODO: Implement genre normalization
          geminiResponse: explanation || '',
          searchQuery: query,
          timestamp: Date.now(),
        };

        return normalizedResult;
      } catch (error) {
        console.error('Search failed:', error);
        throw error;
      } finally {
        setSearching(false);
      }
    },
    onSuccess: data => {
      setResults(data);

      // Cache the result with React Query
      queryClient.setQueryData(
        ['movieSearch', currentQuery, searchParams],
        data,
        {
          updatedAt: Date.now(),
        }
      );
    },
    onError: (error: Error) => {
      console.error('Search mutation error:', error);
      setError({
        code: 'SEARCH_ERROR',
        message: error.message || 'Search failed',
      });
    },
  });

  // Optimized search execution with debouncing
  const executeSearch = useCallback(
    async (params: SearchParams): Promise<void> => {
      // Check cache first
      const cacheKey = ['movieSearch', params.query, searchParams];
      const cachedData = queryClient.getQueryData<MovieSearchResult>(cacheKey);

      if (
        cachedData &&
        Date.now() - cachedData.timestamp < APP_CONFIG.CACHE.STALE_TIME
      ) {
        setResults(cachedData);
        return;
      }

      await searchMutation.mutateAsync(params);
    },
    [queryClient, searchParams, searchMutation, setResults]
  );

  // Derived state with memoization
  const derivedState = useMemo(
    () => ({
      isSearching: searchMutation.isPending,
      searchResults: results,
      searchError: error?.message || null,
    }),
    [searchMutation.isPending, results, error]
  );

  return {
    searchMutation,
    ...derivedState,
    executeSearch,
    clearSearch,
  };
};
