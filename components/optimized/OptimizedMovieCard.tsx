/**
 * Optimized Movie Card Component
 * Heavily memoized for better performance in lists
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { tmdbService } from '@/services/tmdb.service';
import {
  MediaItem,
  StreamingProvider,
  Cast,
  isMovie,
  isTVShow,
} from '@/types/api';
// Removed unused import: APP_CONFIG

interface OptimizedMovieCardProps {
  movie: MediaItem;
  providers: StreamingProvider[];
  cast: Cast[];
  isExpanded: boolean;
  onToggleExpanded: (id: number) => void;
  animationIndex: number;
}

// Memoized sub-components
const MovieTitle = memo(({ title }: { title: string }) => (
  <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
    {title}
  </Text>
));

MovieTitle.displayName = 'MovieTitle';

interface MovieOverviewProps {
  overview: string;
  isExpanded: boolean;
  t: (key: string) => string;
}

const MovieOverview = memo(
  ({ overview, isExpanded, t }: MovieOverviewProps) => {
    const displayOverview = useMemo(() => {
      if (!overview) return t('movies.noDescription');

      if (isExpanded) return overview;

      return overview.length > 100
        ? `${overview.substring(0, 100)}...`
        : overview;
    }, [overview, isExpanded, t]);

    return (
      <Text className='mb-3 text-sm text-light-secondary dark:text-dark-secondary'>
        {displayOverview}
      </Text>
    );
  }
);

MovieOverview.displayName = 'MovieOverview';

interface StreamingProvidersProps {
  providers: StreamingProvider[];
  isExpanded: boolean;
  t: (key: string) => string;
}

const StreamingProviders = memo(
  ({ providers, isExpanded, t }: StreamingProvidersProps) => {
    const displayProviders = useMemo(
      () => providers.slice(0, isExpanded ? undefined : 4),
      [providers, isExpanded]
    );

    if (providers.length === 0) return null;

    return (
      <View className={cn('mb-3', isExpanded && 'mt-4')}>
        {isExpanded && (
          <Text className='mb-2 text-sm font-semibold text-light-text dark:text-dark-text'>
            {t('movies.availableOn')}
          </Text>
        )}

        <View
          className={cn(isExpanded ? 'gap-1' : 'flex-row flex-wrap gap-1.5')}
        >
          {displayProviders.map(provider => (
            <View
              key={`provider-${provider.id}`}
              className={cn(
                'rounded-md',
                isExpanded
                  ? 'flex-row items-center py-0.5'
                  : 'bg-dark-surface dark:bg-light-surface'
              )}
            >
              <Image
                source={{
                  uri: tmdbService.getImageUrl(provider.logo_path, 'w92') || '',
                }}
                className='h-[30px] w-[30px] rounded-md bg-dark-surface p-1 dark:bg-light-surface'
                resizeMode='contain'
              />
              {isExpanded && (
                <Text className='ml-2.5 text-sm font-medium text-light-text dark:text-dark-text'>
                  {provider.provider_name}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  }
);

StreamingProviders.displayName = 'StreamingProviders';

interface CastSectionProps {
  cast: Cast[];
  t: (key: string) => string;
}

const CastSection = memo(({ cast, t }: CastSectionProps) => {
  const displayCast = useMemo(() => cast.slice(0, 5), [cast]);

  if (cast.length === 0) return null;

  return (
    <View className='my-3'>
      <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
        {t('movies.mainActors')}
      </Text>

      <View className='px-3 py-2'>
        {displayCast.map((actor, idx) => (
          <View
            key={`actor-${actor.id}`}
            className={cn(
              'flex-row items-center',
              idx < displayCast.length - 1 && 'mb-1.5'
            )}
          >
            <View className='mr-2 h-1.5 w-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary' />
            <Text className='flex-1 text-sm text-light-text dark:text-dark-text'>
              <Text className='font-medium'>{actor.name}</Text>
              <Text className='text-light-secondary dark:text-dark-secondary'>
                {' • '}
                {actor.character}
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

CastSection.displayName = 'CastSection';

interface MovieDetailsProps {
  movie: MediaItem;
  t: (key: string) => string;
}

const MovieDetails = memo(({ movie, t }: MovieDetailsProps) => {
  const detailsContent = useMemo(() => {
    const details = [];

    // Content Type Badge
    details.push(
      <View key='content-type' className='mb-2 flex-row items-center gap-2'>
        <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
          🎬 {t('movies.contentType')}
        </Text>
        <View className='rounded-full bg-light-accent/20 px-2 py-1 dark:bg-dark-accent/20'>
          <Text className='text-xs font-medium text-light-accent dark:text-dark-accent'>
            {movie.mediaType === 'tv' ? t('movies.tvShow') : t('movies.movie')}
          </Text>
        </View>
      </View>
    );

    // Movie-specific details
    if (isMovie(movie)) {
      if (movie.runtime) {
        details.push(
          <View key='runtime' className='mb-2 flex-row items-center gap-2'>
            <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
              ⏱️ {t('movies.duration')}
            </Text>
            <Text className='text-sm text-light-text dark:text-dark-text'>
              {movie.runtime} {t('movies.minutes')}
            </Text>
          </View>
        );
      }

      if (movie.releaseYear) {
        details.push(
          <View key='year' className='mb-2 flex-row items-center gap-2'>
            <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
              📅 {t('movies.year')}
            </Text>
            <Text className='text-sm text-light-text dark:text-dark-text'>
              {movie.releaseYear}
            </Text>
          </View>
        );
      }
    }

    // TV show-specific details
    if (isTVShow(movie)) {
      if (movie.numberOfSeasons) {
        details.push(
          <View key='seasons' className='mb-2 flex-row items-center gap-2'>
            <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
              📺 {t('movies.seasons')}
            </Text>
            <Text className='text-sm text-light-text dark:text-dark-text'>
              {movie.numberOfSeasons}
            </Text>
          </View>
        );
      }

      if (movie.firstAirYear) {
        details.push(
          <View
            key='first-air-year'
            className='mb-2 flex-row items-center gap-2'
          >
            <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
              📅 {t('movies.year')}
            </Text>
            <Text className='text-sm text-light-text dark:text-dark-text'>
              {movie.firstAirYear}
            </Text>
          </View>
        );
      }
    }

    // Rating
    if (movie.voteAverage > 0) {
      details.push(
        <View key='rating' className='mb-2 flex-row items-center gap-2'>
          <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
            ⭐ {t('movies.rating')}
          </Text>
          <Text className='text-sm text-light-text dark:text-dark-text'>
            {movie.voteAverage.toFixed(1)}/10
          </Text>
        </View>
      );
    }

    return details;
  }, [movie, t]);

  return <View className='my-3'>{detailsContent}</View>;
});

MovieDetails.displayName = 'MovieDetails';

interface ExternalLinksProps {
  movie: MediaItem;
  t: (key: string) => string;
}

const ExternalLinks = memo(({ movie, t }: ExternalLinksProps) => {
  const handleTMDBPress = useCallback(() => {
    const url = tmdbService.getTMDBUrl(movie.tmdbId, movie.mediaType);
    Linking.openURL(url);
  }, [movie.tmdbId, movie.mediaType]);

  return (
    <View className='flex-row items-center gap-2'>
      <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
        🔗 {t('movies.externalLinks')}
      </Text>
      <TouchableOpacity
        onPress={handleTMDBPress}
        className='rounded-md bg-light-accent/20 px-2 py-1 dark:bg-dark-accent/20'
      >
        <Text className='text-xs font-medium text-light-accent dark:text-dark-accent'>
          {t('movies.viewOnTMDB')}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

ExternalLinks.displayName = 'ExternalLinks';

interface MoviePosterProps {
  posterPath: string | null;
  title: string;
}

const MoviePoster = memo(({ posterPath, title }: MoviePosterProps) => {
  if (!posterPath) return null;

  return (
    <View className='w-3/12'>
      <Image
        source={{
          uri: tmdbService.getImageUrl(posterPath, 'w300') || '',
        }}
        style={{
          width: 80,
          height: 120,
          borderRadius: 8,
        }}
        resizeMode='cover'
        accessibilityLabel={`Poster for ${title}`}
      />
    </View>
  );
});

MoviePoster.displayName = 'MoviePoster';

const OptimizedMovieCard: React.FC<OptimizedMovieCardProps> = memo(
  ({
    movie,
    providers,
    cast,
    isExpanded,
    onToggleExpanded,
    animationIndex,
  }) => {
    const { t } = useLanguage();

    // Memoized callbacks
    const handleToggleExpanded = useCallback(() => {
      onToggleExpanded(movie.id);
    }, [movie.id, onToggleExpanded]);

    // Memoized title for both movies and TV shows
    const title = useMemo(() => {
      return isMovie(movie) ? movie.title : movie.name;
    }, [movie]);

    // Memoized poster path
    const posterPath = useMemo(() => movie.posterPath, [movie.posterPath]);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{
          opacity: 1,
          translateY: 0,
          height: isExpanded ? 'auto' : undefined,
        }}
        transition={{
          delay: animationIndex * 150,
          type: 'timing',
          duration: 500,
        }}
        className='mb-4 rounded-xl bg-light-card dark:bg-dark-card'
      >
        <TouchableOpacity
          onPress={handleToggleExpanded}
          className='flex-row justify-between gap-4 p-4'
          activeOpacity={0.7}
        >
          {/* Left content */}
          <View className='w-9/12'>
            <MovieTitle title={title} />
            <MovieOverview
              overview={movie.overview}
              isExpanded={isExpanded}
              t={t}
            />

            <StreamingProviders
              providers={providers}
              isExpanded={isExpanded}
              t={t}
            />

            {isExpanded && <CastSection cast={cast} t={t} />}
            {isExpanded && <MovieDetails movie={movie} t={t} />}
            {isExpanded && <ExternalLinks movie={movie} t={t} />}

            {/* Toggle button */}
            <TouchableOpacity
              onPress={handleToggleExpanded}
              className='mt-2 self-start'
            >
              <Text className='text-sm font-medium text-light-accent dark:text-dark-accent'>
                {isExpanded ? t('movies.seeLess') : t('movies.seeMore')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right content - Poster */}
          <MoviePoster posterPath={posterPath} title={title} />
        </TouchableOpacity>
      </MotiView>
    );
  }
);

OptimizedMovieCard.displayName = 'OptimizedMovieCard';

export default OptimizedMovieCard;
