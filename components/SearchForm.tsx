import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
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
                className='flex-row items-center rounded-lg bg-light-primary/10 px-3 py-1 dark:bg-dark-primary/10'
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
              placeholder={placeholder}
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
