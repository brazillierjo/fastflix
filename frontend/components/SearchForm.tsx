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
  Modal,
  PanResponder,
  Platform,
  Pressable,
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
  const [showInfoModal, setShowInfoModal] = useState(false);
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
            className='mb-8'
          >
            <Text className='mb-3 text-4xl font-bold text-light-text dark:text-dark-text'>
              {t('welcome.title')}
            </Text>
            <Text className='mb-3 text-base text-light-textSecondary dark:text-dark-textSecondary'>
              {t('welcome.subtitle')}
            </Text>
            <Text className='text-sm leading-relaxed text-light-textMuted dark:text-dark-textMuted'>
              {t('welcome.description')}
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
            className='mb-5'
          >
            {/* Action Buttons Row */}
            <View className='mb-3 flex-row items-center justify-end gap-2'>
              {/* Info Button */}
              <TouchableOpacity
                onPress={() => setShowInfoModal(true)}
                style={getSquircle(20)}
                className='items-center justify-center bg-cinematic-200 px-3 py-2 dark:bg-cinematic-700'
              >
                <Ionicons
                  name='information-circle-outline'
                  size={18}
                  color={isDark ? '#a3a3a3' : '#525252'}
                />
              </TouchableOpacity>

              {/* Example Button */}
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
              delay: 300,
              type: 'timing',
              duration: 600,
            }}
          >
            <TouchableOpacity
              onPress={onSearch}
              disabled={loading}
              className={cn(
                'items-center px-6 py-5',
                loading
                  ? 'bg-cinematic-600'
                  : 'bg-netflix-500 active:bg-netflix-600'
              )}
              style={[
                getButtonBorderRadius(),
                !loading ? getNetflixGlow(isDark) : undefined,
              ]}
            >
              <Text className='text-base font-semibold text-white'>
                {loading ? t('welcome.generating') : t('welcome.searchButton')}
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowInfoModal(false)}
      >
        <Pressable
          className='flex-1 items-center justify-center bg-black/60'
          onPress={() => setShowInfoModal(false)}
        >
          <Pressable
            onPress={e => e.stopPropagation()}
            style={getSquircle(20)}
            className='mx-6 max-w-md bg-light-surface p-6 dark:bg-dark-surface'
          >
            <View className='mb-4 flex-row items-center gap-3'>
              <View
                style={getSquircle(12)}
                className='items-center justify-center bg-netflix-500/10 p-2'
              >
                <Ionicons name='settings-outline' size={20} color='#E50914' />
              </View>
              <Text className='flex-1 text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('welcome.languageTip.title')}
              </Text>
            </View>

            <Text className='mb-5 text-sm leading-relaxed text-light-textSecondary dark:text-dark-textSecondary'>
              {t('welcome.languageTip.description')}{' '}
              <Link
                href='/profile'
                onPress={() => setShowInfoModal(false)}
                asChild
              >
                <Text className='text-sm font-semibold text-netflix-500 underline'>
                  {t('welcome.languageTip.profileLink')}
                </Text>
              </Link>
            </Text>

            <TouchableOpacity
              onPress={() => setShowInfoModal(false)}
              style={getSquircle(12)}
              className='items-center bg-netflix-500 py-3'
            >
              <Text className='font-semibold text-white'>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
