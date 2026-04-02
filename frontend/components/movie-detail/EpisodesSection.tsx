import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCardShadow, getSquircle } from '@/utils/designHelpers';

interface Episode {
  episode_number: number;
  season_number: number;
  name: string;
  air_date: string;
}

interface EpisodesSectionProps {
  nextEpisode: Episode | null;
  lastEpisode: Episode | null;
}

export default function EpisodesSection({
  nextEpisode,
  lastEpisode,
}: EpisodesSectionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, language: langCode } = useLanguage();

  if (!nextEpisode && !lastEpisode) return null;

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(`${dateStr}T00:00:00`);
      return date.toLocaleDateString(langCode || 'en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 290 }}
    >
      <View className='mb-6'>
        <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('movieDetail.episodes') || 'Episodes'}
        </Text>
        <View
          style={[getSquircle(14), getCardShadow(isDark)]}
          className='bg-light-card p-3 dark:bg-dark-card'
        >
          {nextEpisode && (
            <View className='mb-2 flex-row items-center gap-2'>
              <View className='rounded-full bg-green-500/15 p-1'>
                <Ionicons
                  name='arrow-forward-circle'
                  size={16}
                  color='#22c55e'
                />
              </View>
              <View className='flex-1'>
                <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                  {t('movieDetail.nextEpisode') || 'Next'}: S
                  {nextEpisode.season_number}E{nextEpisode.episode_number}
                </Text>
                <Text className='text-xs text-light-textMuted dark:text-dark-textMuted'>
                  {nextEpisode.name} - {formatDate(nextEpisode.air_date)}
                </Text>
              </View>
            </View>
          )}
          {lastEpisode && (
            <View className='flex-row items-center gap-2'>
              <View className='rounded-full bg-blue-500/15 p-1'>
                <Ionicons name='checkmark-circle' size={16} color='#3b82f6' />
              </View>
              <View className='flex-1'>
                <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                  {t('movieDetail.lastEpisode') || 'Latest'}: S
                  {lastEpisode.season_number}E{lastEpisode.episode_number}
                </Text>
                <Text className='text-xs text-light-textMuted dark:text-dark-textMuted'>
                  {lastEpisode.name} - {formatDate(lastEpisode.air_date)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </MotiView>
  );
}
