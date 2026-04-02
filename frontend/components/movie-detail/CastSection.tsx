import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CastMember, CrewMemberData } from './types';

const INITIAL_COUNT = 4;

interface PersonRowProps {
  profilePath?: string | null;
  name: string;
  subtitle: string;
  isDark: boolean;
  onPress: () => void;
}

function PersonRow({
  profilePath,
  name,
  subtitle,
  isDark,
  onPress,
}: PersonRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityLabel={`${name}, ${subtitle}`}
      accessibilityRole='button'
      className='flex-row items-center gap-3 py-2'
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          flexShrink: 0,
        }}
        className='bg-light-surface dark:bg-dark-surface'
      >
        {profilePath ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w185${profilePath}` }}
            style={{ width: 44, height: 44 }}
            resizeMode='cover'
          />
        ) : (
          <View className='flex-1 items-center justify-center'>
            <Ionicons
              name='person'
              size={20}
              color={isDark ? '#555' : '#bbb'}
            />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          className='text-sm font-semibold text-light-text dark:text-dark-text'
          numberOfLines={1}
        >
          {name}
        </Text>
        {subtitle ? (
          <Text
            className='text-xs text-light-textMuted dark:text-dark-textMuted'
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name='chevron-forward'
        size={16}
        color={isDark ? '#555' : '#ccc'}
      />
    </TouchableOpacity>
  );
}

function ExpandableList<T extends { id: number }>({
  title,
  items,
  renderItem,
}: {
  title: string;
  items: T[];
  renderItem: (item: T, idx: number) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  const visible = expanded ? items : items.slice(0, INITIAL_COUNT);
  const hasMore = items.length > INITIAL_COUNT;

  return (
    <View className='mb-6'>
      <Text className='mb-1 text-lg font-semibold text-light-text dark:text-dark-text'>
        {title}
      </Text>
      {visible.map((item, idx) => renderItem(item, idx))}
      {hasMore && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.6}
          className='mt-1 flex-row items-center justify-center gap-1 py-2'
        >
          <Text className='text-sm font-medium text-netflix-500'>
            {expanded
              ? t('movieDetail.seeLess') || 'See less'
              : t('movieDetail.seeMore') || `See all (${items.length})`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color='#E50914'
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface CastSectionProps {
  cast: CastMember[];
  crew: CrewMemberData[];
  createdBy?: { id: number; name: string; profile_path: string | null }[];
  mediaType: 'movie' | 'tv';
}

export default function CastSection({
  cast,
  crew,
  createdBy,
  mediaType,
}: CastSectionProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  const keyCrew = crew
    .filter(c =>
      ['Director', 'Writer', 'Screenplay', 'Producer'].includes(c.job)
    )
    .slice(0, 10);

  const navigateToPerson = (
    id: number,
    name: string,
    profilePath: string | null
  ) => {
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
          <ExpandableList
            title={t('movieDetail.cast')}
            items={cast.slice(0, 10)}
            renderItem={(actor: CastMember, idx: number) => (
              <PersonRow
                key={`cast-${actor.id}-${idx}`}
                profilePath={actor.profile_path}
                name={actor.name}
                subtitle={actor.character}
                isDark={isDark}
                onPress={() =>
                  navigateToPerson(
                    actor.id,
                    actor.name,
                    actor.profile_path || null
                  )
                }
              />
            )}
          />
        </MotiView>
      )}

      {/* Crew */}
      {keyCrew.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 280 }}
        >
          <ExpandableList
            title={t('movieDetail.crew') || 'Crew'}
            items={keyCrew}
            renderItem={(member: CrewMemberData, idx: number) => (
              <PersonRow
                key={`crew-${member.id}-${idx}`}
                profilePath={member.profile_path}
                name={member.name}
                subtitle={member.job}
                isDark={isDark}
                onPress={() =>
                  navigateToPerson(
                    member.id,
                    member.name,
                    member.profile_path || null
                  )
                }
              />
            )}
          />
        </MotiView>
      )}

      {/* Created By (TV) */}
      {mediaType === 'tv' && createdBy && createdBy.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 285 }}
        >
          <ExpandableList
            title={t('movieDetail.createdBy') || 'Created by'}
            items={createdBy}
            renderItem={(
              creator: {
                id: number;
                name: string;
                profile_path: string | null;
              },
              idx: number
            ) => (
              <PersonRow
                key={`creator-${creator.id}-${idx}`}
                profilePath={creator.profile_path}
                name={creator.name}
                subtitle=''
                isDark={isDark}
                onPress={() =>
                  navigateToPerson(
                    creator.id,
                    creator.name,
                    creator.profile_path
                  )
                }
              />
            )}
          />
        </MotiView>
      )}
    </>
  );
}
