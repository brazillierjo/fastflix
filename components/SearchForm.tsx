import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
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
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: 'timing',
              duration: 800,
            }}
            className='mb-10'
          >
            <Text
              className='mb-6 text-center text-3xl font-bold text-light-text dark:text-dark-text'
              style={{ textDecorationLine: 'underline' }}
            >
              {t('welcome.title')}
            </Text>
            <Text className='mb-4 text-justify text-base text-light-text dark:text-dark-text'>
              {t('welcome.subtitle')}
            </Text>
            <Text className='text-justify text-base leading-relaxed text-light-text dark:text-dark-text'>
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
            <View className='mb-2 flex-row justify-end'>
              <TouchableOpacity
                onPress={fillWithRandomExample}
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

            <TextInput
              ref={textInputRef}
              value={query}
              onChangeText={setQuery}
              onFocus={handleInputFocus}
              placeholder={'e.g.: ' + placeholder}
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
