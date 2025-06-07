import { useLanguage } from '@/contexts/LanguageContext';
import type {
  SupportedLanguage,
  SupportedCountry,
  Country,
} from '@/contexts/LanguageContext';
import { MotiView } from 'moti';
import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const { language, setLanguage, country, setCountry, t, availableCountries } =
    useLanguage();

  const languages: Array<{
    code: SupportedLanguage;
    name: string;
    flag: string;
  }> = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  return (
    <SafeAreaView className='flex-1 bg-light-background dark:bg-dark-background'>
      <ScrollView className='flex-1 px-6 pt-8'>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          className='mb-8'
        >
          <Text className='text-3xl font-bold text-light-text dark:text-dark-text'>
            {t('modal.title')}
          </Text>
          <Text className='mt-2 text-base text-light-muted dark:text-dark-muted'>
            {language === 'fr'
              ? 'Personnalisez votre expérience'
              : 'Customize your experience'}
          </Text>
        </MotiView>

        {/* Language Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 200,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              🌍{' '}
              {language === 'fr'
                ? "Langue de l'application"
                : 'Application Language'}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: [
                        language === 'fr' ? 'Annuler' : 'Cancel',
                        ...languages.map(lang => `${lang.flag} ${lang.name}`),
                      ],
                      cancelButtonIndex: 0,
                      title:
                        language === 'fr'
                          ? 'Choisir une langue'
                          : 'Choose a language',
                    },
                    buttonIndex => {
                      if (buttonIndex > 0) {
                        const selectedLang = languages[buttonIndex - 1];
                        setLanguage(selectedLang.code);
                      }
                    }
                  );
                } else {
                  // Pour Android, utiliser Alert avec des boutons
                  Alert.alert(
                    language === 'fr'
                      ? 'Choisir une langue'
                      : 'Choose a language',
                    '',
                    [
                      {
                        text: language === 'fr' ? 'Annuler' : 'Cancel',
                        style: 'cancel',
                      },
                      ...languages.map(lang => ({
                        text: `${lang.flag} ${lang.name}`,
                        onPress: () => setLanguage(lang.code),
                      })),
                    ]
                  );
                }
              }}
              className='rounded-lg border border-light-border bg-light-background p-4 dark:border-dark-border dark:bg-dark-background'
            >
              <View className='flex-row items-center justify-between'>
                <Text className='text-base text-light-text dark:text-dark-text'>
                  {languages.find(lang => lang.code === language)?.flag}{' '}
                  {languages.find(lang => lang.code === language)?.name}
                </Text>
                <Text className='text-light-muted dark:text-dark-muted'>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Country Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 300,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              🌍 {t('settings.country')}
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: [
                        language === 'fr' ? 'Annuler' : 'Cancel',
                        ...availableCountries.map(
                          country => `${country.flag} ${country.name}`
                        ),
                      ],
                      cancelButtonIndex: 0,
                      title:
                        language === 'fr'
                          ? 'Choisir un pays'
                          : 'Choose a country',
                    },
                    buttonIndex => {
                      if (buttonIndex > 0) {
                        const selectedCountry =
                          availableCountries[buttonIndex - 1];
                        setCountry(selectedCountry.code);
                      }
                    }
                  );
                } else {
                  // Pour Android, utiliser Alert avec des boutons
                  Alert.alert(
                    language === 'fr' ? 'Choisir un pays' : 'Choose a country',
                    '',
                    [
                      {
                        text: language === 'fr' ? 'Annuler' : 'Cancel',
                        style: 'cancel',
                      },
                      ...availableCountries.map(countryItem => ({
                        text: `${countryItem.flag} ${countryItem.name}`,
                        onPress: () => setCountry(countryItem.code),
                      })),
                    ]
                  );
                }
              }}
              className='rounded-lg border border-light-border bg-light-background p-4 dark:border-dark-border dark:bg-dark-background'
            >
              <View className='flex-row items-center justify-between'>
                <Text className='text-base text-light-text dark:text-dark-text'>
                  {availableCountries.find(c => c.code === country)?.flag}{' '}
                  {availableCountries.find(c => c.code === country)?.name}
                </Text>
                <Text className='text-light-muted dark:text-dark-muted'>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* App Info Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            delay: 500,
            type: 'timing',
            duration: 600,
          }}
          className='mb-6'
        >
          <View className='rounded-xl bg-light-card p-6 dark:bg-dark-card'>
            <Text className='mb-4 text-lg font-semibold text-light-text dark:text-dark-text'>
              📱{' '}
              {language === 'fr'
                ? "À propos de l'application"
                : 'About the app'}
            </Text>
            <View className='space-y-3'>
              <View className='flex-row justify-between'>
                <Text className='text-light-muted dark:text-dark-muted'>
                  {language === 'fr' ? 'Version' : 'Version'}
                </Text>
                <Text className='text-light-text dark:text-dark-text'>
                  1.0.0
                </Text>
              </View>
              <View className='flex-row justify-between'>
                <Text className='text-light-muted dark:text-dark-muted'>
                  {language === 'fr' ? 'Développé par' : 'Developed by'}
                </Text>
                <Text className='text-light-text dark:text-dark-text'>
                  {language === 'fr' ? 'Votre équipe' : 'Your team'}
                </Text>
              </View>
            </View>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
