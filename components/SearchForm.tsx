import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import Slider from '@react-native-community/slider';
import { MotiText, MotiView } from 'moti';
import React, { useRef } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
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
}: SearchFormProps) {
  const { t } = useLanguage();

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  const screenWidth = Dimensions.get('window').width;
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      textInputRef.current?.blur();
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1'
    >
      <ScrollView
        ref={scrollViewRef}
        className='flex-1 bg-light-background dark:bg-dark-background'
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
        {...panResponder.panHandlers}
      >
        <View className='flex-1 justify-center px-6 py-8'>
          {/* Welcome Section */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 800,
            }}
            className='mb-8'
          >
            <Text className='mb-2 text-center text-3xl font-bold text-light-text dark:text-dark-text'>
              {t('welcome.title')}
            </Text>
            <Text className='text-center text-lg text-light-muted dark:text-dark-muted'>
              {t('welcome.subtitle')}
            </Text>
          </MotiView>

          {/* Search Input */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 200,
              type: 'timing',
              duration: 600,
            }}
            className='mb-6'
          >
            <TextInput
              ref={textInputRef}
              value={query}
              onChangeText={setQuery}
              placeholder={t('welcome.placeholder')}
              placeholderTextColor='#9CA3AF'
              className='rounded-xl border border-light-border bg-light-card p-4 text-base text-light-text dark:border-dark-border dark:bg-dark-card dark:text-dark-text'
              multiline
              numberOfLines={3}
              textAlignVertical='top'
            />
          </MotiView>

          {/* Settings Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              delay: 300,
              type: 'timing',
              duration: 600,
            }}
            className='mb-6 rounded-xl bg-light-card p-4 dark:bg-dark-card'
          >
            {/* Number of Recommendations */}
            <View className='mb-4'>
              <Text className='mb-2 text-base font-semibold text-light-text dark:text-dark-text'>
                {t('welcome.numberOfRecommendations')}:{' '}
                {numberOfRecommendations}
              </Text>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={numberOfRecommendations}
                onValueChange={setNumberOfRecommendations}
                minimumTrackTintColor='#3B82F6'
                maximumTrackTintColor='#E5E7EB'
                thumbTintColor='#3B82F6'
              />
            </View>

            {/* Content Type Toggles */}
            <View className='space-y-3'>
              <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
                {t('welcome.contentType')}
              </Text>

              {/* Movies Toggle */}
              <TouchableOpacity
                onPress={() => setIncludeMovies(!includeMovies)}
                className='flex-row items-center justify-between rounded-lg bg-light-background p-3 dark:bg-dark-background'
              >
                <Text className='text-base text-light-text dark:text-dark-text'>
                  🎬 {t('welcome.movies')}
                </Text>
                <View
                  className={cn(
                    'h-6 w-11 rounded-full',
                    includeMovies
                      ? 'bg-light-primary dark:bg-dark-primary'
                      : 'bg-light-muted dark:bg-dark-muted'
                  )}
                >
                  <View
                    className={cn(
                      'h-5 w-5 rounded-full bg-white transition-transform',
                      includeMovies ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                    style={{
                      marginTop: 2,
                    }}
                  />
                </View>
              </TouchableOpacity>

              {/* TV Shows Toggle */}
              <TouchableOpacity
                onPress={() => setIncludeTvShows(!includeTvShows)}
                className='flex-row items-center justify-between rounded-lg bg-light-background p-3 dark:bg-dark-background'
              >
                <Text className='text-base text-light-text dark:text-dark-text'>
                  📺 {t('welcome.tvShows')}
                </Text>
                <View
                  className={cn(
                    'h-6 w-11 rounded-full',
                    includeTvShows
                      ? 'bg-light-primary dark:bg-dark-primary'
                      : 'bg-light-muted dark:bg-dark-muted'
                  )}
                >
                  <View
                    className={cn(
                      'h-5 w-5 rounded-full bg-white transition-transform',
                      includeTvShows ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                    style={{
                      marginTop: 2,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </MotiView>

          {/* Search Button */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
