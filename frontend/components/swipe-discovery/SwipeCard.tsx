import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  MovieResult,
  StreamingProvider,
} from '@/services/backend-api.service';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_WIDTH = SCREEN_WIDTH * 0.65;

// TMDB genre IDs → English names (stable mapping)
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV genres
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

interface SwipeCardProps {
  item: MovieResult;
  providers: StreamingProvider[];
  isActive: boolean;
}

export default function SwipeCard({
  item,
  providers,
  isActive,
}: SwipeCardProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const posterUri = item.poster_path
    ? `${TMDB_IMAGE_BASE}/w780${item.poster_path}`
    : null;

  const backdropUri = item.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w780${item.backdrop_path}`
    : posterUri;

  const releaseYear = item.release_date
    ? item.release_date.substring(0, 4)
    : item.first_air_date
      ? item.first_air_date.substring(0, 4)
      : '';

  const genres = (item.genre_ids || [])
    .slice(0, 3)
    .map(id => GENRE_MAP[id])
    .filter(Boolean);

  const displayProviders = (providers || []).slice(0, 4);

  return (
    <View style={styles.container}>
      {/* Background blur */}
      {backdropUri && (
        <Image
          source={{ uri: backdropUri }}
          style={StyleSheet.absoluteFill}
          blurRadius={25}
        />
      )}
      <View style={[StyleSheet.absoluteFill, styles.dimOverlay]} />

      {/* Centered poster */}
      <View style={styles.posterContainer}>
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={styles.poster}
            resizeMode='cover'
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons
              name='film-outline'
              size={48}
              color='rgba(255,255,255,0.3)'
            />
          </View>
        )}
      </View>

      {/* Bottom gradient + info overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={styles.bottomGradient}
      >
        <MotiView
          animate={
            isActive
              ? { opacity: 1, translateY: 0 }
              : { opacity: 0, translateY: 20 }
          }
          transition={{ type: 'timing', duration: 400, delay: 150 }}
        >
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Meta row: year + rating + type */}
          <View style={styles.metaRow}>
            {releaseYear ? (
              <Text style={styles.metaText}>{releaseYear}</Text>
            ) : null}
            {item.vote_average > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name='star' size={12} color='#fbbf24' />
                <Text style={styles.ratingText}>
                  {item.vote_average.toFixed(1)}
                </Text>
              </View>
            )}
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {item.media_type === 'tv' ? 'TV' : 'Movie'}
              </Text>
            </View>
          </View>

          {/* Genre pills */}
          {genres.length > 0 && (
            <View style={styles.genreRow}>
              {genres.map(genre => (
                <View key={genre} style={styles.genrePill}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Provider logos */}
          {displayProviders.length > 0 && (
            <View style={styles.providersRow}>
              {displayProviders.map(p => (
                <Image
                  key={p.provider_id}
                  source={{ uri: `${TMDB_IMAGE_BASE}/w92${p.logo_path}` }}
                  style={styles.providerLogo}
                />
              ))}
            </View>
          )}

          {/* AI Reason */}
          {item.reason && (
            <View style={styles.reasonContainer}>
              <Ionicons name='sparkles' size={14} color='#fbbf24' />
              <Text style={styles.reasonText} numberOfLines={2}>
                {item.reason}
              </Text>
            </View>
          )}

          {/* Synopsis */}
          {item.overview ? (
            <TouchableOpacity
              onPress={() => setSynopsisExpanded(!synopsisExpanded)}
              activeOpacity={0.7}
            >
              <Text
                style={styles.synopsis}
                numberOfLines={synopsisExpanded ? undefined : 2}
              >
                {item.overview}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Match score */}
          {item.matchScore != null && item.matchScore > 0 && (
            <View style={styles.matchRow}>
              <Text style={styles.matchText}>{item.matchScore}% match</Text>
            </View>
          )}
        </MotiView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dimOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  posterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 180,
  },
  poster: {
    width: POSTER_WIDTH,
    aspectRatio: 2 / 3,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  posterPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: 'rgba(229,9,20,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  genrePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  providersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  providerLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  reasonText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  synopsis: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  matchRow: {
    marginTop: 4,
  },
  matchText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '600',
  },
});
