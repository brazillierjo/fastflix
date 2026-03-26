import { useMutation, useQueryClient } from '@tanstack/react-query';
import { backendAPIService } from '@/services/backend-api.service';
import { TASTE_PROFILE_KEY, useTasteProfile } from './useRating';

interface FavoriteActor {
  tmdb_id: number;
  name: string;
  profile_path?: string;
  known_for_department?: string;
}

export function useFavoriteActors() {
  const { profile, isLoading } = useTasteProfile();
  return {
    favoriteActors: ((profile as any)?.favorite_actors ?? []) as FavoriteActor[],
    isLoading,
  };
}

export function useIsFavoriteActor(personId: number) {
  const { favoriteActors, isLoading } = useFavoriteActors();
  return {
    isFavorite: favoriteActors.some((a: FavoriteActor) => a.tmdb_id === personId),
    isLoading,
  };
}

export function useFavoriteActorToggle() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (params: {
      tmdb_id: number;
      name: string;
      profile_path?: string;
      known_for_department?: string;
    }) => {
      const response = await backendAPIService.favoriteActor(params);
      if (!response.success) throw new Error('Failed to favorite actor');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASTE_PROFILE_KEY });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (tmdbId: number) => {
      const response = await backendAPIService.unfavoriteActor(tmdbId);
      if (!response.success) throw new Error('Failed to unfavorite actor');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASTE_PROFILE_KEY });
    },
  });

  return {
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
    isToggling: addMutation.isPending || removeMutation.isPending,
  };
}
