import { Ionicons } from '@expo/vector-icons';
import ForYouSection from '@/components/ForYouSection';
import MyRatingsSection from '@/components/MyRatingsSection';
import NewReleasesSection from '@/components/NewReleasesSection';
import WatchlistSection from '@/components/WatchlistSection';
import SubscriptionModal from '@/components/SubscriptionModal';
import TrialBanner from '@/components/TrialBanner';
import TrialEndingModal from '@/components/TrialEndingModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { useHomeData } from '@/hooks/useHomeData';
import {
  getCardShadow,
  getSquircle,
  typography,
} from '@/utils/designHelpers';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Skeleton } from '@/components/Skeleton';

const SETUP_GENRES_KEY = '@fastflix/setup_genres';
const SETUP_PLATFORMS_KEY = '@fastflix/setup_platforms';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export default function HomeScreen() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { hasUnlimitedAccess, customerInfo } = useSubscription();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    dailyPick,
    trending,
    recentSearches,
    quota,
    isLoading: isHomeLoading,
    isRefetching,
    refetch,
  } = useHomeData();

  // Guest mode: read setup genres/platforms from AsyncStorage
  const [setupGenres, setSetupGenres] = useState<number[]>([]);
  const [setupPlatforms, setSetupPlatforms] = useState<number[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      let cancelled = false;
      AsyncStorage.getItem(SETUP_GENRES_KEY).then(value => {
        if (cancelled) return;
        if (value) {
          try {
            setSetupGenres(JSON.parse(value));
          } catch {
            // ignore parse errors
          }
        }
      });
      AsyncStorage.getItem(SETUP_PLATFORMS_KEY).then(value => {
        if (cancelled) return;
        if (value) {
          try {
            setSetupPlatforms(JSON.parse(value));
          } catch {
            // ignore parse errors
          }
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [isAuthenticated]);

  const hasSetupData = setupGenres.length > 0 || setupPlatforms.length > 0;

  // Subscription modal state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Trial ending modal state
  const [showTrialEndingModal, setShowTrialEndingModal] = useState(false);
  const [trialEndingDay, setTrialEndingDay] = useState(5);

  // Compute trial day from customerInfo
  const trialDay = useMemo(() => {
    if (!customerInfo) return null;
    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    const trialEntitlement = activeEntitlements.find(
      e => e.periodType === 'TRIAL'
    );
    if (!trialEntitlement?.latestPurchaseDate) return null;

    const purchaseDate = new Date(trialEntitlement.latestPurchaseDate);
    const now = new Date();
    const diffMs = now.getTime() - purchaseDate.getTime();
    const daysSinceStart = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.min(7, Math.max(1, daysSinceStart + 1));
  }, [customerInfo]);

  // Show trial ending modal on day 5, 6, or 7 (once per milestone)
  useEffect(() => {
    if (trialDay === null || trialDay < 5) return;

    let cancelled = false;
    const checkAndShowModal = async () => {
      const key = `@fastflix/trial_modal_shown_day_${trialDay}`;
      const alreadyShown = await AsyncStorage.getItem(key);
      if (cancelled) return;
      if (!alreadyShown) {
        await AsyncStorage.setItem(key, 'true');
        if (cancelled) return;
        setTrialEndingDay(trialDay);
        setShowTrialEndingModal(true);
      }
    };

    checkAndShowModal();
    return () => {
      cancelled = true;
    };
  }, [trialDay]);

  // Filter trending by user's genre preferences for guest "Recommended for you"
  const guestRecommendations = React.useMemo(() => {
    if (isAuthenticated || setupGenres.length === 0 || trending.length === 0) {
      return [];
    }
    const filtered = trending.filter(
      (item: { genre_ids?: number[] }) =>
        item.genre_ids && item.genre_ids.some((g: number) => setupGenres.includes(g))
    );
    return filtered.length > 0 ? filtered : trending.slice(0, 6);
  }, [isAuthenticated, setupGenres, trending]);

  // Format current date (memoized to avoid recreating on every render)
  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
        <View className='px-6 pt-8'>
          <Skeleton width='60%' height={28} borderRadius={8} />
          <Skeleton width='40%' height={14} borderRadius={6} style={{ marginTop: 8 }} />
        </View>
        <View className='mt-6 px-6'>
          <Skeleton width='100%' height={52} borderRadius={16} />
        </View>
        <View className='mt-6 px-6'>
          <Skeleton width='50%' height={18} borderRadius={6} />
          <Skeleton width='100%' height={200} borderRadius={16} style={{ marginTop: 12 }} />
        </View>
        <View className='mt-6 px-6'>
          <Skeleton width='60%' height={18} borderRadius={6} />
          <View className='mt-3 flex-row gap-3'>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width={130} height={195} borderRadius={12} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Extract first name or use generic greeting
  const greetingBase = t('home.greeting') || 'Hello!';
  const greeting = user?.name
    ? greetingBase.replace('!', `, ${user.name.split(' ')[0]}!`)
    : greetingBase;

  // Quota display
  const quotaText = quota
    ? hasUnlimitedAccess
      ? t('home.quotaUnlimited') || 'Unlimited searches'
      : (t('home.quotaRemaining') || '{{count}} searches remaining today').replace(
          '{{count}}',
          String(quota.remaining ?? 0)
        )
    : null;

  const showUpgradePrompt =
    !hasUnlimitedAccess && quota && typeof quota.remaining === 'number' && quota.remaining <= 2;

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      <ScrollView
        className='flex-1'
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor='#E50914'
          />
        }
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          className='flex-row items-start justify-between px-6 pt-8'
        >
          {/* Left: Greeting + Date */}
          <View className='flex-1'>
            <Text
              style={typography.title1}
              className='text-light-text dark:text-dark-text'
            >
              {greeting}
            </Text>
            <Text
              style={typography.body}
              className='mt-1 capitalize text-light-muted dark:text-dark-muted'
            >
              {currentDate}
            </Text>
          </View>

          {/* Right: FastFlix logo with premium ring */}
          <TouchableOpacity
            onPress={() => {
              if (!hasUnlimitedAccess) {
                setShowSubscriptionModal(true);
              }
            }}
            activeOpacity={hasUnlimitedAccess ? 1 : 0.7}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                borderWidth: 2,
                borderColor: hasUnlimitedAccess ? '#D4AF37' : isDark ? '#333' : '#ddd',
                padding: 1,
              }}
            >
              <Image
                source={require('@/assets/appstore.png')}
                style={{ width: '100%', height: '100%', borderRadius: 11 }}
                resizeMode='cover'
              />
            </View>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                textAlign: 'center',
                marginTop: 3,
                color: hasUnlimitedAccess ? '#D4AF37' : isDark ? '#666' : '#999',
                letterSpacing: 0.3,
              }}
            >
              {hasUnlimitedAccess ? 'PRO' : 'FREE'}
            </Text>
          </TouchableOpacity>
        </MotiView>

        {/* Trial Banner */}
        <TrialBanner onSubscribe={() => setShowSubscriptionModal(true)} />

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 50, type: 'timing', duration: 500 }}
            className='mt-4 px-6'
          >
            <TouchableOpacity
              onPress={() => router.push('/subscription' as never)}
              style={[getSquircle(12), getCardShadow(isDark)]}
              className='flex-row items-center gap-3 border border-red-500/30 bg-red-500/10 px-4 py-3'
            >
              <Ionicons name='sparkles' size={20} color='#E50914' />
              <Text className='flex-1 text-sm font-medium text-light-text dark:text-dark-text'>
                {t('home.upgradeForMore') || 'Upgrade for unlimited searches'}
              </Text>
              <Ionicons
                name='chevron-forward'
                size={16}
                color={isDark ? '#a3a3a3' : '#737373'}
              />
            </TouchableOpacity>
          </MotiView>
        )}

        {/* AI Search CTA */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100, type: 'timing', duration: 500 }}
          className='mt-6 px-6'
        >
          <TouchableOpacity
            onPress={() => router.push('/search' as never)}
            activeOpacity={0.8}
            style={[
              getSquircle(16),
              {
                shadowColor: '#E50914',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.4 : 0.2,
                shadowRadius: 12,
                elevation: 6,
              },
            ]}
            className='flex-row items-center justify-center gap-2.5 bg-netflix-500 px-6 py-4'
          >
            <Ionicons name='sparkles' size={18} color='#fff' />
            <Text className='text-center text-base font-semibold text-white'>
              {t('home.searchCTA')}
            </Text>
          </TouchableOpacity>
        </MotiView>

        {/* Daily Pick Card */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: 'timing', duration: 600 }}
          className='mt-6 px-6'
        >
          <Text
            style={typography.title3}
            className='mb-3 text-light-text dark:text-dark-text'
          >
            {t('home.dailyPick')}
          </Text>
          {dailyPick ? (
            <View
              style={[getSquircle(16), getCardShadow(isDark)]}
              className='overflow-hidden border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
            >
              {dailyPick.poster_path && (
                <Image
                  source={{
                    uri: `${TMDB_IMAGE_BASE}/w500${dailyPick.poster_path}`,
                  }}
                  className='h-48 w-full'
                  resizeMode='cover'
                />
              )}
              <View className='px-4 py-4'>
                <View className='flex-row items-center justify-between'>
                  <Text
                    className='flex-1 text-lg font-bold text-light-text dark:text-dark-text'
                    numberOfLines={1}
                  >
                    {dailyPick.title || dailyPick.name}
                  </Text>
                  {dailyPick.vote_average > 0 && (
                    <View className='ml-2 flex-row items-center gap-1'>
                      <Ionicons name='star' size={14} color='#fbbf24' />
                      <Text className='text-sm font-medium text-light-muted dark:text-dark-muted'>
                        {dailyPick.vote_average.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
                {dailyPick.overview && (
                  <Text
                    className='mt-2 text-sm leading-5 text-light-muted dark:text-dark-muted'
                    numberOfLines={3}
                  >
                    {dailyPick.overview}
                  </Text>
                )}
              </View>
            </View>
          ) : isHomeLoading ? (
            <Skeleton width='100%' height={200} borderRadius={16} />
          ) : (
            <View
              style={[getSquircle(16), getCardShadow(isDark)]}
              className='items-center justify-center border border-light-border bg-light-surface px-6 py-10 dark:border-dark-border dark:bg-dark-surface'
            >
              <Ionicons
                name='film-outline'
                size={48}
                color={isDark ? '#525252' : '#a3a3a3'}
              />
              <Text className='mt-4 text-center text-base text-light-muted dark:text-dark-muted'>
                {t('home.dailyPickLoading')}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Trending Section */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, type: 'timing', duration: 600 }}
          className='mt-8'
        >
          <Text
            style={typography.title3}
            className='mb-3 px-6 text-light-text dark:text-dark-text'
          >
            {t('home.trending')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          >
            {trending.length > 0
              ? trending.map((item, i) => (
                  <MotiView
                    key={item.tmdb_id || item.id || i}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 300 + i * 80,
                      type: 'timing',
                      duration: 400,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/movie-detail' as never,
                          params: {
                            tmdbId: String(item.tmdb_id || item.id),
                            mediaType: item.media_type || 'movie',
                            title: item.title || '',
                            posterPath: item.poster_path || '',
                            voteAverage: String(item.vote_average || 0),
                            overview: item.overview || '',
                            providersJson: JSON.stringify(item.providers || []),
                            creditsJson: JSON.stringify([]),
                            detailedInfoJson: JSON.stringify({}),
                          },
                        })
                      }
                      activeOpacity={0.7}
                      style={{ width: 130 }}
                    >
                      <View
                        style={[getSquircle(12), getCardShadow(isDark)]}
                        className='h-[195px] overflow-hidden border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                      >
                        {item.poster_path ? (
                          <Image
                            source={{
                              uri: `${TMDB_IMAGE_BASE}/w342${item.poster_path}`,
                            }}
                            className='h-full w-full'
                            resizeMode='cover'
                          />
                        ) : (
                          <View className='flex-1 items-center justify-center'>
                            <Ionicons
                              name='image-outline'
                              size={28}
                              color={isDark ? '#404040' : '#d4d4d4'}
                            />
                          </View>
                        )}
                      </View>
                      <Text
                        className='mt-1.5 text-xs font-medium text-light-text dark:text-dark-text'
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.providers?.length > 0 && (
                        <View className='mt-1 flex-row gap-1'>
                          {item.providers.slice(0, 3).map((p: any, pi: number) => (
                            <Image
                              key={pi}
                              source={{ uri: `${TMDB_IMAGE_BASE}/w45${p.logo_path}` }}
                              style={{ width: 16, height: 16, borderRadius: 4 }}
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  </MotiView>
                ))
              : isHomeLoading
                ? [1, 2, 3, 4].map(i => (
                    <Skeleton key={i} width={130} height={195} borderRadius={12} />
                  ))
                : [1, 2, 3, 4].map(i => (
                    <View
                      key={i}
                      style={[getSquircle(12), getCardShadow(isDark)]}
                      className='h-44 w-32 items-center justify-center border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                    >
                      <Ionicons
                        name='image-outline'
                        size={28}
                        color={isDark ? '#404040' : '#d4d4d4'}
                      />
                    </View>
                  ))}
          </ScrollView>
        </MotiView>

        {/* New Releases This Week */}
        <NewReleasesSection delay={325} />

        {/* For You - Personalized Recommendations */}
        <ForYouSection delay={350} />

        {/* My Watchlist */}
        <WatchlistSection delay={375} />

        {/* My Ratings */}
        <MyRatingsSection delay={400} />

        {/* Recent Searches - only for authenticated users */}
        {isAuthenticated && recentSearches.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 375, type: 'timing', duration: 600 }}
            className='mt-8 px-6'
          >
            <Text
              style={typography.title3}
              className='mb-3 text-light-text dark:text-dark-text'
            >
              {t('home.recentSearches')}
            </Text>
            <View className='flex-row flex-wrap gap-2'>
              {recentSearches.map((item, i) => {
                const label =
                  typeof item === 'string' ? item : item.query || item.label || '';
                return (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 400 + i * 60,
                      type: 'timing',
                      duration: 300,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/search' as never,
                          params: { query: label },
                        })
                      }
                      style={getSquircle(20)}
                      className='flex-row items-center gap-1.5 border border-light-border bg-light-surface px-3.5 py-2 dark:border-dark-border dark:bg-dark-surface'
                    >
                      <Ionicons
                        name='time-outline'
                        size={14}
                        color={isDark ? '#a3a3a3' : '#737373'}
                      />
                      <Text className='text-sm text-light-text dark:text-dark-text'>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </MotiView>
        )}

      </ScrollView>

      {/* Trial Ending Modal */}
      <TrialEndingModal
        visible={showTrialEndingModal}
        onClose={() => setShowTrialEndingModal(false)}
        onSubscribe={() => setShowSubscriptionModal(true)}
        trialDay={trialEndingDay}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

    </SafeAreaView>
  );
}
