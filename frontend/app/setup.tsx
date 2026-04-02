/**
 * Setup Screen
 * A three-step setup flow shown after onboarding, before the main app.
 * Step 1: Country selection
 * Step 2: Platform selection
 * Step 3: Genre selection
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Localization from 'expo-localization';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AVAILABLE_COUNTRIES } from '@/constants/languages';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { getNetflixGlow, getSquircle } from '@/utils/designHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SETUP_PLATFORMS_KEY = '@fastflix/setup_platforms';
const SETUP_GENRES_KEY = '@fastflix/setup_genres';
const SETUP_COMPLETE_KEY = '@fastflix/setup_complete';
const SETUP_COUNTRY_KEY = '@fastflix/setup_country';

interface Platform {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface Genre {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  key: string;
}

// API URL for fetching providers
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://fastflix.miotutor.app';

// Fallback platforms if API is unavailable (TMDB provider IDs + logo paths)
const FALLBACK_PLATFORMS: Platform[] = [
  {
    provider_id: 8,
    provider_name: 'Netflix',
    logo_path: '/pbpMk2JmcoNnQwB5JGpXAbmLg4a.jpg',
  },
  {
    provider_id: 119,
    provider_name: 'Amazon Prime Video',
    logo_path: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
  },
  {
    provider_id: 337,
    provider_name: 'Disney Plus',
    logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg',
  },
  {
    provider_id: 350,
    provider_name: 'Apple TV Plus',
    logo_path: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg',
  },
  {
    provider_id: 531,
    provider_name: 'Paramount Plus',
    logo_path: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg',
  },
  {
    provider_id: 283,
    provider_name: 'Crunchyroll',
    logo_path: '/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg',
  },
  {
    provider_id: 15,
    provider_name: 'Hulu',
    logo_path: '/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg',
  },
  {
    provider_id: 1899,
    provider_name: 'Max',
    logo_path: '/6Q3KKEFIL8hkBDpOjGcfTzOIKAA.jpg',
  },
  {
    provider_id: 386,
    provider_name: 'Peacock',
    logo_path: '/8VCV78prwd9QzZnEBqy0mCEpDup.jpg',
  },
  {
    provider_id: 11,
    provider_name: 'MUBI',
    logo_path: '/bVR4Z1LCHY7gidXAJF5pMa4QrDS.jpg',
  },
  {
    provider_id: 381,
    provider_name: 'Canal Plus',
    logo_path: '/2OrPVj0YMnIsd4X9mABKPULDp8U.jpg',
  },
  {
    provider_id: 56,
    provider_name: 'OCS',
    logo_path: '/pM3POKuRCCxdfZMlrnXCCEhk0vv.jpg',
  },
];

const GENRES: Genre[] = [
  { name: 'Action', icon: 'flash', key: 'action' },
  { name: 'Comedy', icon: 'happy', key: 'comedy' },
  { name: 'Drama', icon: 'sad', key: 'drama' },
  { name: 'Thriller', icon: 'skull', key: 'thriller' },
  { name: 'Sci-Fi', icon: 'planet', key: 'scifi' },
  { name: 'Horror', icon: 'skull-outline', key: 'horror' },
  { name: 'Romance', icon: 'heart', key: 'romance' },
  { name: 'Animation', icon: 'color-palette', key: 'animation' },
  { name: 'Documentary', icon: 'document-text', key: 'documentary' },
  { name: 'Fantasy', icon: 'sparkles', key: 'fantasy' },
  { name: 'Crime', icon: 'lock-closed', key: 'crime' },
  { name: 'Adventure', icon: 'compass', key: 'adventure' },
];

const COLUMN_COUNT = 3;
const GRID_GAP = 10;
const GRID_PADDING = 24;
const ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (COLUMN_COUNT - 1)) /
  COLUMN_COUNT;

export default function SetupScreen() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>(
    () => Localization.getLocales()[0]?.regionCode ?? 'US'
  );
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return AVAILABLE_COUNTRIES;
    const query = countrySearch.trim().toLowerCase();
    return AVAILABLE_COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [countrySearch]);

  // Fetch platforms based on selected country when transitioning to step 2
  useEffect(() => {
    if (step !== 2) return;

    setLoadingPlatforms(true);
    fetch(`${API_URL}/api/providers/public?country=${selectedCountry}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.providers?.length > 0) {
          setPlatforms(data.data.providers.slice(0, 30));
        } else {
          setPlatforms(FALLBACK_PLATFORMS);
        }
      })
      .catch(() => {
        setPlatforms(FALLBACK_PLATFORMS);
      })
      .finally(() => setLoadingPlatforms(false));
  }, [step, selectedCountry]);

  const selectCountry = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCountry(code);
  }, []);

  const togglePlatform = useCallback((name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlatforms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  }, []);

  const toggleGenre = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGenres(prev =>
      prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]
    );
  }, []);

  const handleNext = useCallback(() => {
    setStep(prev => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setStep(prev => prev - 1);
  }, []);

  const handleComplete = useCallback(async () => {
    await AsyncStorage.setItem(
      SETUP_PLATFORMS_KEY,
      JSON.stringify(selectedPlatforms)
    );
    await AsyncStorage.setItem(
      SETUP_GENRES_KEY,
      JSON.stringify(selectedGenres)
    );
    await AsyncStorage.setItem(SETUP_COUNTRY_KEY, selectedCountry);
    await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');

    // If already authenticated (returning user via "Se connecter"), go straight to home
    router.replace(isAuthenticated ? '/home' : '/auth');
  }, [
    selectedPlatforms,
    selectedGenres,
    selectedCountry,
    router,
    isAuthenticated,
  ]);

  const canProceedStep1 = selectedCountry !== '';
  const canProceedStep2 = selectedPlatforms.length >= 1;
  const canProceedStep3 = selectedGenres.length >= 3;

  const canProceed =
    step === 1
      ? canProceedStep1
      : step === 2
        ? canProceedStep2
        : canProceedStep3;

  const renderCountryItem = useCallback(
    ({
      item,
      index,
    }: {
      item: (typeof AVAILABLE_COUNTRIES)[number];
      index: number;
    }) => {
      const isSelected = selectedCountry === item.code;
      return (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 300,
            delay: Math.min(index * 30, 300),
          }}
        >
          <TouchableOpacity
            onPress={() => selectCountry(item.code)}
            activeOpacity={0.7}
            style={[
              getSquircle(14),
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 8,
                backgroundColor: isSelected
                  ? 'rgba(229, 9, 20, 0.12)'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                borderWidth: 2,
                borderColor: isSelected
                  ? '#E50914'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text style={{ fontSize: 26, marginRight: 14 }}>{item.flag}</Text>
            <Text
              className={cn(
                'flex-1 text-base font-medium',
                isSelected
                  ? 'text-netflix-500'
                  : 'text-light-text dark:text-dark-text'
              )}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {isSelected && (
              <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 200 }}
              >
                <Ionicons name='checkmark-circle' size={24} color='#E50914' />
              </MotiView>
            )}
          </TouchableOpacity>
        </MotiView>
      );
    },
    [selectedCountry, isDark, selectCountry]
  );

  return (
    <SafeAreaView
      className={cn('flex-1 bg-light-background dark:bg-dark-background')}
    >
      {/* Progress indicator */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        className='items-center pb-2 pt-4'
      >
        <Text className='text-sm font-medium text-light-text/50 dark:text-dark-text/50'>
          {t('setup.step')
            .replace('{{current}}', String(step))
            .replace('{{total}}', '3')}
        </Text>
        <View className='mt-3 flex-row items-center justify-center gap-2'>
          <View
            style={[
              {
                height: 4,
                width: 40,
                borderRadius: 2,
                backgroundColor: '#E50914',
              },
            ]}
          />
          <View
            style={[
              {
                height: 4,
                width: 40,
                borderRadius: 2,
                backgroundColor:
                  step >= 2
                    ? '#E50914'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.15)',
              },
            ]}
          />
          <View
            style={[
              {
                height: 4,
                width: 40,
                borderRadius: 2,
                backgroundColor:
                  step >= 3
                    ? '#E50914'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.15)',
              },
            ]}
          />
        </View>
      </MotiView>

      {/* Step content */}
      {step === 1 ? (
        <MotiView
          key='step1-country'
          from={{ opacity: 0, translateX: -30 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -30 }}
          transition={{ type: 'timing', duration: 400 }}
          className='flex-1'
        >
          {/* Title */}
          <View className='px-6 pb-4 pt-6'>
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
            >
              <Text
                className={cn(
                  'text-center text-2xl font-bold',
                  'text-light-text dark:text-dark-text'
                )}
              >
                {t('setup.country.title') === 'setup.country.title'
                  ? 'Where are you?'
                  : t('setup.country.title')}
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
            >
              <Text
                className={cn(
                  'mt-2 text-center text-base',
                  'text-light-text/60 dark:text-dark-text/60'
                )}
              >
                {t('setup.country.subtitle') === 'setup.country.subtitle'
                  ? 'This helps us show streaming availability in your region'
                  : t('setup.country.subtitle')}
              </Text>
            </MotiView>
          </View>

          {/* Search input */}
          <View className='px-6 pb-3'>
            <View
              style={[
                getSquircle(12),
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderWidth: 1,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <Ionicons
                name='search'
                size={18}
                color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              />
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder={
                  t('setup.country.search') === 'setup.country.search'
                    ? 'Search countries...'
                    : t('setup.country.search')
                }
                placeholderTextColor={
                  isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
                }
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  fontSize: 16,
                  color: isDark ? '#fff' : '#000',
                }}
                autoCorrect={false}
                autoCapitalize='none'
              />
              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch('')}>
                  <Ionicons
                    name='close-circle'
                    size={18}
                    color={
                      isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'
                    }
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Country list */}
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.code}
            renderItem={renderCountryItem}
            className='flex-1 px-6'
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          />
        </MotiView>
      ) : step === 2 ? (
        <MotiView
          key='step2-platforms'
          from={{ opacity: 0, translateX: 30 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: -30 }}
          transition={{ type: 'timing', duration: 400 }}
          className='flex-1'
        >
          {/* Back button + Title */}
          <View className='px-6 pb-4 pt-6'>
            <TouchableOpacity
              onPress={handleBack}
              className='mb-4 flex-row items-center'
              activeOpacity={0.7}
            >
              <Ionicons
                name='arrow-back'
                size={22}
                color={isDark ? '#fff' : '#000'}
              />
              <Text className='ml-1 text-base text-light-text dark:text-dark-text'>
                {t('setup.back')}
              </Text>
            </TouchableOpacity>

            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
            >
              <Text
                className={cn(
                  'text-center text-2xl font-bold',
                  'text-light-text dark:text-dark-text'
                )}
              >
                {t('setup.platformsTitle')}
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
            >
              <Text
                className={cn(
                  'mt-2 text-center text-base',
                  'text-light-text/60 dark:text-dark-text/60'
                )}
              >
                {t('setup.platformsSubtitle')}
              </Text>
            </MotiView>
          </View>

          {/* Platform grid */}
          <ScrollView
            className='flex-1 px-6'
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View className='flex-row flex-wrap' style={{ gap: GRID_GAP }}>
              {loadingPlatforms ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 40,
                  }}
                >
                  <ActivityIndicator size='large' color='#E50914' />
                </View>
              ) : null}
              {platforms.map((platform, index) => {
                const isSelected = selectedPlatforms.includes(
                  platform.provider_name
                );
                return (
                  <MotiView
                    key={platform.provider_id}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: 'timing',
                      duration: 350,
                      delay: 100 + index * 50,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => togglePlatform(platform.provider_name)}
                      activeOpacity={0.7}
                      style={[
                        getSquircle(16),
                        {
                          width: ITEM_WIDTH,
                          height: ITEM_WIDTH * 0.75,
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                          borderWidth: 2,
                          borderColor: isSelected
                            ? '#E50914'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        },
                      ]}
                    >
                      <Image
                        source={{
                          uri: `https://image.tmdb.org/t/p/w92${platform.logo_path}`,
                        }}
                        style={{ width: 48, height: 48, borderRadius: 10 }}
                        resizeMode='cover'
                      />
                      {isSelected && (
                        <MotiView
                          from={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'timing', duration: 200 }}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name='checkmark' size={14} color='#fff' />
                        </MotiView>
                      )}
                      <Text
                        className={cn(
                          'mt-1 text-center text-xs font-medium',
                          'text-light-text dark:text-dark-text'
                        )}
                        numberOfLines={1}
                      >
                        {platform.provider_name}
                      </Text>
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </ScrollView>
        </MotiView>
      ) : (
        <MotiView
          key='step3-genres'
          from={{ opacity: 0, translateX: 30 }}
          animate={{ opacity: 1, translateX: 0 }}
          exit={{ opacity: 0, translateX: 30 }}
          transition={{ type: 'timing', duration: 400 }}
          className='flex-1'
        >
          {/* Back button + Title */}
          <View className='px-6 pb-4 pt-6'>
            <TouchableOpacity
              onPress={handleBack}
              className='mb-4 flex-row items-center'
              activeOpacity={0.7}
            >
              <Ionicons
                name='arrow-back'
                size={22}
                color={isDark ? '#fff' : '#000'}
              />
              <Text className='ml-1 text-base text-light-text dark:text-dark-text'>
                {t('setup.back')}
              </Text>
            </TouchableOpacity>

            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
            >
              <Text
                className={cn(
                  'text-center text-2xl font-bold',
                  'text-light-text dark:text-dark-text'
                )}
              >
                {t('setup.genresTitle')}
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
            >
              <Text
                className={cn(
                  'mt-2 text-center text-base',
                  'text-light-text/60 dark:text-dark-text/60'
                )}
              >
                {t('setup.genresSubtitle')}
              </Text>
            </MotiView>
          </View>

          {/* Genre grid */}
          <ScrollView
            className='flex-1 px-6'
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            <View className='flex-row flex-wrap' style={{ gap: GRID_GAP }}>
              {GENRES.map((genre, index) => {
                const isSelected = selectedGenres.includes(genre.key);
                return (
                  <MotiView
                    key={genre.key}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: 'timing',
                      duration: 350,
                      delay: 100 + index * 50,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => toggleGenre(genre.key)}
                      activeOpacity={0.7}
                      style={[
                        getSquircle(16),
                        {
                          width: ITEM_WIDTH,
                          height: ITEM_WIDTH * 0.75,
                          backgroundColor: isSelected
                            ? 'rgba(229, 9, 20, 0.15)'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                          borderWidth: 2,
                          borderColor: isSelected
                            ? '#E50914'
                            : isDark
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        },
                      ]}
                    >
                      <Ionicons
                        name={genre.icon}
                        size={24}
                        color={
                          isSelected
                            ? '#E50914'
                            : isDark
                              ? '#a3a3a3'
                              : '#737373'
                        }
                      />
                      <Text
                        className={cn(
                          'text-center text-sm font-semibold',
                          isSelected
                            ? 'text-netflix-500'
                            : 'text-light-text dark:text-dark-text'
                        )}
                        numberOfLines={1}
                      >
                        {genre.name}
                      </Text>
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </ScrollView>
        </MotiView>
      )}

      {/* Bottom button */}
      <View className='absolute bottom-0 left-0 right-0 items-center bg-light-background pb-10 pt-4 dark:bg-dark-background'>
        <TouchableOpacity
          onPress={step === 3 ? handleComplete : handleNext}
          disabled={!canProceed}
          activeOpacity={0.8}
          style={[
            getSquircle(16),
            canProceed ? getNetflixGlow(isDark) : {},
            {
              backgroundColor: canProceed
                ? '#E50914'
                : isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
              paddingVertical: 16,
              paddingHorizontal: 48,
              minWidth: 220,
            },
          ]}
        >
          <Text
            className={cn(
              'text-center text-lg font-bold',
              canProceed
                ? 'text-white'
                : 'text-light-text/30 dark:text-dark-text/30'
            )}
          >
            {step === 3 ? t('setup.continue') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
