import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlistToggle } from '@/hooks/useWatchlist';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  backendAPIService,
  type MovieResult,
  type StreamingProvider,
  type Cast,
  type CrewMember,
  type DetailedInfo,
} from '@/services/backend-api.service';
import {
  trackSwipeLike,
  trackSwipeDislike,
  trackSwipeWatchlist,
  trackSwipeShare,
  trackSwipeToDetail,
} from '@/services/analytics';

interface SwipeActionsProps {
  item: MovieResult;
  providers: StreamingProvider[];
  credits: Cast[];
  crew: CrewMember[];
  detailedInfo: DetailedInfo;
}

export default function SwipeActions({
  item,
  providers,
  credits,
  crew,
  detailedInfo,
}: SwipeActionsProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(
    null
  );
  const [showToast, setShowToast] = useState<string | null>(null);

  const mediaType =
    item.media_type === 'tv' ? ('tv' as const) : ('movie' as const);

  const {
    inWatchlist,
    toggle: toggleWatchlist,
    isToggling,
  } = useWatchlistToggle(item.tmdb_id, mediaType, {
    title: item.title,
    posterPath: item.poster_path || null,
    providers: providers || [],
    country: '',
  });

  const showTemporaryToast = useCallback((message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 1500);
  }, []);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFeedbackState('like');
    trackSwipeLike(item.tmdb_id);
    showTemporaryToast(t('swipeDiscovery.tasteUpdated'));
    backendAPIService
      .submitSwipeFeedback({
        tmdb_id: item.tmdb_id,
        type: 'like',
        title: item.title,
        media_type: mediaType,
        poster_path: item.poster_path || undefined,
      })
      .catch(() => {});
  }, [item, mediaType, t, showTemporaryToast]);

  const handleDislike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFeedbackState('dislike');
    trackSwipeDislike(item.tmdb_id);
    showTemporaryToast(t('swipeDiscovery.tasteUpdated'));
    backendAPIService
      .submitSwipeFeedback({
        tmdb_id: item.tmdb_id,
        type: 'dislike',
        title: item.title,
        media_type: mediaType,
        poster_path: item.poster_path || undefined,
      })
      .catch(() => {});
  }, [item, mediaType, t, showTemporaryToast]);

  const handleWatchlist = useCallback(() => {
    if (!isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackSwipeWatchlist(item.tmdb_id);
    toggleWatchlist();
    showTemporaryToast(
      inWatchlist
        ? t('swipeDiscovery.removedFromWatchlist')
        : t('swipeDiscovery.addedToWatchlist')
    );
  }, [
    isAuthenticated,
    item.tmdb_id,
    inWatchlist,
    toggleWatchlist,
    t,
    showTemporaryToast,
  ]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackSwipeShare(item.tmdb_id);
    const tmdbUrl =
      mediaType === 'tv'
        ? `https://www.themoviedb.org/tv/${item.tmdb_id}`
        : `https://www.themoviedb.org/movie/${item.tmdb_id}`;
    try {
      await Share.share({
        message: `${item.title} - ${tmdbUrl}`,
        url: tmdbUrl,
      });
    } catch {}
  }, [item, mediaType]);

  const handleDetails = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackSwipeToDetail(item.tmdb_id);
    router.push({
      pathname: '/movie-detail' as never,
      params: {
        tmdbId: String(item.tmdb_id),
        mediaType,
        title: item.title,
        posterPath: item.poster_path || '',
        voteAverage: String(item.vote_average || 0),
        overview: item.overview || '',
        providersJson: JSON.stringify(providers || []),
        creditsJson: JSON.stringify(credits || []),
        crewJson: JSON.stringify(crew || []),
        detailedInfoJson: JSON.stringify(detailedInfo || {}),
      },
    });
  }, [item, mediaType, providers, credits, crew, detailedInfo, router]);

  const actions = [
    {
      icon: feedbackState === 'like' ? 'heart' : 'heart-outline',
      color: feedbackState === 'like' ? '#E50914' : '#fff',
      onPress: handleLike,
      label: t('swipeDiscovery.like'),
    },
    {
      icon:
        feedbackState === 'dislike' ? 'close-circle' : 'close-circle-outline',
      color: feedbackState === 'dislike' ? '#ef4444' : '#fff',
      onPress: handleDislike,
      label: t('swipeDiscovery.dislike'),
    },
    {
      icon: inWatchlist ? 'bookmark' : 'bookmark-outline',
      color: inWatchlist ? '#fbbf24' : '#fff',
      onPress: handleWatchlist,
      label: t('swipeDiscovery.watchlist'),
      disabled: isToggling || !isAuthenticated,
    },
    {
      icon: 'share-outline',
      color: '#fff',
      onPress: handleShare,
      label: t('swipeDiscovery.share'),
    },
    {
      icon: 'information-circle-outline',
      color: '#fff',
      onPress: handleDetails,
      label: t('swipeDiscovery.details'),
    },
  ] as const;

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          onPress={action.onPress}
          disabled={'disabled' in action ? action.disabled : false}
          style={styles.button}
          activeOpacity={0.7}
        >
          <Ionicons
            name={action.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={action.color}
          />
          <Text style={[styles.label, { color: action.color }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Toast */}
      {showToast && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.toast}
        >
          <Text style={styles.toastText}>{showToast}</Text>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    bottom: '28%',
    alignItems: 'center',
    gap: 16,
    zIndex: 5,
  },
  button: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    right: 56,
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 120,
  },
  toastText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
