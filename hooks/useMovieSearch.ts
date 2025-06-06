import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { geminiService, tmdbService } from '@/utils/apiServices';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv' | 'person';
}

export interface TMDBSearchItem {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export interface StreamingProvider {
  provider_name: string;
  logo_path: string;
}

export interface SearchParams {
  query: string;
  numberOfRecommendations: number;
  includeMovies: boolean;
  includeTvShows: boolean;
}

export interface SearchResult {
  movies: Movie[];
  streamingProviders: { [key: number]: StreamingProvider[] };
}

const searchMoviesWithGemini = async (params: SearchParams): Promise<SearchResult> => {
  const { query, numberOfRecommendations, includeMovies, includeTvShows } = params;

  if (!query.trim()) {
    throw new Error('enterRequest');
  }

  if (!includeMovies && !includeTvShows) {
    throw new Error('selectContentType');
  }

  try {
    // Generate recommendations using Gemini
    let contentTypes = [];
    if (includeMovies) contentTypes.push('films');
    if (includeTvShows) contentTypes.push('séries');
    
    const movieTitles = await geminiService.generateRecommendations(
      query,
      numberOfRecommendations,
      contentTypes
    );

    // Search for each title on TMDB
    const contentPromises = movieTitles.map(title =>
      tmdbService.searchMulti(title, includeMovies, includeTvShows)
    );

    const contentResults = await Promise.all(contentPromises);
    const validContent = contentResults
      .filter(
        (item): item is TMDBSearchItem =>
          item !== null &&
          item !== undefined &&
          typeof item.id === 'number' &&
          (typeof item.title === 'string' || typeof item.name === 'string') &&
          typeof item.overview === 'string' &&
          typeof item.poster_path === 'string'
      )
      .map((item): Movie => ({
        id: item.id,
        title: item.title,
        name: item.name,
        overview: item.overview!,
        poster_path: item.poster_path!,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        vote_average: item.vote_average || 0,
        media_type: item.media_type,
      }));

    // Get streaming providers for each movie/show
    const providerPromises = validContent.map(async item => {
      const mediaType = item.media_type || 'movie';
      const providers = await tmdbService.getWatchProviders(item.id, mediaType);
      
      return {
        movieId: item.id,
        providers,
      };
    });

    const providerResults = await Promise.all(providerPromises);
    const providersMap: { [key: number]: StreamingProvider[] } = {};
    providerResults.forEach(result => {
      providersMap[result.movieId] = result.providers;
    });

    return {
      movies: validContent,
      streamingProviders: providersMap,
    };
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('searchError');
  }
};

export const useMovieSearch = () => {
  const { t } = useLanguage();

  return useMutation({
    mutationFn: searchMoviesWithGemini,
    onError: (error: Error) => {
      Alert.alert(t('errors.title'), t(`errors.${error.message}`));
    },
  });
};