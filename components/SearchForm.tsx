import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import Slider from '@react-native-community/slider';
import { MotiText, MotiView } from 'moti';
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
  showResults: boolean;
  setIsMenuOpen: (open: boolean) => void;
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
  showResults,
  setIsMenuOpen,
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
      {/* Header with title and menu */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        className={cn(
          'flex-row items-center px-6 pb-6 pt-4',
          showResults ? 'justify-start' : 'justify-between'
        )}
      >
        {!showResults && (
          <>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 200, type: 'timing', duration: 400 }}
              className={cn(
                'text-left text-2xl font-semibold text-light-primary dark:text-dark-primary'
              )}
            >
              {t('welcome.title')}
            </MotiText>

            <TouchableOpacity
              className={cn('p-2')}
              onPress={() => setIsMenuOpen(true)}
            >
              <Text
                className={cn(
                  'text-2xl text-light-primary dark:text-dark-primary'
                )}
              >
                ☰
              </Text>
            </TouchableOpacity>
          </>
        )}
      </MotiView>

      {/* Friendly message at the top */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          delay: 100,
          type: 'timing',
          duration: 600,
        }}
        className='mb-8 px-4'
      >
        <Text className='text-center text-lg leading-relaxed text-light-primary dark:text-dark-primary'>
          {t('welcome.friendlyMessage')}
        </Text>
      </MotiView>

      {/* Container to push everything to the bottom */}
      <View className='mt-auto px-6'>
        {/* Options */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 200,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6 rounded-xl bg-light-card p-4 dark:bg-dark-card'
        >
          <Text className='mb-4 text-lg font-semibold text-light-primary dark:text-dark-primary'>
            {t('welcome.options')}
          </Text>

          <View className='mb-5 flex-row items-center justify-between'>
            <Text className='text-base text-light-primary font-semibold dark:text-dark-primary'>
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

          <View className='-mt-5 mb-4'>
            <Slider
              className='w-full'
              minimumValue={1}
              maximumValue={20}
              step={1}
              value={numberOfRecommendations}
              onValueChange={value =>
                setNumberOfRecommendations(Math.round(value))
              }
              minimumTrackTintColor='#0ea5e9'
              maximumTrackTintColor='#e2e8f0'
              thumbTintColor='#0ea5e9'
            />
          </View>

          <View className='mb-5'>
          <Text className='text-base mb-4 text-light-primary font-semibold dark:text-dark-primary'>
              {t('settings.movieType')}
            </Text>

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
                    : 'bg-light-muted dark:bg-dark-muted'
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
                    : 'bg-light-muted dark:bg-dark-muted'
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

        {/* Description input */}
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

        {/* Generate button at the bottom */}
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
                ? 'bg-light-muted dark:bg-dark-muted'
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
