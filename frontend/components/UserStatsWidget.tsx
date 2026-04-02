import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { backendAPIService } from '@/services/backend-api.service';
import { getSquircle } from '@/utils/designHelpers';

interface Stats {
  totalSearches: number;
  watchlistCount: number;
  watchedCount: number;
  memberSince: string;
}

export default function UserStatsWidget() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: async (): Promise<Stats | null> => {
      const res = await backendAPIService.getUserStats();
      if (res.success && res.data) return res.data as Stats;
      return null;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

  if (!stats || (stats.totalSearches === 0 && stats.watchlistCount === 0))
    return null;

  const memberDate = new Date(stats.memberSince);
  const monthsDiff = Math.max(
    1,
    Math.round(
      (Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
  );
  const memberLabel =
    monthsDiff < 2
      ? t('home.stats.newMember')
      : t('home.stats.memberSince').replace(
          '{{months}}',
          String(monthsDiff)
        );

  const items = [
    {
      icon: 'search' as const,
      value: stats.totalSearches,
      label: t('home.stats.searches'),
    },
    {
      icon: 'bookmark' as const,
      value: stats.watchlistCount,
      label: t('home.stats.watchlist'),
    },
    {
      icon: 'eye' as const,
      value: stats.watchedCount,
      label: t('home.stats.watched'),
    },
  ].filter((item) => item.value > 0);

  return (
    <View className="mb-2 px-6">
      <View
        style={getSquircle(14)}
        className="flex-row items-center justify-around border border-light-border bg-light-surface px-4 py-3 dark:border-dark-border dark:bg-dark-surface"
      >
        {items.map((item, i) => (
          <View key={i} className="items-center">
            <Ionicons
              name={item.icon}
              size={16}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
            />
            <Text className="mt-0.5 text-lg font-bold text-light-text dark:text-dark-text">
              {item.value}
            </Text>
            <Text className="text-[10px] text-light-muted dark:text-dark-muted">
              {item.label}
            </Text>
          </View>
        ))}
        <View className="items-center">
          <Ionicons
            name="calendar-outline"
            size={16}
            color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
          />
          <Text className="mt-0.5 text-xs font-medium text-light-muted dark:text-dark-muted">
            {memberLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}
