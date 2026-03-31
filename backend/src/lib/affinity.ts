/**
 * Affinity scoring utilities for personalized content ranking
 * Scores items based on user taste profile (genres, rated movies, decades)
 */

import type { UserTasteProfile } from './types';

/**
 * TMDB genre ID → genre name mapping (movies + TV combined)
 */
const GENRE_ID_TO_NAME: Record<number, string> = {
  // Movie genres
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV-specific genres
  10759: 'Action',      // Action & Adventure
  10765: 'Sci-Fi',      // Sci-Fi & Fantasy
  10768: 'War',         // War & Politics
  10762: 'Family',      // Kids
  10766: 'Drama',       // Soap → Drama
};

/**
 * Compute an affinity score for a content item based on user taste profile.
 * Higher score = better match. Negative = bad match (disliked genres).
 *
 * Scoring:
 * - +2 per genre matching a favorite genre
 * - -3 per genre matching a disliked genre (stronger penalty)
 * - +0.5 bonus for high vote average (>= 7.5)
 */
export function computeAffinityScore(
  genreIds: number[],
  tasteProfile: UserTasteProfile
): number {
  if (!genreIds || genreIds.length === 0) return 0;

  const favoriteSet = new Set(tasteProfile.favorite_genres.map(g => g.toLowerCase()));
  const dislikedSet = new Set(tasteProfile.disliked_genres.map(g => g.toLowerCase()));

  let score = 0;

  for (const gid of genreIds) {
    const name = GENRE_ID_TO_NAME[gid]?.toLowerCase();
    if (!name) continue;

    if (favoriteSet.has(name)) {
      score += 2;
    }
    if (dislikedSet.has(name)) {
      score -= 3;
    }
  }

  return score;
}

/**
 * Compute a normalized match score (0-100%) for a content item.
 * Combines genre affinity with vote average for a user-friendly percentage.
 */
export function computeMatchScore(
  genreIds: number[],
  voteAverage: number,
  tasteProfile: UserTasteProfile
): number {
  if (!tasteProfile.favorite_genres.length && !tasteProfile.disliked_genres.length) {
    return 0; // No profile = no score
  }

  const favoriteSet = new Set(tasteProfile.favorite_genres.map(g => g.toLowerCase()));
  const dislikedSet = new Set(tasteProfile.disliked_genres.map(g => g.toLowerCase()));

  const itemGenres = (genreIds || [])
    .map(gid => GENRE_ID_TO_NAME[gid]?.toLowerCase())
    .filter(Boolean);

  if (itemGenres.length === 0) return 0;

  // Genre match ratio (0-1): how many of the item's genres are favorites
  let matchCount = 0;
  let penaltyCount = 0;
  for (const name of itemGenres) {
    if (favoriteSet.has(name)) matchCount++;
    if (dislikedSet.has(name)) penaltyCount++;
  }

  // If any disliked genre, cap score low
  if (penaltyCount > 0) {
    return Math.max(10, Math.round(20 - penaltyCount * 10));
  }

  // Genre score: 0-70 points
  const genreScore = Math.round((matchCount / Math.max(itemGenres.length, 1)) * 70);

  // Vote average bonus: 0-30 points (scaled from 0-10 rating)
  const voteBonus = Math.round(Math.min(voteAverage, 10) * 3);

  return Math.min(100, genreScore + voteBonus);
}

/**
 * Build a Set of TMDB IDs the user has already watched (rated_movies with any rating including 0)
 */
export function getWatchedTmdbIds(tasteProfile: UserTasteProfile): Set<number> {
  return new Set(tasteProfile.rated_movies.map(m => m.tmdb_id));
}

/**
 * Sort items by affinity score (highest first), with original order as tiebreaker
 */
export function sortByAffinity<T extends { genre_ids?: number[] }>(
  items: T[],
  tasteProfile: UserTasteProfile
): T[] {
  return [...items].sort((a, b) => {
    const scoreA = computeAffinityScore(a.genre_ids || [], tasteProfile);
    const scoreB = computeAffinityScore(b.genre_ids || [], tasteProfile);
    return scoreB - scoreA;
  });
}
