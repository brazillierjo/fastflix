/**
 * CollectionsSection - Quick search shortcuts as styled CTAs
 * Tapping navigates to search tab with the prompt pre-filled
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSquircle } from '@/utils/designHelpers';
import { typography } from '@/utils/designHelpers';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

interface Collection {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  query: string;
  color: string;
  colorLight: string;
  iconColor: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: 'cozy',
    icon: 'cafe',
    titleKey: 'collections.cozy',
    query: 'cozy feel-good movies for a rainy day',
    color: '#3B2415',
    colorLight: '#FDF2E9',
    iconColor: '#E67E22',
  },
  {
    id: 'thriller',
    icon: 'eye',
    titleKey: 'collections.thriller',
    query: 'intense psychological thrillers that keep you on edge',
    color: '#1A1A2E',
    colorLight: '#EDE7F6',
    iconColor: '#9B59B6',
  },
  {
    id: 'classic',
    icon: 'ribbon',
    titleKey: 'collections.classic',
    query: 'timeless classic movies everyone should watch',
    color: '#1B2631',
    colorLight: '#E8EAF6',
    iconColor: '#5DADE2',
  },
  {
    id: 'binge',
    icon: 'tv',
    titleKey: 'collections.binge',
    query: 'addictive TV series perfect for binge watching',
    color: '#0B3D2E',
    colorLight: '#E8F8F5',
    iconColor: '#2ECC71',
  },
  {
    id: 'family',
    icon: 'people',
    titleKey: 'collections.family',
    query: 'family friendly movies for all ages',
    color: '#3B2507',
    colorLight: '#FEF9E7',
    iconColor: '#F39C12',
  },
  {
    id: 'hidden',
    icon: 'diamond',
    titleKey: 'collections.hidden',
    query: 'hidden gem movies that are underrated',
    color: '#1A2A2A',
    colorLight: '#E0F7FA',
    iconColor: '#00BCD4',
  },
  {
    id: 'laugh',
    icon: 'happy',
    titleKey: 'collections.laugh',
    query: 'funniest comedies that will make you laugh',
    color: '#3A3500',
    colorLight: '#FFFDE7',
    iconColor: '#F1C40F',
  },
  {
    id: 'scifi',
    icon: 'planet',
    titleKey: 'collections.scifi',
    query: 'mind-bending sci-fi movies and series',
    color: '#0D0D3B',
    colorLight: '#E8EAF6',
    iconColor: '#7C4DFF',
  },
];

export default function CollectionsSection({ delay = 350 }: { delay?: number }) {
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
      <Text
        style={typography.title3}
        className='mb-3 px-6 text-light-text dark:text-dark-text'
      >
        {t('collections.title') || 'Collections'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
      >
        {COLLECTIONS.map((collection, i) => (
          <MotiView
            key={collection.id}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: delay + i * 50,
              type: 'timing',
              duration: 350,
            }}
          >
            <TouchableOpacity
              onPress={() => handlePress(collection.query)}
              activeOpacity={0.7}
              style={[
                getSquircle(16),
                {
                  backgroundColor: isDark ? collection.color : collection.colorLight,
                  width: 120,
                  height: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                },
              ]}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name={collection.icon}
                  size={20}
                  color={collection.iconColor}
                />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  textAlign: 'center',
                  color: isDark ? '#fff' : '#1a1a1a',
                }}
                numberOfLines={2}
              >
                {t(collection.titleKey) || collection.id}
              </Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </MotiView>
  );
}
