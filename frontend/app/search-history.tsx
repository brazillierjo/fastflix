/**
 * Search History Screen
 * Shows all recent searches with tap-to-search functionality
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeData } from '@/hooks/useHomeData';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
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

  const searches = recentSearches
    .map((item: string | { query?: string; label?: string }) =>
      typeof item === 'string' ? item : item.query || item.label || ''
    )
    .filter((l: string) => l.length > 0);

  const handleSelect = async (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem('@fastflix/prefill_query', query);
    router.back();
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
            <TouchableOpacity
              onPress={() => handleSelect(query)}
              activeOpacity={0.5}
              className={`flex-row items-center bg-light-card px-4 py-3.5 dark:bg-dark-card ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === searches.length - 1 ? 'rounded-b-xl' : 'border-b border-light-borderSubtle dark:border-dark-borderSubtle'
              }`}
            >
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
              <Ionicons
                name='arrow-up'
                size={18}
                color={isDark ? '#48484A' : '#C7C7CC'}
                style={{ transform: [{ rotate: '-45deg' }], marginLeft: 8 }}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
