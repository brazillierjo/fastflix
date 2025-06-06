import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { MotiView } from 'moti';
import React from 'react';
import {
  Dimensions,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  numberOfRecommendations: number;
  setNumberOfRecommendations: (count: number) => void;
  includeMovies: boolean;
  setIncludeMovies: (include: boolean) => void;
  includeTvShows: boolean;
  setIncludeTvShows: (include: boolean) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchForm({
  query,
  setQuery,
  numberOfRecommendations,
  setNumberOfRecommendations,
  includeMovies,
  setIncludeMovies,
  includeTvShows,
  setIncludeTvShows,
  onSearch,
  loading,
}: SearchFormProps) {
  const { t } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth - 48;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: event => {
      const { locationX } = event.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
      const newValue = Math.round(percentage * 9) + 1;
      setNumberOfRecommendations(newValue);
    },
  });

  return (
    <>
      {/* Message convivial en haut */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          delay: 100,
          type: 'timing',
          duration: 600,
        }}
        className='mb-8'
      >
        <Text className='text-center text-lg text-light-primary dark:text-dark-primary leading-relaxed'>
          {t('welcome.friendlyMessage')}
        </Text>
      </MotiView>

      {/* Conteneur pour tout pousser en bas */}
      <View className='mt-auto'>
        {/* Options */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 200,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <Text className='mb-4 text-lg font-semibold text-light-primary dark:text-dark-primary'>
            {t('welcome.options')}
          </Text>

          <View className='mb-5 flex-row items-center justify-between'>
            <Text className='text-base text-light-primary dark:text-dark-primary'>
              {t('settings.numberOfRecommendations')}
            </Text>
            <View className='flex-row items-center'>
              <View className='min-w-[40px] items-center rounded-[20px] bg-light-primary px-3 py-1 dark:bg-dark-primary'>
                <Text className='text-base font-semibold text-light-background dark:text-dark-background'>
                  {numberOfRecommendations}
                </Text>
              </View>
            </View>
          </View>

          <View className='mb-5'>
            <View
              {...panResponder.panHandlers}
              className='h-5 justify-center py-2'
            >
              <View className='relative h-1 rounded-sm bg-light-border dark:bg-dark-border'>
                <View
                  className='h-1 rounded-sm bg-light-primary dark:bg-dark-primary'
                  style={{
                    width: `${((numberOfRecommendations - 1) / 9) * 100}%`,
                  }}
                />
                <View
                  className='absolute -ml-2 h-4 w-4 rounded-full bg-light-primary dark:bg-dark-primary'
                  style={{
                    left: `${((numberOfRecommendations - 1) / 9) * 100}%`,
                    top: -6,
                  }}
                />
              </View>
            </View>
          </View>

          <View className='mb-5'>
            <TouchableOpacity
              onPress={() => setIncludeMovies(!includeMovies)}
              className={cn(
                'mb-3 flex-row items-center justify-between rounded-xl p-4',
                includeMovies
                  ? 'bg-light-primary dark:bg-dark-primary'
                  : 'bg-light-input dark:bg-dark-input'
              )}
            >
              <Text
                className={cn(
                  'text-base font-medium',
                  includeMovies
                    ? 'text-light-background dark:text-dark-background'
                    : 'text-light-primary dark:text-dark-primary'
                )}
              >
                {t('settings.movies')}
              </Text>
              <View
                className={cn(
                  'h-6 w-6 items-center justify-center rounded-xl',
                  includeMovies
                    ? 'bg-light-background dark:bg-dark-background'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              >
                {includeMovies && (
                  <Text className='text-base font-semibold text-light-primary dark:text-dark-primary'>
                    ✓
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIncludeTvShows(!includeTvShows)}
              className={cn(
                'flex-row items-center justify-between rounded-xl p-4',
                includeTvShows
                  ? 'bg-light-primary dark:bg-dark-primary'
                  : 'bg-light-input dark:bg-dark-input'
              )}
            >
              <Text
                className={cn(
                  'text-base font-medium',
                  includeTvShows
                    ? 'text-light-background dark:text-dark-background'
                    : 'text-light-primary dark:text-dark-primary'
                )}
              >
                {t('settings.tvShows')}
              </Text>
              <View
                className={cn(
                  'h-6 w-6 items-center justify-center rounded-xl',
                  includeTvShows
                    ? 'bg-light-background dark:bg-dark-background'
                    : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              >
                {includeTvShows && (
                  <Text className='text-base font-semibold text-light-primary dark:text-dark-primary'>
                    ✓
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Input de description */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 300,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <TextInput
            className='min-h-[100px] rounded-xl bg-light-input p-4 text-base text-light-primary dark:bg-dark-input dark:text-dark-primary'
            style={{
              textAlignVertical: 'top',
            }}
            placeholder={t('welcome.inputPlaceholder')}
            placeholderTextColor='#94a3b8'
            value={query}
            onChangeText={setQuery}
            multiline
            maxLength={200}
          />
        </MotiView>

        {/* Bouton générer en bas */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 400,
            type: 'timing',
            duration: 600,
          }}
        >
          <TouchableOpacity
            onPress={onSearch}
            disabled={loading}
            className={cn(
              'items-center rounded-xl p-4',
              loading
                ? 'bg-neutral-400 dark:bg-neutral-600'
                : 'bg-light-primary dark:bg-dark-primary'
            )}
          >
            <Text className='text-base font-semibold text-light-background dark:text-dark-background'>
              {loading ? t('welcome.generating') : t('welcome.searchButton')}
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </>
  );
}
