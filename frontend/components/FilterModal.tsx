import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { getButtonBorderRadius, getSmallBorderRadius } from '@/utils/designHelpers';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {
  backendAPIService,
  PersonResult,
} from '@/services/backend-api.service';

type SortOption = 'release_date' | 'vote_average';
type ContentType = 'all' | 'movies' | 'tvshows';

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear();

export interface SelectedActor {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface FilterState {
  sortBy: SortOption;
  selectedProviders: Set<string>;
  contentType: ContentType;
  yearFrom: number | null;
  yearTo: number | null;
  selectedActors: SelectedActor[];
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableProviders: string[];
  onRefineSearch: (filters: {
    includeMovies: boolean;
    includeTvShows: boolean;
    yearFrom?: number;
    yearTo?: number;
    actorIds?: number[];
  }) => void;
}

export default function FilterModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
  availableProviders,
  onRefineSearch,
}: FilterModalProps) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Local state for editing
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  // Actor search state
  const [actorSearchQuery, setActorSearchQuery] = useState('');
  const [actorSuggestions, setActorSuggestions] = useState<PersonResult[]>([]);
  const [isSearchingActors, setIsSearchingActors] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      setActorSearchQuery('');
      setActorSuggestions([]);
    }
  }, [visible, filters]);

  // Debounced actor search
  const handleActorSearch = useCallback(
    (query: string) => {
      setActorSearchQuery(query);

      // Clear previous timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (query.length < 2) {
        setActorSuggestions([]);
        return;
      }

      // Debounce search by 300ms
      const timeout = setTimeout(async () => {
        setIsSearchingActors(true);
        try {
          const response = await backendAPIService.searchActors({ query });
          if (response.success && response.data) {
            // Filter out already selected actors
            const filtered = response.data.actors.filter(
              actor =>
                !localFilters.selectedActors.some(
                  selected => selected.id === actor.id
                )
            );
            setActorSuggestions(filtered);
          }
        } catch (error) {
          console.error('Actor search error:', error);
        } finally {
          setIsSearchingActors(false);
        }
      }, 300);

      setSearchTimeout(timeout);
    },
    [searchTimeout, localFilters.selectedActors]
  );

  const addActor = (actor: PersonResult) => {
    if (localFilters.selectedActors.length >= 3) {
      return; // Max 3 actors
    }
    setLocalFilters(prev => ({
      ...prev,
      selectedActors: [
        ...prev.selectedActors,
        {
          id: actor.id,
          name: actor.name,
          profile_path: actor.profile_path,
        },
      ],
    }));
    setActorSearchQuery('');
    setActorSuggestions([]);
  };

  const removeActor = (actorId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedActors: prev.selectedActors.filter(a => a.id !== actorId),
    }));
  };

  const handleSortChange = (sortOption: SortOption) => {
    setLocalFilters(prev => ({ ...prev, sortBy: sortOption }));
  };

  const handleContentTypeChange = (contentType: ContentType) => {
    setLocalFilters(prev => ({ ...prev, contentType }));
  };

  const toggleProvider = (providerName: string) => {
    setLocalFilters(prev => {
      const newProviders = new Set(prev.selectedProviders);
      if (newProviders.has(providerName)) {
        newProviders.delete(providerName);
      } else {
        newProviders.add(providerName);
      }
      return { ...prev, selectedProviders: newProviders };
    });
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleRefineSearch = () => {
    // Apply local filters first
    onFiltersChange(localFilters);

    // Then trigger refine search with backend filters
    onRefineSearch({
      includeMovies:
        localFilters.contentType === 'all' ||
        localFilters.contentType === 'movies',
      includeTvShows:
        localFilters.contentType === 'all' ||
        localFilters.contentType === 'tvshows',
      yearFrom: localFilters.yearFrom ?? undefined,
      yearTo: localFilters.yearTo ?? undefined,
      actorIds:
        localFilters.selectedActors.length > 0
          ? localFilters.selectedActors.map(a => a.id)
          : undefined,
    });

    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      sortBy: 'vote_average',
      selectedProviders: new Set(),
      contentType: 'all',
      yearFrom: null,
      yearTo: null,
      selectedActors: [],
    });
    setActorSearchQuery('');
    setActorSuggestions([]);
  };

  const hasActiveFilters =
    localFilters.contentType !== 'all' ||
    localFilters.yearFrom !== null ||
    localFilters.yearTo !== null ||
    localFilters.selectedProviders.size > 0 ||
    localFilters.selectedActors.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-light-background dark:bg-dark-background">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-light-border p-4 dark:border-dark-border">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-base text-light-muted dark:text-dark-muted">
              {t('common.cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-light-text dark:text-dark-text">
            {t('filters.title') || 'Filters'}
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="text-base text-netflix-500">
              {t('filters.reset') || 'Reset'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Content Type Section */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-light-text dark:text-dark-text">
              {t('filters.contentType') || 'Content Type'}
            </Text>
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: t('filters.all') || 'All' },
                { key: 'movies', label: t('filters.moviesOnly') || 'Movies' },
                {
                  key: 'tvshows',
                  label: t('filters.tvShowsOnly') || 'TV Shows',
                },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() =>
                    handleContentTypeChange(option.key as ContentType)
                  }
                  style={getButtonBorderRadius()}
                  className={cn(
                    'flex-1 items-center border-2 py-3',
                    localFilters.contentType === option.key
                      ? 'border-netflix-500 bg-netflix-500/10'
                      : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      localFilters.contentType === option.key
                        ? 'text-netflix-500'
                        : 'text-light-text dark:text-dark-text'
                    )}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Year Range Section */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-light-text dark:text-dark-text">
              {t('filters.yearRange') || 'Release Year'}
            </Text>

            {/* From Year Slider */}
            <View className="mb-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm text-light-muted dark:text-dark-muted">
                  {t('filters.from') || 'From'}
                </Text>
                <Text className="text-base font-semibold text-netflix-500">
                  {localFilters.yearFrom ?? MIN_YEAR}
                </Text>
              </View>
              <Slider
                value={localFilters.yearFrom ?? MIN_YEAR}
                onValueChange={value =>
                  setLocalFilters(prev => ({
                    ...prev,
                    yearFrom: Math.round(value),
                  }))
                }
                minimumValue={MIN_YEAR}
                maximumValue={localFilters.yearTo ?? MAX_YEAR}
                step={1}
                minimumTrackTintColor="#E50914"
                maximumTrackTintColor={isDark ? '#374151' : '#d1d5db'}
                thumbTintColor="#E50914"
              />
              <View className="flex-row justify-between">
                <Text className="text-xs text-light-muted dark:text-dark-muted">
                  {MIN_YEAR}
                </Text>
                <Text className="text-xs text-light-muted dark:text-dark-muted">
                  {localFilters.yearTo ?? MAX_YEAR}
                </Text>
              </View>
            </View>

            {/* To Year Slider */}
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm text-light-muted dark:text-dark-muted">
                  {t('filters.to') || 'To'}
                </Text>
                <Text className="text-base font-semibold text-netflix-500">
                  {localFilters.yearTo ?? MAX_YEAR}
                </Text>
              </View>
              <Slider
                value={localFilters.yearTo ?? MAX_YEAR}
                onValueChange={value =>
                  setLocalFilters(prev => ({
                    ...prev,
                    yearTo: Math.round(value),
                  }))
                }
                minimumValue={localFilters.yearFrom ?? MIN_YEAR}
                maximumValue={MAX_YEAR}
                step={1}
                minimumTrackTintColor="#E50914"
                maximumTrackTintColor={isDark ? '#374151' : '#d1d5db'}
                thumbTintColor="#E50914"
              />
              <View className="flex-row justify-between">
                <Text className="text-xs text-light-muted dark:text-dark-muted">
                  {localFilters.yearFrom ?? MIN_YEAR}
                </Text>
                <Text className="text-xs text-light-muted dark:text-dark-muted">
                  {MAX_YEAR}
                </Text>
              </View>
            </View>
          </View>

          {/* Actor Search Section */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-light-text dark:text-dark-text">
              {t('filters.actor') || 'Actor'}
            </Text>

            {/* Selected Actors */}
            {localFilters.selectedActors.length > 0 && (
              <View className="mb-3 flex-row flex-wrap gap-2">
                {localFilters.selectedActors.map(actor => (
                  <View
                    key={actor.id}
                    className="flex-row items-center gap-2 rounded-full bg-netflix-500/20 py-1 pl-1 pr-3"
                  >
                    {actor.profile_path ? (
                      <Image
                        source={{
                          uri: `https://image.tmdb.org/t/p/w92${actor.profile_path}`,
                        }}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-light-border dark:bg-dark-border">
                        <Ionicons
                          name="person"
                          size={14}
                          color={isDark ? '#a3a3a3' : '#737373'}
                        />
                      </View>
                    )}
                    <Text className="text-sm font-medium text-netflix-500">
                      {actor.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeActor(actor.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#E50914" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Search Input */}
            {localFilters.selectedActors.length < 3 && (
              <View className="relative">
                <View className="flex-row items-center rounded-xl border-2 border-light-border bg-light-surface px-3 dark:border-dark-border dark:bg-dark-surface">
                  <Ionicons
                    name="search"
                    size={18}
                    color={isDark ? '#a3a3a3' : '#737373'}
                  />
                  <TextInput
                    value={actorSearchQuery}
                    onChangeText={handleActorSearch}
                    placeholder={t('filters.searchActor') || 'Search for an actor...'}
                    placeholderTextColor={isDark ? '#a3a3a3' : '#737373'}
                    className="ml-2 flex-1 py-3 text-base text-light-text dark:text-dark-text"
                  />
                  {isSearchingActors && (
                    <ActivityIndicator size="small" color="#E50914" />
                  )}
                </View>

                {/* Suggestions Dropdown */}
                {actorSuggestions.length > 0 && (
                  <View className="absolute left-0 right-0 top-14 z-50 rounded-xl border-2 border-light-border bg-light-background shadow-lg dark:border-dark-border dark:bg-dark-background">
                    {actorSuggestions.slice(0, 5).map(actor => (
                      <TouchableOpacity
                        key={actor.id}
                        onPress={() => addActor(actor)}
                        className="flex-row items-center gap-3 border-b border-light-border px-3 py-2 last:border-b-0 dark:border-dark-border"
                      >
                        {actor.profile_path ? (
                          <Image
                            source={{
                              uri: `https://image.tmdb.org/t/p/w92${actor.profile_path}`,
                            }}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-light-border dark:bg-dark-border">
                            <Ionicons
                              name="person"
                              size={20}
                              color={isDark ? '#a3a3a3' : '#737373'}
                            />
                          </View>
                        )}
                        <Text className="flex-1 text-base text-light-text dark:text-dark-text">
                          {actor.name}
                        </Text>
                        <Ionicons
                          name="add-circle-outline"
                          size={22}
                          color="#E50914"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {localFilters.selectedActors.length >= 3 && (
              <Text className="text-sm text-light-muted dark:text-dark-muted">
                {t('filters.maxActors') || 'Maximum 3 actors selected'}
              </Text>
            )}
          </View>

          {/* Sort Section */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-light-text dark:text-dark-text">
              {t('filters.sortBy') || 'Sort By'}
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleSortChange('vote_average')}
                style={getButtonBorderRadius()}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-2 border-2 py-3',
                  localFilters.sortBy === 'vote_average'
                    ? 'border-netflix-500 bg-netflix-500/10'
                    : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                <Ionicons
                  name="star"
                  size={18}
                  color={
                    localFilters.sortBy === 'vote_average'
                      ? '#E50914'
                      : isDark
                        ? '#ffffff'
                        : '#0f172a'
                  }
                />
                <Text
                  className={cn(
                    'text-sm font-medium',
                    localFilters.sortBy === 'vote_average'
                      ? 'text-netflix-500'
                      : 'text-light-text dark:text-dark-text'
                  )}
                >
                  {t('movies.sortByRating') || 'Rating'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSortChange('release_date')}
                style={getButtonBorderRadius()}
                className={cn(
                  'flex-1 flex-row items-center justify-center gap-2 border-2 py-3',
                  localFilters.sortBy === 'release_date'
                    ? 'border-netflix-500 bg-netflix-500/10'
                    : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                <Ionicons
                  name="calendar"
                  size={18}
                  color={
                    localFilters.sortBy === 'release_date'
                      ? '#E50914'
                      : isDark
                        ? '#ffffff'
                        : '#0f172a'
                  }
                />
                <Text
                  className={cn(
                    'text-sm font-medium',
                    localFilters.sortBy === 'release_date'
                      ? 'text-netflix-500'
                      : 'text-light-text dark:text-dark-text'
                  )}
                >
                  {t('movies.sortByDate') || 'Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Platforms Section */}
          {availableProviders.length > 0 && (
            <View className="mb-6">
              <Text className="mb-3 text-base font-semibold text-light-text dark:text-dark-text">
                {t('filters.platforms') || 'Platforms'}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {availableProviders.map(provider => (
                  <TouchableOpacity
                    key={provider}
                    onPress={() => toggleProvider(provider)}
                    style={getButtonBorderRadius()}
                    className={cn(
                      'border-2 px-4 py-2',
                      localFilters.selectedProviders.has(provider)
                        ? 'border-netflix-500 bg-netflix-500/10'
                        : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        localFilters.selectedProviders.has(provider)
                          ? 'font-semibold text-netflix-500'
                          : 'text-light-text dark:text-dark-text'
                      )}
                    >
                      {provider}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View className="border-t border-light-border p-4 dark:border-dark-border">
          {/* Apply Filters Button */}
          <TouchableOpacity
            onPress={handleApplyFilters}
            style={getButtonBorderRadius()}
            className="mb-3 bg-netflix-500 py-4"
          >
            <Text className="text-center text-base font-semibold text-white">
              {t('filters.apply') || 'Apply Filters'}
            </Text>
          </TouchableOpacity>

          {/* Refine Search Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={handleRefineSearch}
              style={getButtonBorderRadius()}
              className="flex-row items-center justify-center gap-2 border-2 border-netflix-500 py-4"
            >
              <Ionicons name="search" size={20} color="#E50914" />
              <Text className="text-center text-base font-semibold text-netflix-500">
                {t('filters.refineSearch') || 'Search with these filters'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
