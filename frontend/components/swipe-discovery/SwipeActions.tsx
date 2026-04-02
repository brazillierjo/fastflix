import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlistToggle } from '@/hooks/useWatchlist';
import { useMovieRating, useRateMovie, useDeleteRating } from '@/hooks/useRating';
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
  const { t, country } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [feedbackState, setFeedbackState] = useState<
    'like' | 'dislike' | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

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
    country,
  });

  const { isWatched } = useMovieRating(item.tmdb_id);
  const { rateMovie, isRating } = useRateMovie();
  const { deleteRating, isDeleting } = useDeleteRating();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastKey((k) => k + 1);
    setTimeout(() => setToastMessage(null), 1800);
  }, []);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (feedbackState === 'like') {
      setFeedbackState(null);
      backendAPIService.deleteRating(item.tmdb_id).catch(() => {});
    } else {
      setFeedbackState('like');
      trackSwipeLike(item.tmdb_id);
      showToast(t('swipeDiscovery.tasteUpdated'));
      backendAPIService
        .submitSwipeFeedback({
          tmdb_id: item.tmdb_id,
          type: 'like',
          title: item.title,
          media_type: mediaType,
          poster_path: item.poster_path || undefined,
        })
        .catch(() => {});
    }
  }, [item, mediaType, feedbackState, t, showToast]);

  const handleDislike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (feedbackState === 'dislike') {
      setFeedbackState(null);
      backendAPIService.deleteRating(item.tmdb_id).catch(() => {});
    } else {
      setFeedbackState('dislike');
      trackSwipeDislike(item.tmdb_id);
      showToast(t('swipeDiscovery.tasteUpdated'));
      backendAPIService
        .submitSwipeFeedback({
          tmdb_id: item.tmdb_id,
          type: 'dislike',
          title: item.title,
          media_type: mediaType,
          poster_path: item.poster_path || undefined,
        })
        .catch(() => {});
    }
  }, [item, mediaType, feedbackState, t, showToast]);

  const handleWatchlist = useCallback(() => {
    if (!isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackSwipeWatchlist(item.tmdb_id);
    toggleWatchlist();
    showToast(
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
    showToast,
  ]);

  const handleWatched = useCallback(() => {
    if (!isAuthenticated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isWatched) {
      deleteRating(item.tmdb_id);
      showToast(t('swipeDiscovery.unmarkedWatched'));
    } else {
      rateMovie({
        tmdb_id: item.tmdb_id,
        rating: 0,
        title: item.title,
        media_type: mediaType,
        poster_path: item.poster_path || undefined,
      });
      showToast(t('swipeDiscovery.markedWatched'));
    }
  }, [
    isAuthenticated,
    isWatched,
    item,
    mediaType,
    rateMovie,
    deleteRating,
    t,
    showToast,
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

  // Outline when inactive, filled when active
  const actions = useMemo(
    () => [
      {
        icon: 'heart-outline',
        activeIcon: 'heart',
        color: '#fff',
        activeColor: '#ff2d55',
        onPress: handleLike,
        label: t('swipeDiscovery.like'),
        isActive: feedbackState === 'like',
      },
      {
        icon: 'close-circle-outline',
        activeIcon: 'close-circle',
        color: '#fff',
        activeColor: '#ff453a',
        onPress: handleDislike,
        label: t('swipeDiscovery.dislike'),
        isActive: feedbackState === 'dislike',
      },
      {
        icon: 'eye-outline',
        activeIcon: 'eye',
        color: '#fff',
        activeColor: '#30d158',
        onPress: handleWatched,
        label: t('swipeDiscovery.watched'),
        isActive: isWatched,
        disabled: isRating || isDeleting || !isAuthenticated,
      },
      {
        icon: 'bookmark-outline',
        activeIcon: 'bookmark',
        color: '#fff',
        activeColor: '#ffd60a',
        onPress: handleWatchlist,
        label: t('swipeDiscovery.watchlist'),
        isActive: inWatchlist,
        disabled: isToggling || !isAuthenticated,
      },
      {
        icon: 'arrow-redo-outline',
        activeIcon: 'arrow-redo',
        color: '#fff',
        onPress: handleShare,
        label: t('swipeDiscovery.share'),
      },
      {
        icon: 'information-circle-outline',
        activeIcon: 'information-circle',
        color: '#fff',
        onPress: handleDetails,
        label: t('swipeDiscovery.details'),
      },
    ],
    [
      feedbackState,
      inWatchlist,
      isWatched,
      isToggling,
      isRating,
      isDeleting,
      isAuthenticated,
      handleLike,
      handleDislike,
      handleWatchlist,
      handleWatched,
      handleShare,
      handleDetails,
      t,
    ]
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.column}>
        {actions.map((action, index) => {
          const active = action.isActive;
          const iconName =
            active && action.activeIcon ? action.activeIcon : action.icon;
          const iconColor =
            active && action.activeColor ? action.activeColor : action.color;

          return (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              disabled={action.disabled}
              activeOpacity={0.6}
              style={styles.actionBtn}
            >
              <Ionicons
                name={iconName as keyof typeof Ionicons.glyphMap}
                size={28}
                color={iconColor}
                style={styles.icon}
              />
              <Text
                style={[styles.label, active && { color: iconColor }]}
                numberOfLines={1}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom toast */}
      <AnimatePresence>
        {toastMessage && (
          <MotiView
            key={toastKey}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 10 }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.toast}
          >
            <View style={styles.toastInner}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  column: {
    position: 'absolute',
    right: 10,
    bottom: '16%',
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    alignItems: 'center',
    width: 56,
  },
  icon: {
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastInner: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toastText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
