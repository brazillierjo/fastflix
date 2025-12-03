/**
 * FiltersBottomSheet - Pre-search filters for user preferences
 * Allows users to configure default filters before searching
 */

import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useUserPreferences,
  useAvailableProviders,
} from '@/hooks/useUserPreferences';
import {
  UserPreferences,
  AvailableProvider,
} from '@/services/backend-api.service';
import { cn } from '@/utils/cn';
import { getButtonBorderRadius } from '@/utils/designHelpers';
import React, { useState, useEffect } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ContentType = 'all' | 'movies' | 'tvshows';

interface FiltersBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** If true, shows a "Save as default" option. Used in profile page. */
  saveAsDefault?: boolean;
}

export default function FiltersBottomSheet({
  visible,
  onClose,
  saveAsDefault = true,
}: FiltersBottomSheetProps) {
  const { t, country, setCountry, availableCountries } = useLanguage();

  const {
    preferences,
    isLoading: isLoadingPrefs,
    updatePreferencesAsync,
    isUpdating,
  } = useUserPreferences();
  const { providers, isLoading: isLoadingProviders } =
    useAvailableProviders(country);

  const currentCountry = availableCountries.find(c => c.code === country);

  // Country picker
  const showCountryPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('common.cancel'),
            ...availableCountries.map(c => `${c.flag} ${c.name}`),
          ],
          cancelButtonIndex: 0,
          title: t('profile.chooseCountry'),
        },
        buttonIndex => {
          if (buttonIndex > 0) {
            const selectedCountry = availableCountries[buttonIndex - 1];
            setCountry(selectedCountry.code);
          }
        }
      );
    } else {
      Alert.alert(t('profile.chooseCountry'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        ...availableCountries.map(countryItem => ({
          text: `${countryItem.flag} ${countryItem.name}`,
          onPress: () => setCountry(countryItem.code),
        })),
      ]);
    }
  };

  // Local state for editing
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  // Sync local state when modal opens or preferences change
  useEffect(() => {
    if (visible) {
      setLocalPrefs(preferences);
    }
  }, [visible, preferences]);

  const handleContentTypeChange = (contentType: ContentType) => {
    setLocalPrefs(prev => ({ ...prev, contentType }));
  };

  const toggleAvailabilityType = (
    type: 'includeFlatrate' | 'includeRent' | 'includeBuy'
  ) => {
    setLocalPrefs(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const togglePlatform = (providerId: number) => {
    setLocalPrefs(prev => {
      const newPlatforms = prev.platforms.includes(providerId)
        ? prev.platforms.filter(id => id !== providerId)
        : [...prev.platforms, providerId];
      return { ...prev, platforms: newPlatforms };
    });
  };

  const handleSave = async () => {
    try {
      await updatePreferencesAsync({
        contentType: localPrefs.contentType,
        platforms: localPrefs.platforms,
        includeFlatrate: localPrefs.includeFlatrate,
        includeRent: localPrefs.includeRent,
        includeBuy: localPrefs.includeBuy,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleReset = () => {
    setLocalPrefs({
      country: preferences.country,
      contentType: 'all',
      platforms: [],
      includeFlatrate: true,
      includeRent: false,
      includeBuy: false,
    });
  };

  // Filter providers to only show main streaming services (top 20 by priority)
  const filteredProviders = providers
    .filter(p => p.display_priorities[country] !== undefined)
    .sort(
      (a, b) =>
        (a.display_priorities[country] || 999) -
        (b.display_priorities[country] || 999)
    )
    .slice(0, 20);

  const isLoading = isLoadingPrefs || isLoadingProviders;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-light-border px-4 py-3 dark:border-dark-border'>
          <TouchableOpacity onPress={onClose}>
            <Text className='text-base text-light-muted dark:text-dark-muted'>
              {t('common.cancel') || 'Cancel'}
            </Text>
          </TouchableOpacity>
          <Text className='text-lg font-semibold text-light-text dark:text-dark-text'>
            {t('filters.defaultFilters') || 'My Filters'}
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className='text-base text-netflix-500'>
              {t('filters.reset') || 'Reset'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className='flex-1 items-center justify-center'>
            <ActivityIndicator size='large' color='#E50914' />
          </View>
        ) : (
          <ScrollView
            className='flex-1 px-4 pt-4'
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {/* Country Section */}
            <View className='mb-6'>
              <Text className='mb-3 text-base font-semibold text-light-text dark:text-dark-text'>
                {t('settings.country') || 'Search Country'}
              </Text>
              <TouchableOpacity
                onPress={showCountryPicker}
                className='flex-row items-center justify-between rounded-xl bg-light-card px-4 py-3 dark:bg-dark-card'
              >
                <View className='flex-row items-center gap-3'>
                  <View className='h-8 w-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background'>
                    <Ionicons name='flag' size={18} color='#E50914' />
                  </View>
                  <Text className='text-base text-light-text dark:text-dark-text'>
                    {currentCountry
                      ? `${currentCountry.flag} ${currentCountry.name}`
                      : country}
                  </Text>
                </View>
                <Ionicons name='chevron-forward' size={20} color='#a3a3a3' />
              </TouchableOpacity>
            </View>

            {/* Content Type Section */}
            <View className='mb-6'>
              <Text className='mb-3 text-base font-semibold text-light-text dark:text-dark-text'>
                {t('filters.contentType') || 'Content Type'}
              </Text>
              <View className='flex-row gap-2'>
                {[
                  { key: 'all', label: t('filters.all') || 'All' },
                  { key: 'movies', label: t('filters.moviesOnly') || 'Movies' },
                  {
                    key: 'tvshows',
                    label: t('filters.tvShowsOnly') || 'TV Shows',
                  },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() =>
                      handleContentTypeChange(option.key as ContentType)
                    }
                    style={getButtonBorderRadius()}
                    className={cn(
                      'flex-1 items-center border-2 py-3',
                      localPrefs.contentType === option.key
                        ? 'border-netflix-500 bg-netflix-500/10'
                        : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm font-medium',
                        localPrefs.contentType === option.key
                          ? 'text-netflix-500'
                          : 'text-light-text dark:text-dark-text'
                      )}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Availability Types Section */}
            <View className='mb-6'>
              <Text className='mb-3 text-base font-semibold text-light-text dark:text-dark-text'>
                {t('filters.availabilityTypes') || 'Availability'}
              </Text>
              <View className='overflow-hidden rounded-xl bg-light-card dark:bg-dark-card'>
                {/* Flatrate (Subscription) */}
                <View className='flex-row items-center justify-between px-4 py-3'>
                  <View className='flex-1 flex-row items-center gap-3'>
                    <View className='h-8 w-8 items-center justify-center rounded-lg bg-green-500/20'>
                      <Ionicons
                        name='checkmark-circle'
                        size={18}
                        color='#22c55e'
                      />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-base text-light-text dark:text-dark-text'>
                        {t('filters.subscription') ||
                          'Included in subscription'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localPrefs.includeFlatrate}
                    onValueChange={() =>
                      toggleAvailabilityType('includeFlatrate')
                    }
                    trackColor={{ false: '#767577', true: '#E50914' }}
                    thumbColor='#fff'
                  />
                </View>

                <View className='ml-16 h-px bg-light-border dark:bg-dark-border' />

                {/* Rent */}
                <View className='flex-row items-center justify-between px-4 py-3'>
                  <View className='flex-1 flex-row items-center gap-3'>
                    <View className='h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20'>
                      <Ionicons name='time' size={18} color='#3b82f6' />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-base text-light-text dark:text-dark-text'>
                        {t('filters.rent') || 'Rent'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localPrefs.includeRent}
                    onValueChange={() => toggleAvailabilityType('includeRent')}
                    trackColor={{ false: '#767577', true: '#E50914' }}
                    thumbColor='#fff'
                  />
                </View>

                <View className='ml-16 h-px bg-light-border dark:bg-dark-border' />

                {/* Buy */}
                <View className='flex-row items-center justify-between px-4 py-3'>
                  <View className='flex-1 flex-row items-center gap-3'>
                    <View className='h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20'>
                      <Ionicons name='cart' size={18} color='#f59e0b' />
                    </View>
                    <View className='flex-1'>
                      <Text className='text-base text-light-text dark:text-dark-text'>
                        {t('filters.buy') || 'Purchase'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={localPrefs.includeBuy}
                    onValueChange={() => toggleAvailabilityType('includeBuy')}
                    trackColor={{ false: '#767577', true: '#E50914' }}
                    thumbColor='#fff'
                  />
                </View>
              </View>
            </View>

            {/* Platforms Section */}
            {filteredProviders.length > 0 && (
              <View className='mb-6'>
                <Text className='mb-3 text-base font-semibold text-light-text dark:text-dark-text'>
                  {t('filters.platforms') || 'Platforms'}
                </Text>
                <Text className='mb-3 text-sm text-light-muted dark:text-dark-muted'>
                  {t('filters.platformsHint') ||
                    'Select platforms to filter results (leave empty for all)'}
                </Text>
                <View className='flex-row flex-wrap gap-2'>
                  {filteredProviders.map((provider: AvailableProvider) => {
                    const isSelected = localPrefs.platforms.includes(
                      provider.provider_id
                    );
                    return (
                      <TouchableOpacity
                        key={provider.provider_id}
                        onPress={() => togglePlatform(provider.provider_id)}
                        className={cn(
                          'flex-row items-center gap-2 rounded-xl border-2 px-3 py-2',
                          isSelected
                            ? 'border-netflix-500 bg-netflix-500/10'
                            : 'border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface'
                        )}
                      >
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}`,
                          }}
                          className='h-6 w-6 rounded'
                          resizeMode='contain'
                        />
                        <Text
                          className={cn(
                            'text-sm',
                            isSelected
                              ? 'font-semibold text-netflix-500'
                              : 'text-light-text dark:text-dark-text'
                          )}
                          numberOfLines={1}
                        >
                          {provider.provider_name}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name='checkmark-circle'
                            size={16}
                            color='#E50914'
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Actions */}
        {!isLoading && (
          <View className='absolute bottom-0 left-0 right-0 border-t border-light-border bg-light-background px-4 pb-10 pt-4 dark:border-dark-border dark:bg-dark-background'>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isUpdating}
              style={getButtonBorderRadius()}
              className={cn(
                'py-4',
                isUpdating ? 'bg-cinematic-600' : 'bg-netflix-500'
              )}
            >
              {isUpdating ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text className='text-center text-base font-semibold text-white'>
                  {saveAsDefault
                    ? t('filters.saveDefaults') || 'Save as Default'
                    : t('filters.apply') || 'Apply'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
