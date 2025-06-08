import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import Slider from '@react-native-community/slider';
import { MotiView } from 'moti';
import React, { useRef } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  Switch,
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

  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        className='flex-1 bg-light-background dark:bg-dark-background'
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        {...panResponder.panHandlers}
      >
        <View className='flex-1 justify-center px-6'>
          {/* Welcome Section */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 800,
            }}
            className='mb-10'
          >
            <Text className='mb-6 text-center text-3xl font-bold text-light-text dark:text-dark-text'>
              {t('welcome.title')}
            </Text>
            <Text className='mb-4 text-justify text-base text-light-muted dark:text-dark-muted'>
              {t('welcome.subtitle')}
            </Text>
            <Text className='text-justify text-base leading-relaxed text-light-muted dark:text-dark-muted'>
              {t('welcome.description')}
            </Text>
          </MotiView>

          {/* Settings Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              delay: 200,
              type: 'timing',
              duration: 600,
            }}
            className='mb-8 rounded-xl bg-light-card p-4 dark:bg-dark-card'
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
                maximumValue={20}
                step={1}
                value={numberOfRecommendations}
                onValueChange={setNumberOfRecommendations}
                minimumTrackTintColor='#3B82F6'
                maximumTrackTintColor='#E5E7EB'
                thumbTintColor='#3B82F6'
              />
            </View>

            {/* Content Type Toggles */}
            <View className='gap-3'>
              <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
                {t('welcome.contentType')}
              </Text>

              {/* Movies Toggle */}
              <View className='flex-row items-center justify-between rounded-lg bg-light-background p-3 dark:bg-dark-background'>
                <Text className='text-base text-light-text dark:text-dark-text'>
                  🎬 {t('welcome.movies')}
                </Text>

                <Switch
                  value={includeMovies}
                  onValueChange={setIncludeMovies}
                  trackColor={{ false: '#9CA3AF', true: '#3B82F6' }}
                  thumbColor={includeMovies ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>

              {/* TV Shows Toggle */}
              <View className='flex-row items-center justify-between rounded-lg bg-light-background p-3 dark:bg-dark-background'>
                <Text className='text-base text-light-text dark:text-dark-text'>
                  📺 {t('welcome.tvShows')}
                </Text>
                <Switch
                  value={includeTvShows}
                  onValueChange={setIncludeTvShows}
                  trackColor={{ false: '#9CA3AF', true: '#3B82F6' }}
                  thumbColor={includeTvShows ? '#FFFFFF' : '#F3F4F6'}
                />
              </View>
            </View>
          </MotiView>

          {/* Search Input */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 300,
              type: 'timing',
              duration: 600,
            }}
            className='mb-6'
          >
            <TextInput
              ref={textInputRef}
              value={query}
              onChangeText={setQuery}
              onFocus={handleInputFocus}
              placeholder={t('welcome.placeholder')}
              placeholderTextColor='#9CA3AF'
              className='rounded-xl border border-light-border bg-light-card p-4 text-base text-light-text dark:border-dark-border dark:bg-dark-card dark:text-dark-text'
              multiline
              textAlignVertical='top'
              scrollEnabled={false}
              style={{ minHeight: 80, maxHeight: 120 }}
            />
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
