/**
 * Search History Screen
 * Shows recent searches with copy-to-clipboard
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeData } from '@/hooks/useHomeData';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchHistoryScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { recentSearches } = useHomeData();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const searches = recentSearches
    .slice(0, 15)
    .map((item: string | { query?: string; label?: string }) =>
      typeof item === 'string' ? item : item.query || item.label || ''
    )
    .filter((l: string) => l.length > 0);

  const handleCopy = async (query: string, index: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(query);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      {/* Header */}
      <View className='flex-row items-center border-b border-light-border px-4 py-3 dark:border-dark-border'>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel='Go back'
          accessibilityRole='button'
          className='mr-3'
        >
          <Ionicons
            name='chevron-back'
            size={24}
            color={isDark ? '#fff' : '#1C1C1E'}
          />
        </TouchableOpacity>
        <Text className='flex-1 text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('home.recentSearches') || 'Recent Searches'}
        </Text>
      </View>

      {searches.length === 0 ? (
        <View className='flex-1 items-center justify-center px-8'>
          <Ionicons
            name='time-outline'
            size={48}
            color={isDark ? '#38383A' : '#D1D1D6'}
          />
          <Text className='mt-4 text-center text-base text-light-muted dark:text-dark-muted'>
            {t('search.noHistory') || 'No recent searches yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={searches}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item: query, index }) => (
            <View
              className={`flex-row items-center bg-light-card dark:bg-dark-card ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === searches.length - 1 ? 'rounded-b-xl' : 'border-b border-light-borderSubtle dark:border-dark-borderSubtle'
              }`}
            >
              <View className='flex-1 flex-row items-center px-4 py-3.5'>
                <Ionicons
                  name='time-outline'
                  size={18}
                  color='#8E8E93'
                  style={{ marginRight: 14 }}
                />
                <Text
                  className='flex-1 text-base text-light-text dark:text-dark-text'
                  numberOfLines={2}
                >
                  {query}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopy(query, index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className='px-4 py-3.5'
                accessibilityLabel='Copy'
                accessibilityRole='button'
              >
                <Ionicons
                  name={copiedIndex === index ? 'checkmark-circle' : 'copy-outline'}
                  size={20}
                  color={copiedIndex === index ? '#22c55e' : (isDark ? '#8E8E93' : '#8E8E93')}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Toast */}
      {copiedIndex !== null && (
        <View
          className='absolute bottom-24 left-0 right-0 items-center'
          pointerEvents='none'
        >
          <View className='rounded-full bg-black/80 px-5 py-2.5 dark:bg-white/20'>
            <Text className='text-sm font-medium text-white'>
              {t('common.copied') || 'Copied!'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
