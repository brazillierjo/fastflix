import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Image, Text, useColorScheme, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { getCardShadow, getSquircle } from '@/utils/designHelpers';
import { Skeleton } from '@/components/Skeleton';
import type { StreamingProvider } from './types';

function getAvailabilityBadge(availabilityType: string | undefined, t: (key: string) => string) {
  switch (availabilityType) {
    case 'flatrate':
      return { label: t('availability.subscription') || 'Subscription', bgColor: 'bg-green-500/20', textColor: 'text-green-500', icon: 'checkmark-circle' as const, iconColor: '#22c55e' };
    case 'rent':
      return { label: t('availability.rent') || 'Rent', bgColor: 'bg-blue-500/20', textColor: 'text-blue-500', icon: 'time' as const, iconColor: '#3b82f6' };
    case 'buy':
      return { label: t('availability.buy') || 'Buy', bgColor: 'bg-amber-500/20', textColor: 'text-amber-500', icon: 'cart' as const, iconColor: '#f59e0b' };
    case 'ads':
      return { label: t('availability.ads') || 'Free (Ads)', bgColor: 'bg-purple-500/20', textColor: 'text-purple-500', icon: 'play-circle' as const, iconColor: '#a855f7' };
    default:
      return null;
  }
}

interface StreamingSectionProps {
  providers: StreamingProvider[];
  loadingDetails: boolean;
}

export default function StreamingSection({ providers, loadingDetails }: StreamingSectionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  if (loadingDetails && providers.length === 0) {
    return (
      <View className='mb-6'>
        <Skeleton width={140} height={20} borderRadius={6} />
        <View style={{ marginTop: 12, gap: 10 }}>
          {[1, 2].map(i => (
            <View key={i} className='flex-row items-center gap-3'>
              <Skeleton width={34} height={34} borderRadius={8} />
              <Skeleton width={120} height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (providers.length === 0) return null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 250 }}
    >
      <View className='mb-6'>
        <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
          {t('movies.availableOn')}
        </Text>
        <View
          style={[getSquircle(14), getCardShadow(isDark)]}
          className='bg-light-card p-3 dark:bg-dark-card'
        >
          <View className='gap-2'>
            {providers.map((provider, idx) => {
              const badge = getAvailabilityBadge(provider.availability_type, t);
              return (
                <View
                  key={`provider-${idx}-${provider.provider_name}`}
                  className='flex-row items-center py-0.5'
                  accessibilityLabel={`${provider.provider_name}${badge ? `, ${badge.label}` : ''}`}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                    className='h-[34px] w-[34px] rounded-md bg-dark-surface p-1 dark:bg-light-surface'
                    resizeMode='contain'
                    accessibilityLabel={`${provider.provider_name} logo`}
                  />
                  <Text className='ml-3 flex-1 text-sm font-medium text-light-text dark:text-dark-text'>
                    {provider.provider_name}
                  </Text>
                  {badge && (
                    <View className={cn('flex-row items-center gap-1 rounded-full px-2.5 py-1', badge.bgColor)}>
                      <Ionicons name={badge.icon} size={12} color={badge.iconColor} />
                      <Text className={cn('text-xs font-medium', badge.textColor)}>{badge.label}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </MotiView>
  );
}
