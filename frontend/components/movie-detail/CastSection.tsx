import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CastMember, CrewMemberData } from './types';

interface PersonAvatarProps {
  profilePath?: string | null;
  name: string;
  subtitle: string;
  isDark: boolean;
  onPress: () => void;
}

function PersonAvatar({ profilePath, name, subtitle, isDark, onPress }: PersonAvatarProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityLabel={`${name}, ${subtitle}`}
      accessibilityRole='button'
    >
      <View className='items-center' style={{ width: 80 }}>
        <View
          style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden' }}
          className='mb-1.5 bg-light-surface dark:bg-dark-surface'
        >
          {profilePath ? (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w185${profilePath}` }}
              style={{ width: 64, height: 64 }}
              resizeMode='cover'
              accessibilityLabel={`Photo of ${name}`}
            />
          ) : (
            <View className='flex-1 items-center justify-center'>
              <Ionicons name='person' size={28} color={isDark ? '#555' : '#bbb'} />
            </View>
          )}
        </View>
        <Text className='text-center text-xs font-medium text-light-text dark:text-dark-text' numberOfLines={2}>
          {name}
        </Text>
        <Text className='text-center text-xs text-light-textMuted dark:text-dark-textMuted' numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface CastSectionProps {
  cast: CastMember[];
  crew: CrewMemberData[];
  createdBy?: { id: number; name: string; profile_path: string | null }[];
  mediaType: 'movie' | 'tv';
}

export default function CastSection({ cast, crew, createdBy, mediaType }: CastSectionProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  const keyCrew = crew.filter(c =>
    ['Director', 'Writer', 'Screenplay', 'Producer'].includes(c.job)
  ).slice(0, 6);

  const navigateToPerson = (id: number, name: string, profilePath: string | null) => {
    router.push({
      pathname: '/actor-detail' as never,
      params: { personId: String(id), name, profilePath: profilePath || '' },
    });
  };

  return (
    <>
      {/* Cast */}
      {cast.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 270 }}
        >
          <View className='mb-6'>
            <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
              {t('movieDetail.cast')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {cast.slice(0, 10).map((actor, idx) => (
                <PersonAvatar
                  key={`cast-${actor.id}-${idx}`}
                  profilePath={actor.profile_path}
                  name={actor.name}
                  subtitle={actor.character}
                  isDark={isDark}
                  onPress={() => navigateToPerson(actor.id, actor.name, actor.profile_path || null)}
                />
              ))}
            </ScrollView>
          </View>
        </MotiView>
      )}

      {/* Crew */}
      {keyCrew.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 280 }}
        >
          <View className='mb-6'>
            <Text className='mb-3 text-lg font-semibold text-light-text dark:text-dark-text'>
              {t('movieDetail.crew') || 'Crew'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {keyCrew.map((member, idx) => (
                <PersonAvatar
                  key={`crew-${member.id}-${idx}`}
                  profilePath={member.profile_path}
                  name={member.name}
                  subtitle={member.job}
                  isDark={isDark}
                  onPress={() => navigateToPerson(member.id, member.name, member.profile_path || null)}
                />
              ))}
            </ScrollView>
          </View>
        </MotiView>
      )}

      {/* Created By (TV) */}
      {mediaType === 'tv' && createdBy && createdBy.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 285 }}
        >
          <View className='mb-6'>
            <Text className='mb-2 text-lg font-semibold text-light-text dark:text-dark-text'>
              {t('movieDetail.createdBy') || 'Created by'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {createdBy.map((creator, idx) => (
                <PersonAvatar
                  key={`creator-${creator.id}-${idx}`}
                  profilePath={creator.profile_path}
                  name={creator.name}
                  subtitle=''
                  isDark={isDark}
                  onPress={() => navigateToPerson(creator.id, creator.name, creator.profile_path)}
                />
              ))}
            </ScrollView>
          </View>
        </MotiView>
      )}
    </>
  );
}
