import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';

const HERO_HEIGHT = 300;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroSectionProps {
  title: string;
  posterPath: string;
  voteAverage: number;
  releaseYear?: number;
  mediaType: 'movie' | 'tv';
  isDark: boolean;
  scrollY: SharedValue<number>;
  insetsTop: number;
  onBack: () => void;
}

export default function HeroSection({
  title,
  posterPath,
  voteAverage,
  releaseYear,
  mediaType,
  isDark,
  scrollY,
  insetsTop,
  onBack,
}: HeroSectionProps) {
  const { t } = useLanguage();
  const bgColor = isDark ? '#000000' : '#F2F2F7';

  const heroImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, HERO_HEIGHT],
          [-50, 0, HERO_HEIGHT * 0.4]
        ),
      },
    ],
  }));

  const backButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.6, HERO_HEIGHT],
      [1, 0.7, 0.4]
    ),
  }));

  const headerOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_HEIGHT * 0.5, HERO_HEIGHT],
      [0, 0, 0.95]
    ),
  }));

  return (
    <>
      {/* Hero Image */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, overflow: 'hidden' }}>
          <Animated.View style={[{ width: '100%', height: '120%' }, heroImageStyle]}>
            {posterPath ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w780${posterPath}` }}
                style={{ width: '100%', height: '100%' }}
                resizeMode='cover'
                accessibilityLabel={`${title} poster`}
              />
            ) : (
              <View
                style={{ width: '100%', height: '100%' }}
                className='items-center justify-center bg-dark-surface'
              >
                <Ionicons name='film-outline' size={64} color='#555' />
              </View>
            )}
          </Animated.View>
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.3)',
              isDark ? 'rgba(0,0,0,0.9)' : 'rgba(242,242,247,0.9)',
              bgColor,
            ]}
            locations={[0, 0.4, 0.75, 1]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' }}
          />
          <View className='absolute bottom-4 left-4 right-4'>
            <Text
              className='mb-1 text-2xl font-bold text-white'
              style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
              accessibilityRole='header'
            >
              {title}
            </Text>
            <View className='flex-row items-center gap-2'>
              {voteAverage > 0 && (
                <View className='flex-row items-center gap-1' accessibilityLabel={`Rating ${voteAverage.toFixed(1)} out of 10`}>
                  <Ionicons name='star' size={16} color='#E50914' />
                  <Text
                    className='text-base font-semibold text-white'
                    style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                  >
                    {voteAverage.toFixed(1)}
                  </Text>
                </View>
              )}
              {releaseYear && (
                <Text
                  className='text-sm font-medium text-white'
                  style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
                >
                  {releaseYear}
                </Text>
              )}
              <View className='rounded-full bg-black/40 px-2.5 py-0.5 backdrop-blur-sm'>
                <Text className='text-xs font-semibold text-white'>
                  {mediaType === 'tv' ? t('movies.tvShow') : t('movies.movie')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </MotiView>

      {/* Back button */}
      <Animated.View
        style={[{ position: 'absolute', top: insetsTop + 8, left: 16, zIndex: 10 }, backButtonStyle]}
      >
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel='Go back'
          accessibilityRole='button'
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden' }}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 40}
            tint='dark'
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, overflow: 'hidden' }}
          >
            <View
              style={{
                ...Platform.select({ ios: {}, android: { backgroundColor: 'rgba(0,0,0,0.5)' } }),
                width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name='chevron-back' size={22} color='#fff' />
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {/* Header overlay on scroll */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, height: insetsTop + 52, backgroundColor: bgColor, zIndex: 5 },
          headerOverlayStyle,
        ]}
        pointerEvents='none'
      />
    </>
  );
}
