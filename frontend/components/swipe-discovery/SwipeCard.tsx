import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
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
  bottomInset?: number;
}

export default function SwipeCard({
  item,
  providers,
  bottomInset = 0,
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
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);

  const displayProviders = (providers || []).slice(0, 4);

  return (
    <View style={styles.container}>
      {/* Full-bleed poster background */}
      {(backdropUri || posterUri) && (
        <Image
          source={{ uri: backdropUri || posterUri || '' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* Gradient overlay — strong at bottom for text readability */}
      <LinearGradient
        colors={[
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.05)',
          'rgba(0,0,0,0.55)',
          'rgba(0,0,0,0.9)',
          'rgba(0,0,0,0.98)',
        ]}
        locations={[0, 0.35, 0.58, 0.78, 1]}
        style={[
          StyleSheet.absoluteFill,
          bottomInset > 0 && { paddingBottom: bottomInset },
        ]}
        pointerEvents="box-none"
      />

      {/* Info panel — anchored to bottom */}
      <View
        style={[
          styles.infoContainer,
          bottomInset > 0 && { paddingBottom: 24 + bottomInset },
        ]}
        pointerEvents="box-none"
      >
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {releaseYear ? (
            <Text style={styles.metaText}>{releaseYear}</Text>
          ) : null}
          {releaseYear && item.vote_average > 0 ? (
            <Text style={styles.metaDot}>{'  \u00B7  '}</Text>
          ) : null}
          {item.vote_average > 0 && (
            <>
              <Ionicons name="star" size={11} color="#fbbf24" />
              <Text style={styles.ratingText}>
                {' '}
                {item.vote_average.toFixed(1)}
              </Text>
            </>
          )}
          {genres.length > 0 ? (
            <Text style={styles.metaDot}>{'  \u00B7  '}</Text>
          ) : null}
          {genres.map((genre, i) => (
            <React.Fragment key={genre}>
              {i > 0 && <Text style={styles.metaDot}>{', '}</Text>}
              <Text style={styles.genreText}>{genre}</Text>
            </React.Fragment>
          ))}
        </View>

        {/* Type badge + Provider logos */}
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.media_type === 'tv' ? 'Series' : 'Film'}
            </Text>
          </View>
          {displayProviders.length > 0 &&
            displayProviders.map((p) => (
              <Image
                key={p.provider_id}
                source={{ uri: `${TMDB_IMAGE_BASE}/w92${p.logo_path}` }}
                style={styles.providerLogo}
              />
            ))}
          {item.matchScore != null && item.matchScore > 0 && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{item.matchScore}%</Text>
            </View>
          )}
        </View>

        {/* AI Reason chip */}
        {item.reason ? (
          <View style={styles.reasonChip}>
            <Ionicons name="sparkles" size={12} color="#fbbf24" />
            <Text style={styles.reasonText} numberOfLines={2}>
              {item.reason}
            </Text>
          </View>
        ) : null}

        {/* Synopsis */}
        {item.overview ? (
          <TouchableOpacity
            onPress={() => setSynopsisExpanded(!synopsisExpanded)}
            activeOpacity={0.7}
          >
            <Text
              style={styles.synopsis}
              numberOfLines={synopsisExpanded ? 10 : 4}
            >
              {item.overview}
            </Text>
            {!synopsisExpanded && item.overview.length > 120 && (
              <Text style={styles.seeMore}>voir plus</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Info panel ──────────────────────────────────────
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingLeft: 16,
    paddingRight: 70,
    paddingBottom: 32,
  },

  // ── Title — 22px, aéré ──────────────────────────────
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 27,
    marginBottom: 5,
  },

  // ── Meta ────────────────────────────────────────────
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 7,
  },
  metaText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  metaDot: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  ratingText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
  },
  genreText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Badges & Providers ──────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(229,9,20,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  providerLogo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  // ── AI Reason chip ──────────────────────────────────
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(251,191,36,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '90%',
  },
  reasonText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },

  // ── Synopsis ────────────────────────────────────────
  synopsis: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    lineHeight: 18,
  },
  seeMore: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
    marginBottom: 4,
  },

  // ── Match badge ─────────────────────────────────────
  matchBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(52,211,153,0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
});
