/**
 * AddToWatchlistButton - Toggle button to add/remove from watchlist
 * Shows filled bookmark when in watchlist, outline when not
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlistToggle } from '@/hooks/useWatchlist';
import { WatchlistProvider } from '@/types/api';
import { MotiView } from 'moti';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AddToWatchlistButtonProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  providers: WatchlistProvider[];
  country: string;
  /** Style variant: 'icon' for just icon, 'button' for full button with text */
  variant?: 'icon' | 'button';
  /** Size of the icon */
  size?: 'small' | 'medium' | 'large';
}

export default function AddToWatchlistButton({
  tmdbId,
  mediaType,
  title,
  posterPath,
  providers,
  country,
  variant = 'icon',
  size = 'medium',
}: AddToWatchlistButtonProps) {
  const { t } = useLanguage();

  const { inWatchlist, isLoading, isToggling, toggle } = useWatchlistToggle(
    tmdbId,
    mediaType,
    {
      title,
      posterPath,
      providers,
      country,
    }
  );

  const handlePress = async () => {
    // Haptic feedback
    await Haptics.impactAsync(
      inWatchlist
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
    toggle();
  };

  // Size configurations
  const sizeConfig = {
    small: { iconSize: 20, padding: 8 },
    medium: { iconSize: 24, padding: 10 },
    large: { iconSize: 28, padding: 12 },
  };

  const { iconSize, padding } = sizeConfig[size];

  if (isLoading) {
    return (
      <View style={{ padding }}>
        <ActivityIndicator size='small' color='#E50914' />
      </View>
    );
  }

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isToggling}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ padding }}
      >
        <MotiView
          animate={{
            scale: isToggling ? 0.9 : 1,
          }}
          transition={{
            type: 'spring',
            damping: 15,
          }}
        >
          {isToggling ? (
            <ActivityIndicator size='small' color='#E50914' />
          ) : (
            <Ionicons
              name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
              size={iconSize}
              color={inWatchlist ? '#E50914' : '#ffffff'}
            />
          )}
        </MotiView>
      </TouchableOpacity>
    );
  }

  // Button variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isToggling}
      className={`flex-row items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 ${
        inWatchlist
          ? 'border-netflix-500 bg-netflix-500/10'
          : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
      }`}
    >
      <MotiView
        animate={{
          scale: isToggling ? 0.9 : 1,
          rotate: isToggling ? '10deg' : '0deg',
        }}
        transition={{
          type: 'spring',
          damping: 15,
        }}
      >
        {isToggling ? (
          <ActivityIndicator size='small' color='#E50914' />
        ) : (
          <Ionicons
            name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={inWatchlist ? '#E50914' : '#a3a3a3'}
          />
        )}
      </MotiView>
      <Text
        className={`text-sm font-semibold ${
          inWatchlist
            ? 'text-netflix-500'
            : 'text-light-text dark:text-dark-text'
        }`}
      >
        {inWatchlist
          ? t('watchlist.inWatchlist') || 'In Watchlist'
          : t('watchlist.add') || 'Add to Watchlist'}
      </Text>
    </TouchableOpacity>
  );
}
