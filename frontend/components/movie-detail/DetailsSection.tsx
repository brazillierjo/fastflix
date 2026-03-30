import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Image, Linking, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSquircle } from '@/utils/designHelpers';
import type { DetailedInfoData } from './types';

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function getLanguageName(code: string): string {
  const map: { [k: string]: string } = {
    en: 'English', fr: 'French', es: 'Spanish', de: 'German',
    it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
    pt: 'Portuguese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
  };
  return map[code] || code.toUpperCase();
}

interface DetailsSectionProps {
  detailedInfo: DetailedInfoData;
  title: string;
  mediaType: 'movie' | 'tv';
  tmdbId: number;
}

export default function DetailsSection({ detailedInfo, title, mediaType, tmdbId }: DetailsSectionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t, language: langCode } = useLanguage();

  const handleOpenTMDB = () => {
    const url = mediaType === 'tv'
      ? `https://www.themoviedb.org/tv/${tmdbId}`
      : `https://www.themoviedb.org/movie/${tmdbId}`;
    Linking.openURL(url);
  };

  const hasAnyDetail =
    detailedInfo.original_title ||
    detailedInfo.original_language ||
    detailedInfo.spoken_languages?.length ||
    detailedInfo.production_countries?.length ||
    (mediaType === 'movie' && detailedInfo.budget && detailedInfo.budget > 0) ||
    detailedInfo.belongs_to_collection ||
    (mediaType === 'tv' && detailedInfo.networks?.length) ||
    (mediaType === 'tv' && detailedInfo.in_production);

  return (
    <>
      {/* Metadata card */}
      {hasAnyDetail && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 370 }}
        >
          <View
            style={[getSquircle(14)]}
            className='mb-6 border border-light-border bg-light-surface/50 p-4 dark:border-dark-border dark:bg-dark-surface/50'
          >
            {detailedInfo.original_title && detailedInfo.original_title !== title && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='text-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('movieDetail.originalTitle') || 'Original title'}: {detailedInfo.original_title}
                </Text>
              </View>
            )}
            {detailedInfo.original_language && detailedInfo.original_language !== langCode?.slice(0, 2) && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='language-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('movieDetail.originalLanguage') || 'Original'}: {getLanguageName(detailedInfo.original_language)}
                </Text>
              </View>
            )}
            {detailedInfo.spoken_languages && detailedInfo.spoken_languages.length > 0 && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='chatbubble-ellipses-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('movieDetail.spokenLanguages') || 'Languages'}: {detailedInfo.spoken_languages.map(l => l.name || l.english_name).join(', ')}
                </Text>
              </View>
            )}
            {detailedInfo.production_countries && detailedInfo.production_countries.length > 0 && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='globe-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {detailedInfo.production_countries.map(c => c.name).join(', ')}
                </Text>
              </View>
            )}
            {mediaType === 'movie' && detailedInfo.budget && detailedInfo.budget > 0 && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='cash-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {formatCurrency(detailedInfo.budget)} {t('movieDetail.budget') || 'budget'}
                  {detailedInfo.revenue && detailedInfo.revenue > 0
                    ? ` · ${formatCurrency(detailedInfo.revenue)} ${t('movieDetail.boxOffice') || 'box office'}`
                    : ''}
                </Text>
              </View>
            )}
            {detailedInfo.belongs_to_collection && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='albums-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('movieDetail.partOf') || 'Part of'} {detailedInfo.belongs_to_collection.name}
                </Text>
              </View>
            )}
            {mediaType === 'tv' && detailedInfo.networks && detailedInfo.networks.length > 0 && (
              <View className='mb-3 flex-row items-center gap-2'>
                <Ionicons name='tv-outline' size={15} color={isDark ? '#a3a3a3' : '#737373'} />
                <Text className='flex-1 text-sm text-light-textSecondary dark:text-dark-textSecondary'>
                  {t('movieDetail.networks') || 'Networks'}: {detailedInfo.networks.map(n => n.name).join(', ')}
                </Text>
              </View>
            )}
            {mediaType === 'tv' && detailedInfo.in_production && (
              <View className='flex-row items-center gap-2'>
                <View className='h-2 w-2 rounded-full bg-green-500' />
                <Text className='text-sm font-medium text-green-500'>
                  {t('movieDetail.inProduction') || 'Currently in production'}
                </Text>
              </View>
            )}
          </View>
        </MotiView>
      )}

      {/* Production Companies */}
      {detailedInfo.production_companies && detailedInfo.production_companies.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 380 }}
        >
          <View className='mb-6'>
            <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
              {t('movieDetail.production') || 'Production'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {detailedInfo.production_companies.map((company) => (
                <View
                  key={`company-${company.id}`}
                  style={[getSquircle(10)]}
                  className='flex-row items-center gap-2 bg-light-surface px-3 py-2 dark:bg-dark-surface'
                >
                  {company.logo_path ? (
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w92${company.logo_path}` }}
                      style={{ width: 24, height: 24 }}
                      resizeMode='contain'
                    />
                  ) : null}
                  <Text className='text-sm font-medium text-light-text dark:text-dark-text'>
                    {company.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </MotiView>
      )}

      {/* External Links */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 390 }}
      >
        <View className='mb-8 flex-row gap-3'>
          {detailedInfo.imdb_id && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://www.imdb.com/title/${detailedInfo.imdb_id}`)}
              activeOpacity={0.7}
              style={getSquircle(12)}
              className='flex-1 flex-row items-center justify-center gap-2 border border-[#f5c518]/30 bg-[#f5c518]/10 py-3'
              accessibilityLabel='Open on IMDb'
              accessibilityRole='link'
            >
              <Ionicons name='open-outline' size={16} color='#f5c518' />
              <Text className='text-sm font-semibold' style={{ color: '#f5c518' }}>IMDb</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleOpenTMDB}
            activeOpacity={0.7}
            style={getSquircle(12)}
            className='flex-1 flex-row items-center justify-center gap-2 border border-[#01d277]/30 bg-[#01d277]/10 py-3'
            accessibilityLabel='Open on TMDB'
            accessibilityRole='link'
          >
            <Ionicons name='open-outline' size={16} color='#01d277' />
            <Text className='text-sm font-semibold' style={{ color: '#01d277' }}>TMDB</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    </>
  );
}
