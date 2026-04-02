/**
 * Analytics Service - Aptabase event tracking
 * Centralized analytics events for the FastFlix app
 */

import { trackEvent } from '@aptabase/react-native';

// ============================================================================
// Navigation Events
// ============================================================================

export function trackScreenView(screen: string) {
  trackEvent('screen_view', { screen });
}

// ============================================================================
// Authentication Events
// ============================================================================

export function trackSignIn(provider: 'apple' | 'google') {
  trackEvent('sign_in', { provider });
}

export function trackSignOut() {
  trackEvent('sign_out');
}

export function trackDeleteAccount() {
  trackEvent('delete_account');
}

// ============================================================================
// Search Events
// ============================================================================

export function trackSearch(query: string, resultCount: number) {
  trackEvent('search', {
    query_length: query.length,
    result_count: resultCount,
  });
}

export function trackSearchRefine(resultCount: number) {
  trackEvent('search_refine', { result_count: resultCount });
}

export function trackQuickSearch(category: string) {
  trackEvent('quick_search', { category });
}

// ============================================================================
// Movie / TV Show Events
// ============================================================================

export function trackMovieView(tmdbId: number, mediaType: 'movie' | 'tv', title: string) {
  trackEvent('movie_view', { tmdb_id: tmdbId, media_type: mediaType, title });
}

export function trackMovieShare(tmdbId: number, mediaType: 'movie' | 'tv') {
  trackEvent('movie_share', { tmdb_id: tmdbId, media_type: mediaType });
}

export function trackSimilarMovieClick(fromTmdbId: number, toTmdbId: number) {
  trackEvent('similar_movie_click', { from_tmdb_id: fromTmdbId, to_tmdb_id: toTmdbId });
}

export function trackExternalLinkOpen(platform: 'imdb' | 'tmdb', tmdbId: number) {
  trackEvent('external_link_open', { platform, tmdb_id: tmdbId });
}

// ============================================================================
// Watchlist Events
// ============================================================================

export function trackWatchlistAdd(tmdbId: number, mediaType: 'movie' | 'tv') {
  trackEvent('watchlist_add', { tmdb_id: tmdbId, media_type: mediaType });
}

export function trackWatchlistRemove(tmdbId: number, mediaType: 'movie' | 'tv') {
  trackEvent('watchlist_remove', { tmdb_id: tmdbId, media_type: mediaType });
}

export function trackWatchlistShare(itemCount: number) {
  trackEvent('watchlist_share', { item_count: itemCount });
}

export function trackWatchlistRefresh() {
  trackEvent('watchlist_refresh');
}

// ============================================================================
// Rating Events
// ============================================================================

export function trackMarkWatched(tmdbId: number, mediaType: 'movie' | 'tv') {
  trackEvent('mark_watched', { tmdb_id: tmdbId, media_type: mediaType });
}

export function trackUnmarkWatched(tmdbId: number, mediaType: 'movie' | 'tv') {
  trackEvent('unmark_watched', { tmdb_id: tmdbId, media_type: mediaType });
}

export function trackRate(tmdbId: number, rating: number) {
  trackEvent('rate', { tmdb_id: tmdbId, rating });
}

// ============================================================================
// Subscription Events
// ============================================================================

export function trackSubscriptionModalOpen() {
  trackEvent('subscription_modal_open');
}

export function trackSubscriptionPlanSelect(plan: string) {
  trackEvent('subscription_plan_select', { plan });
}

export function trackSubscriptionPurchase(plan: string) {
  trackEvent('subscription_purchase', { plan });
}

export function trackSubscriptionRestore() {
  trackEvent('subscription_restore');
}

// ============================================================================
// Onboarding Events
// ============================================================================

export function trackOnboardingStart() {
  trackEvent('onboarding_start');
}

export function trackOnboardingComplete() {
  trackEvent('onboarding_complete');
}

export function trackOnboardingSkip(atSlide: number) {
  trackEvent('onboarding_skip', { at_slide: atSlide });
}

// ============================================================================
// Settings Events
// ============================================================================

export function trackLanguageChange(language: string) {
  trackEvent('language_change', { language });
}

export function trackFiltersUpdate(country: string, platformCount: number) {
  trackEvent('filters_update', { country, platform_count: platformCount });
}

// ============================================================================
// Engagement Events
// ============================================================================

export function trackDailyPickView(tmdbId: number) {
  trackEvent('daily_pick_view', { tmdb_id: tmdbId });
}

export function trackTrendingClick(tmdbId: number) {
  trackEvent('trending_click', { tmdb_id: tmdbId });
}

export function trackForYouClick(tmdbId: number) {
  trackEvent('for_you_click', { tmdb_id: tmdbId });
}

export function trackNewReleaseClick(tmdbId: number) {
  trackEvent('new_release_click', { tmdb_id: tmdbId });
}

export function trackActorView(personId: number) {
  trackEvent('actor_view', { person_id: personId });
}

export function trackPullToRefresh(screen: string) {
  trackEvent('pull_to_refresh', { screen });
}

export function trackNotificationPermission(granted: boolean) {
  trackEvent('notification_permission', { granted });
}

export function trackAppOpen() {
  trackEvent('app_open');
}

// ============================================================================
// Swipe Discovery Events
// ============================================================================

export function trackSwipeView(tmdbId: number, position: number, source: string) {
  trackEvent('swipe_view', { tmdb_id: tmdbId, position, source });
}

export function trackSwipeLike(tmdbId: number) {
  trackEvent('swipe_like', { tmdb_id: tmdbId });
}

export function trackSwipeDislike(tmdbId: number) {
  trackEvent('swipe_dislike', { tmdb_id: tmdbId });
}

export function trackSwipeWatchlist(tmdbId: number) {
  trackEvent('swipe_watchlist', { tmdb_id: tmdbId });
}

export function trackSwipeShare(tmdbId: number) {
  trackEvent('swipe_share', { tmdb_id: tmdbId });
}

export function trackSwipeToDetail(tmdbId: number) {
  trackEvent('swipe_to_detail', { tmdb_id: tmdbId });
}

export function trackSwipeSession(durationSeconds: number, itemsViewed: number) {
  trackEvent('swipe_session', { duration_seconds: durationSeconds, items_viewed: itemsViewed });
}
