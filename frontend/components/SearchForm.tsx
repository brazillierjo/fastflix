import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import {
  getNetflixGlow,
  getPlaceholderColor,
  getSquircle,
  getButtonBorderRadius,
} from '@/utils/designHelpers';
import { Link } from 'expo-router';
import { MotiView } from 'moti';
import React, { useRef, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface SearchFormProps {
  query: string;
  setQuery: (query: string) => void;

  onSearch: () => void;
  loading: boolean;
}

export default function SearchForm({
  query,
  setQuery,

  onSearch,
  loading,
}: SearchFormProps) {
  const { t, getRandomPlaceholder } = useLanguage();
  const [placeholder, setPlaceholder] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Generate a random placeholder when component mounts or language changes
  useEffect(() => {
    setPlaceholder(getRandomPlaceholder());
  }, [getRandomPlaceholder]);

  // Function to fill input with random example
  const fillWithRandomExample = () => {
    const randomExample = getRandomPlaceholder();
    setQuery(randomExample);
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

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
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 600,
            }}
            className='mb-12'
          >
            <Text className='mb-4 text-5xl font-bold text-light-text dark:text-dark-text'>
              {t('welcome.title')}
            </Text>
            <Text className='mb-4 text-lg text-light-textSecondary dark:text-dark-textSecondary'>
              {t('welcome.subtitle')}
            </Text>
            <Text className='text-base leading-relaxed text-light-textMuted dark:text-dark-textMuted'>
              {t('welcome.description')}
            </Text>
          </MotiView>

          {/* Language Configuration Info */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              delay: 200,
              type: 'timing',
              duration: 600,
            }}
            className='mb-8'
          >
            <View
              style={getSquircle(18)}
              className='border border-netflix-500/20 bg-netflix-500/5 p-4'
            >
              <View className='mb-2 flex-row items-center gap-2'>
                <Ionicons name='settings-outline' size={16} color='#E50914' />
                <Text className='text-sm font-semibold text-netflix-500'>
                  {t('welcome.languageTip.title')}
                </Text>
              </View>
              <Text className='text-xs leading-relaxed text-light-textSecondary dark:text-dark-textSecondary'>
                {t('welcome.languageTip.description')}{' '}
                <Link href='/profile' asChild>
                  <Text className='text-xs font-semibold text-netflix-500 underline'>
                    {t('welcome.languageTip.profileLink')}
                  </Text>
                </Link>
              </Text>
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
            {/* Example Button */}
            <View className='mb-3 flex-row justify-end'>
              <TouchableOpacity
                onPress={fillWithRandomExample}
                style={getSquircle(20)}
                className='flex-row items-center gap-1 bg-netflix-500/10 px-4 py-2'
                disabled={loading}
              >
                <Ionicons name='bulb-outline' size={16} color='#E50914' />
                <Text className='text-xs font-semibold text-netflix-500'>
                  {t('welcome.exampleButton') || 'Exemple'}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              ref={textInputRef}
              value={query}
              onChangeText={setQuery}
              onFocus={handleInputFocus}
              placeholder={'e.g.: ' + placeholder}
              placeholderTextColor={getPlaceholderColor(isDark)}
              className='border-2 border-light-border bg-light-surface p-6 text-lg text-light-text focus:border-netflix-500 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
              multiline
              textAlignVertical='top'
              scrollEnabled={false}
              style={[
                {
                  borderRadius: 14,
                  ...(Platform.OS === 'ios' && {
                    borderCurve: 'continuous' as any,
                  }),
                },
                { minHeight: 100, maxHeight: 140 },
              ]}
            />
          </MotiView>

          {/* Search Button */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
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
                'items-center px-8 py-6',
                loading
                  ? 'bg-cinematic-600'
                  : 'bg-netflix-500 active:bg-netflix-600'
              )}
              style={[
                getButtonBorderRadius(),
                !loading ? getNetflixGlow(isDark) : undefined,
              ]}
            >
              <Text className='text-lg font-semibold text-white'>
                {loading ? t('welcome.generating') : t('welcome.searchButton')}
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
