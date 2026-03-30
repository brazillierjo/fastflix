/**
 * QuickSearch — Autocomplete search for movies, TV shows, and actors
 * Shows results in a dropdown as user types (3+ characters)
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { MotiView } from 'moti';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  backendAPIService,
  TMDBQuickSearchResult,
} from '@/services/backend-api.service';
import { getSquircle, getCardShadow, typography } from '@/utils/designHelpers';
import { getLanguageForTMDB } from '@/constants/languages';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;

interface QuickSearchProps {
  onFocusInput?: () => void;
}

export default function QuickSearch({ onFocusInput }: QuickSearchProps) {
  const { t, language, country: _country } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBQuickSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const tmdbLanguage = getLanguageForTMDB(language);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < MIN_CHARS) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await backendAPIService.searchTMDB(query.trim(), tmdbLanguage);
        if (res.success && res.data?.results) {
          setResults(res.data.results);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tmdbLanguage]);

  const handleResultPress = useCallback(
    (item: TMDBQuickSearchResult) => {
      setQuery('');
      setResults([]);
      inputRef.current?.blur();

      if (item.media_type === 'person') {
        router.push({
          pathname: '/actor-detail' as never,
          params: {
            personId: String(item.id),
            name: item.title,
            profilePath: item.profile_path || '',
          },
        });
      } else {
        router.push({
          pathname: '/movie-detail' as never,
          params: {
            tmdbId: String(item.id),
            mediaType: item.media_type,
            title: item.title,
            posterPath: item.poster_path || '',
            voteAverage: String(item.vote_average || 0),
            overview: '',
            providersJson: '[]',
            creditsJson: '[]',
            detailedInfoJson: '{}',
          },
        });
      }
    },
    [router]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const getMediaIcon = (type: string): 'film' | 'tv' | 'person' => {
    if (type === 'tv') return 'tv';
    if (type === 'person') return 'person';
    return 'film';
  };

  const getMediaLabel = (item: TMDBQuickSearchResult): string => {
    if (item.media_type === 'person') return item.known_for_department || 'Actor';
    if (item.media_type === 'tv') return t('movies.tvShow') || 'TV Show';
    return t('movies.movie') || 'Movie';
  };

  const getImageUri = (item: TMDBQuickSearchResult): string | null => {
    if (item.media_type === 'person' && item.profile_path) {
      return `${TMDB_IMAGE_BASE}/w92${item.profile_path}`;
    }
    if (item.poster_path) {
      return `${TMDB_IMAGE_BASE}/w92${item.poster_path}`;
    }
    return null;
  };

  const showDropdown = (results.length > 0 || isSearching) && query.trim().length >= MIN_CHARS;

  return (
    <View className='mt-8 px-6'>
      <Text
        style={typography.title3}
        className='mb-3 text-light-text dark:text-dark-text'
      >
        {t('home.quickSearch') || 'Quick search'}
      </Text>

      {/* Search Input */}
      <View
        style={[getSquircle(14), getCardShadow(isDark)]}
        className='flex-row items-center border border-light-border bg-light-surface px-3 py-2.5 dark:border-dark-border dark:bg-dark-surface'
      >
        <Ionicons
          name='search'
          size={18}
          color={isDark ? '#a3a3a3' : '#737373'}
        />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={onFocusInput}
          placeholder={t('home.quickSearchPlaceholder') || 'Movie, series, actor...'}
          placeholderTextColor={isDark ? '#525252' : '#a3a3a3'}
          className='ml-2 flex-1 text-base text-light-text dark:text-dark-text'
          returnKeyType='search'
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name='close-circle' size={18} color={isDark ? '#525252' : '#a3a3a3'} />
          </TouchableOpacity>
        )}
        {isSearching && (
          <ActivityIndicator size='small' color='#E50914' style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Dropdown Results */}
      {showDropdown && (
        <MotiView
          from={{ opacity: 0, translateY: -5 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={[getSquircle(14), getCardShadow(isDark)]}
          className='mt-1 border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
        >
          {results.map((item, idx) => {
            const imageUri = getImageUri(item);
            return (
              <TouchableOpacity
                key={`${item.media_type}-${item.id}`}
                onPress={() => handleResultPress(item)}
                activeOpacity={0.7}
                className={`flex-row items-center px-3 py-2.5 ${
                  idx < results.length - 1
                    ? 'border-b border-light-border/50 dark:border-dark-border/50'
                    : ''
                }`}
              >
                {/* Thumbnail */}
                <View
                  className='mr-3 items-center justify-center overflow-hidden rounded-lg bg-light-background dark:bg-dark-background'
                  style={{ width: 40, height: 40 }}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: 40, height: 40 }}
                      resizeMode='cover'
                    />
                  ) : (
                    <Ionicons
                      name={getMediaIcon(item.media_type)}
                      size={20}
                      color={isDark ? '#525252' : '#a3a3a3'}
                    />
                  )}
                </View>

                {/* Info */}
                <View className='flex-1'>
                  <Text
                    className='text-sm font-medium text-light-text dark:text-dark-text'
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <View className='flex-row items-center gap-2'>
                    <Text className='text-xs text-light-muted dark:text-dark-muted'>
                      {getMediaLabel(item)}
                    </Text>
                    {item.vote_average != null && item.vote_average > 0 && item.media_type !== 'person' && (
                      <View className='flex-row items-center gap-0.5'>
                        <Ionicons name='star' size={10} color='#fbbf24' />
                        <Text className='text-xs text-light-muted dark:text-dark-muted'>
                          {item.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    )}
                    {(item.release_date || item.first_air_date) && (
                      <Text className='text-xs text-light-muted dark:text-dark-muted'>
                        {(item.release_date || item.first_air_date || '').substring(0, 4)}
                      </Text>
                    )}
                  </View>
                </View>

                <Ionicons
                  name='chevron-forward'
                  size={16}
                  color={isDark ? '#404040' : '#d4d4d4'}
                />
              </TouchableOpacity>
            );
          })}

          {isSearching && results.length === 0 && (
            <View className='items-center py-4'>
              <ActivityIndicator size='small' color='#E50914' />
            </View>
          )}
        </MotiView>
      )}
    </View>
  );
}
