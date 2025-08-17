/**
 * Optimized Search Form Component
 * Enhanced with proper memoization and performance optimizations
 */

import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { APP_CONFIG } from '@/constants/app';

interface OptimizedSearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  loading: boolean;
}

// Memoized sub-components for better performance
const WelcomeSection = memo(({ t }: { t: (key: string) => string }) => (
  <MotiView
    from={{ opacity: 0, translateY: -20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: 'timing',
      duration: APP_CONFIG.ANIMATION.DURATION_MEDIUM,
    }}
    className='mb-10'
  >
    <Text className='mb-6 text-center text-3xl font-bold text-light-text dark:text-dark-text'>
      {t('welcome.title')}
    </Text>
    <Text className='mb-4 text-justify text-base text-light-text dark:text-dark-text'>
      {t('welcome.subtitle')}
    </Text>
    <Text className='text-justify text-base leading-relaxed text-light-text dark:text-dark-text'>
      {t('welcome.description')}
    </Text>
  </MotiView>
));

WelcomeSection.displayName = 'WelcomeSection';

const LanguageTip = memo(({ t }: { t: (key: string) => string }) => (
  <MotiView
    from={{ opacity: 0, translateY: 10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      delay: 200,
      type: 'timing',
      duration: APP_CONFIG.ANIMATION.DURATION_MEDIUM,
    }}
    className='mb-6'
  >
    <View className='rounded-lg border border-light-accent/20 bg-light-accent/5 p-4 dark:border-dark-accent/20 dark:bg-dark-accent/5'>
      <Text className='mb-2 text-sm font-medium text-light-accent dark:text-dark-accent'>
        ⚙️ {t('welcome.languageTip.title')}
      </Text>
      <Text className='text-xs leading-relaxed text-light-text/80 dark:text-dark-text/80'>
        {t('welcome.languageTip.description')}{' '}
        <Link href='/profile' asChild>
          <Text className='text-xs font-medium text-light-primary underline dark:text-dark-primary'>
            {t('welcome.languageTip.profileLink')}
          </Text>
        </Link>
      </Text>
    </View>
  </MotiView>
));

LanguageTip.displayName = 'LanguageTip';

interface ExampleButtonProps {
  onPress: () => void;
  loading: boolean;
  t: (key: string) => string;
}

const ExampleButton = memo(({ onPress, loading, t }: ExampleButtonProps) => (
  <View className='mb-2 flex-row justify-end'>
    <TouchableOpacity
      onPress={onPress}
      className='flex-row items-center rounded-lg bg-light-primary/10 px-3 py-1 shadow-sm shadow-light-primary/20 dark:bg-dark-primary/10 dark:shadow-dark-primary/20'
      style={{
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      }}
      disabled={loading}
    >
      <Text className='mr-1 text-sm'>💡</Text>
      <Text className='text-xs font-medium text-light-primary dark:text-dark-primary'>
        {t('welcome.exampleButton') || 'Exemple'}
      </Text>
    </TouchableOpacity>
  </View>
));

ExampleButton.displayName = 'ExampleButton';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  placeholder: string;
  textInputRef: React.RefObject<TextInput | null>;
}

const SearchInput = memo(
  ({
    value,
    onChangeText,
    onFocus,
    placeholder,
    textInputRef,
  }: SearchInputProps) => (
    <TextInput
      ref={textInputRef}
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      placeholder={`e.g.: ${placeholder}`}
      placeholderTextColor='#9CA3AF'
      className='rounded-xl border border-light-border bg-light-card p-4 text-base text-light-text dark:border-dark-border dark:bg-dark-card dark:text-dark-text'
      multiline
      textAlignVertical='top'
      scrollEnabled={false}
      style={{ minHeight: 80, maxHeight: 120 }}
    />
  )
);

SearchInput.displayName = 'SearchInput';

interface SearchButtonProps {
  onPress: () => void;
  loading: boolean;
  t: (key: string) => string;
}

const SearchButton = memo(({ onPress, loading, t }: SearchButtonProps) => (
  <MotiView
    from={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      delay: 400,
      type: 'timing',
      duration: APP_CONFIG.ANIMATION.DURATION_MEDIUM,
    }}
  >
    <TouchableOpacity
      onPress={onPress}
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
));

SearchButton.displayName = 'SearchButton';

const OptimizedSearchForm: React.FC<OptimizedSearchFormProps> = memo(
  ({ query, setQuery, onSearch, loading }) => {
    const { t, getRandomPlaceholder } = useLanguage();
    const [placeholder, setPlaceholder] = useState('');

    // Refs for performance optimization
    const scrollViewRef = useRef<ScrollView>(null);
    const textInputRef = useRef<TextInput>(null);

    // Memoized callback for generating random placeholder
    const generatePlaceholder = useCallback(() => {
      setPlaceholder(getRandomPlaceholder());
    }, [getRandomPlaceholder]);

    // Generate placeholder on mount and language change
    useEffect(() => {
      generatePlaceholder();
    }, [generatePlaceholder]);

    // Memoized callback for filling with random example
    const fillWithRandomExample = useCallback(() => {
      const randomExample = getRandomPlaceholder();
      setQuery(randomExample);
    }, [getRandomPlaceholder, setQuery]);

    // Memoized callback for input focus handling
    const handleInputFocus = useCallback(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, APP_CONFIG.ANIMATION.DURATION_SHORT);
    }, []);

    // Memoized PanResponder for keyboard dismissal
    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            textInputRef.current?.blur();
          },
        }),
      []
    );

    // Memoized keyboard avoiding view props
    const keyboardAvoidingViewProps = useMemo(
      () => ({
        behavior:
          Platform.OS === 'ios' ? ('padding' as const) : ('height' as const),
        className: 'flex-1',
        keyboardVerticalOffset: Platform.OS === 'ios' ? 100 : 0,
      }),
      []
    );

    return (
      <KeyboardAvoidingView {...keyboardAvoidingViewProps}>
        <ScrollView
          ref={scrollViewRef}
          className='flex-1 bg-light-background dark:bg-dark-background'
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          {...panResponder.panHandlers}
        >
          <View className='flex-1 justify-center px-6'>
            <WelcomeSection t={t} />
            <LanguageTip t={t} />

            {/* Search Input Section */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 300,
                type: 'timing',
                duration: APP_CONFIG.ANIMATION.DURATION_MEDIUM,
              }}
              className='mb-6'
            >
              <ExampleButton
                onPress={fillWithRandomExample}
                loading={loading}
                t={t}
              />
              <SearchInput
                value={query}
                onChangeText={setQuery}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                textInputRef={textInputRef}
              />
            </MotiView>

            <SearchButton onPress={onSearch} loading={loading} t={t} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);

OptimizedSearchForm.displayName = 'OptimizedSearchForm';

export default OptimizedSearchForm;
