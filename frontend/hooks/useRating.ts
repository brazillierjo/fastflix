/**
 * Hook for managing movie/TV ratings and taste profile
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import { useAuth } from '@/contexts/AuthContext';

interface RatedMovie {
  tmdb_id: number;
  rating: number;
  title: string;
  media_type?: 'movie' | 'tv';
}

interface TasteProfile {
  favorite_genres: string[];
  disliked_genres: string[];
  favorite_decades: string[];
  rated_movies: RatedMovie[];
}

export const TASTE_PROFILE_KEY = ['tasteProfile'];

/**
 * Hook for fetching the user's taste profile (including all rated/watched movies)
 */
export function useTasteProfile() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: TASTE_PROFILE_KEY,
    queryFn: async (): Promise<TasteProfile> => {
      const response = await backendAPIService.getTasteProfile();
      if (response.success && response.data?.profile) {
        return response.data.profile;
      }
      return { favorite_genres: [], disliked_genres: [], favorite_decades: [], rated_movies: [] };
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return {
    profile: data,
    ratedMovies: data?.rated_movies ?? [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for rating/marking watched a movie (used on movie-detail page)
 * rating 0 = watched but not rated, 1-5 = rated
 */
export function useRateMovie() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: {
      tmdb_id: number;
      rating: number;
      title: string;
      media_type?: 'movie' | 'tv';
    }) => {
      const response = await backendAPIService.rateMovie(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to rate movie');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASTE_PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: ['forYou'] });
    },
  });

  return {
    rateMovie: mutation.mutate,
    rateMovieAsync: mutation.mutateAsync,
    isRating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to get the current user's watched/rating status for a specific movie
 */
export function useMovieRating(tmdbId: number) {
  const { ratedMovies, isLoading } = useTasteProfile();

  const entry = ratedMovies.find((m) => m.tmdb_id === tmdbId);

  return {
    rating: entry?.rating ?? -1, // -1 = not watched, 0 = watched no rating, 1-5 = rated
    isWatched: entry !== undefined,
    isLoading,
  };
}
