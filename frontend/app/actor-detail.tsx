// Translation keys needed:
// actorDetail.biography
// actorDetail.readMore
// actorDetail.readLess
// actorDetail.birthInfo
// actorDetail.birthday
// actorDetail.placeOfBirth
// actorDetail.knownFor
// actorDetail.filmography
// actorDetail.noFilmography

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { backendAPIService } from '@/services/backend-api.service';
import { Skeleton } from '@/components/Skeleton';
import {
  getCardShadow,
  getSquircle,
} from '@/utils/designHelpers';

const HERO_HEIGHT = 350;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilmographyItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  character?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string | null;
  movie_credits?: FilmographyItem[];
  tv_credits?: FilmographyItem[];
}

export default function ActorDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, language: langCode, country } = useLanguage();

  const params = useLocalSearchParams<{
    personId: string;
    name: string;
    profilePath: string;
  }>();

  const personId = parseInt(params.personId || '0', 10);
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  const bgColor = isDark ? '#000000' : '#F2F2F7';
  const tmdbLanguage = langCode?.includes('-')
    ? langCode
    : `${langCode || 'en'}-${(country || 'US').toUpperCase()}`;

  useEffect(() => {
    if (personId > 0) {
      setLoading(true);
      backendAPIService
        .getPersonDetails(personId, tmdbLanguage)
        .then((res) => {
          if (res.success && res.data) {
            setPerson(res.data);
          }
        })
        .catch(() => {
          // Silent fail
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [personId, tmdbLanguage]);

  // Scroll-driven animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, HERO_HEIGHT],
          [-50, 0, HERO_HEIGHT * 0.4]
        ),
      },
    ],
  }));

  const backButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.6, HERO_HEIGHT],
      [1, 0.7, 0.4]
    ),
  }));

  const headerOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.5, HERO_HEIGHT],
      [0, 0, 0.95]
    ),
  }));

  // Build filmography sorted by date (most recent first), deduplicated
  const filmography: FilmographyItem[] = React.useMemo(() => {
    if (!person) return [];
    // Merge movie and TV credits into a single list
    const movies: FilmographyItem[] = (person.movie_credits || []).map((m) => ({
      ...m,
      media_type: 'movie' as const,
    }));
    const tvShows: FilmographyItem[] = (person.tv_credits || []).map((t) => ({
      ...t,
      title: t.name || t.title,
      media_type: 'tv' as const,
    }));
    const all = [...movies, ...tvShows];
    const seen = new Set<number>();
    return all
      .filter((item) => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || '';
        const dateB = b.release_date || b.first_air_date || '';
        return dateB.localeCompare(dateA);
      })
      .slice(0, 30);
  }, [person]);

  const profileImageUri = params.profilePath
    ? `https://image.tmdb.org/t/p/w780${params.profilePath}`
    : person?.profile_path
      ? `https://image.tmdb.org/t/p/w780${person.profile_path}`
      : null;

  const displayName = person?.name || params.name || '';
  const biography = person?.biography || '';
  const BIO_TRUNCATE_LENGTH = 300;
  const isBioLong = biography.length > BIO_TRUNCATE_LENGTH;
  const displayBio = bioExpanded ? biography : biography.slice(0, BIO_TRUNCATE_LENGTH);

  const handleFilmographyPress = (item: FilmographyItem) => {
    router.push({
      pathname: '/movie-detail' as never,
      params: {
        tmdbId: String(item.id),
        mediaType: item.media_type || 'movie',
        title: item.title || item.name || '',
        posterPath: item.poster_path || '',
        voteAverage: String(item.vote_average || 0),
        overview: '',
        providersJson: '[]',
        creditsJson: '[]',
        detailedInfoJson: '{}',
      },
    });
  };

  return (
    <View className='flex-1 bg-light-background dark:bg-dark-background'>
      <StatusBar barStyle='light-content' />
      <Animated.ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, overflow: 'hidden' }}>
            <Animated.View style={[{ width: '100%', height: '120%' }, heroImageStyle]}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode='cover'
                />
              ) : (
                <View
                  style={{ width: '100%', height: '100%' }}
                  className='items-center justify-center bg-dark-surface'
                >
                  <Ionicons name='person-outline' size={64} color='#555' />
                </View>
              )}
            </Animated.View>
            {/* Gradient overlay */}
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.3)',
                isDark ? 'rgba(0,0,0,0.9)' : 'rgba(242,242,247,0.9)',
                bgColor,
              ]}
              locations={[0, 0.4, 0.75, 1]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '70%',
              }}
            />
            {/* Name + department overlaid on hero */}
            <View className='absolute bottom-4 left-4 right-4'>
              <Text
                className='mb-1 text-2xl font-bold text-white'
                style={{
                  textShadowColor: 'rgba(0,0,0,0.6)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {displayName}
              </Text>
              {(person?.known_for_department || loading) && (
                <View className='flex-row items-center gap-2'>
                  {person?.known_for_department && (
                    <View className='rounded-full bg-black/40 px-2.5 py-0.5 backdrop-blur-sm'>
                      <Text className='text-xs font-semibold text-white'>
                        {person.known_for_department}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </MotiView>

        {/* Back button */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: insets.top + 8,
              left: 16,
              zIndex: 10,
            },
            backButtonStyle,
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 60 : 40}
              tint='dark'
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  ...Platform.select({
                    ios: {},
                    android: { backgroundColor: 'rgba(0,0,0,0.5)' },
                  }),
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name='chevron-back' size={22} color='#fff' />
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Header overlay on scroll */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top + 52,
              backgroundColor: bgColor,
              zIndex: 5,
            },
            headerOverlayStyle,
          ]}
          pointerEvents='none'
        />

        {/* Content below hero */}
        <View className='px-4'>
          {/* Biography Section */}
          {loading && !biography ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 }}
            >
              <View className='mb-6'>
                <Skeleton width={120} height={20} borderRadius={6} />
                <Skeleton width='100%' height={14} borderRadius={4} style={{ marginTop: 12 }} />
                <Skeleton width='100%' height={14} borderRadius={4} style={{ marginTop: 6 }} />
                <Skeleton width='70%' height={14} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            </MotiView>
          ) : biography ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('actorDetail.biography') || 'Biography'}
                </Text>
                <Text className='text-base leading-relaxed text-light-textSecondary dark:text-dark-textSecondary'>
                  {displayBio}
                  {isBioLong && !bioExpanded && '...'}
                </Text>
                {isBioLong && (
                  <TouchableOpacity
                    onPress={() => setBioExpanded(!bioExpanded)}
                    className='mt-2'
                  >
                    <Text className='text-sm font-semibold text-brand'>
                      {bioExpanded
                        ? t('actorDetail.readLess') || 'Read less'
                        : t('actorDetail.readMore') || 'Read more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          ) : null}

          {/* Birth Info Section */}
          {loading && !person ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 150 }}
            >
              <View className='mb-6'>
                <Skeleton width={100} height={20} borderRadius={6} />
                <Skeleton width='60%' height={14} borderRadius={4} style={{ marginTop: 12 }} />
                <Skeleton width='80%' height={14} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            </MotiView>
          ) : (person?.birthday || person?.place_of_birth) ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 150 }}
            >
              <View className='mb-6'>
                <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
                  {t('actorDetail.birthInfo') || 'Personal Info'}
                </Text>
                <View
                  style={[getSquircle(14), getCardShadow(isDark)]}
                  className='bg-light-card p-4 dark:bg-dark-card'
                >
                  {person?.birthday && (
                    <View className='mb-2 flex-row items-center gap-2'>
                      <Ionicons
                        name='calendar'
                        size={16}
                        color={isDark ? '#a3a3a3' : '#737373'}
                      />
                      <Text className='text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                        {person.birthday}
                        {person.deathday ? ` — ${person.deathday}` : ''}
                      </Text>
                    </View>
                  )}
                  {person?.place_of_birth && (
                    <View className='flex-row items-center gap-2'>
                      <Ionicons
                        name='location'
                        size={16}
                        color={isDark ? '#a3a3a3' : '#737373'}
                      />
                      <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                        {person.place_of_birth}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </MotiView>
          ) : null}

          {/* Filmography Section */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <View className='mb-6'>
              <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('actorDetail.filmography') || 'Filmography'}
              </Text>
              {loading ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} width={120} height={180} borderRadius={12} />
                  ))}
                </ScrollView>
              ) : filmography.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {filmography.map((item, idx) => (
                    <TouchableOpacity
                      key={`filmography-${item.id}-${idx}`}
                      onPress={() => handleFilmographyPress(item)}
                      activeOpacity={0.7}
                      style={{ width: 120 }}
                    >
                      <View
                        style={[
                          getSquircle(12),
                          { width: 120, height: 180, overflow: 'hidden' },
                        ]}
                        className='mb-1.5 items-center justify-center bg-light-surface dark:bg-dark-surface'
                      >
                        {item.poster_path ? (
                          <Image
                            source={{
                              uri: `https://image.tmdb.org/t/p/w342${item.poster_path}`,
                            }}
                            style={{ width: 120, height: 180 }}
                            resizeMode='cover'
                          />
                        ) : (
                          <View className='flex-1 items-center justify-center'>
                            <Ionicons
                              name='film-outline'
                              size={32}
                              color={isDark ? '#555' : '#bbb'}
                            />
                          </View>
                        )}
                      </View>
                      <Text
                        className='text-xs font-medium text-light-text dark:text-dark-text'
                        numberOfLines={2}
                      >
                        {item.title || item.name || ''}
                      </Text>
                      {item.character ? (
                        <Text
                          className='text-xs text-light-textMuted dark:text-dark-textMuted'
                          numberOfLines={1}
                        >
                          {item.character}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text className='text-sm text-light-textMuted dark:text-dark-textMuted'>
                  {t('actorDetail.noFilmography') || 'No filmography available'}
                </Text>
              )}
            </View>
          </MotiView>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
