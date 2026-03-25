/**
 * CollectionsSection - Curated movie collections as horizontal scrollable cards
 * Displayed on the home screen between trending and recent searches
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { getCardShadow, getSquircle } from '@/utils/designHelpers';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

const COLLECTIONS = [
  { id: 'cozy', emoji: '\u{1F6CB}\uFE0F', titleKey: 'collections.cozy', query: 'cozy feel-good movies for a rainy day' },
  { id: 'thriller', emoji: '\u{1F631}', titleKey: 'collections.thriller', query: 'intense psychological thrillers that keep you on edge' },
  { id: 'classic', emoji: '\u{1F3AC}', titleKey: 'collections.classic', query: 'timeless classic movies everyone should watch' },
  { id: 'binge', emoji: '\u{1F4FA}', titleKey: 'collections.binge', query: 'addictive TV series perfect for binge watching' },
  { id: 'family', emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}', titleKey: 'collections.family', query: 'family friendly movies for all ages' },
  { id: 'hidden', emoji: '\u{1F48E}', titleKey: 'collections.hidden', query: 'hidden gem movies that are underrated' },
  { id: 'laugh', emoji: '\u{1F602}', titleKey: 'collections.laugh', query: 'funniest comedies that will make you laugh' },
  { id: 'scifi', emoji: '\u{1F680}', titleKey: 'collections.scifi', query: 'mind-bending sci-fi movies and series' },
];

const GRADIENT_COLORS: Record<string, readonly [string, string]> = {
  cozy: ['#4A2C1A', '#2D1B10'],
  thriller: ['#2A1A3A', '#1A0F24'],
  classic: ['#1A2A3A', '#0F1A24'],
  binge: ['#1A3A2A', '#0F241A'],
  family: ['#3A2A1A', '#24190F'],
  hidden: ['#1A2A2A', '#0F1A1A'],
  laugh: ['#3A3A1A', '#24240F'],
  scifi: ['#1A1A3A', '#0F0F24'],
};

const GRADIENT_COLORS_LIGHT: Record<string, readonly [string, string]> = {
  cozy: ['#FFF3E8', '#FFE8D0'],
  thriller: ['#F0E8FF', '#E0D0FF'],
  classic: ['#E8F0FF', '#D0E0FF'],
  binge: ['#E8FFF0', '#D0FFE0'],
  family: ['#FFF0E8', '#FFE0D0'],
  hidden: ['#E8FFFF', '#D0FFFF'],
  laugh: ['#FFFFE8', '#FFFFD0'],
  scifi: ['#E8E8FF', '#D0D0FF'],
};

interface CollectionsSectionProps {
  delay?: number;
}

export default function CollectionsSection({ delay = 350 }: CollectionsSectionProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = (query: string) => {
    router.push({
      pathname: '/search' as never,
      params: { query },
    });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay, type: 'timing', duration: 600 }}
      className='mt-8'
    >
      <Text className='mb-3 px-6 text-lg font-semibold text-light-text dark:text-dark-text'>
        {t('collections.title') || 'Collections'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
      >
        {COLLECTIONS.map((collection, i) => {
          const colors = isDark
            ? GRADIENT_COLORS[collection.id]
            : GRADIENT_COLORS_LIGHT[collection.id];

          return (
            <MotiView
              key={collection.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: delay + i * 60,
                type: 'timing',
                duration: 400,
              }}
            >
              <TouchableOpacity
                onPress={() => handlePress(collection.query)}
                activeOpacity={0.7}
                style={[
                  getSquircle(12),
                  getCardShadow(isDark),
                  { backgroundColor: colors[0], width: 140, height: 80 },
                ]}
                className='items-center justify-center border border-light-border px-3 dark:border-dark-border'
              >
                <Text className='text-2xl'>{collection.emoji}</Text>
                <Text
                  className='mt-1 text-center text-xs font-semibold text-light-text dark:text-dark-text'
                  numberOfLines={1}
                >
                  {t(collection.titleKey) || collection.id}
                </Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </ScrollView>
    </MotiView>
  );
}
