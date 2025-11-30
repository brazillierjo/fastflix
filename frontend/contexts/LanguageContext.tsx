import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

// Import translations
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ja from '../locales/ja.json';
import it from '../locales/it.json';
import es from '../locales/es.json';
import de from '../locales/de.json';

// Import centralized constants
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  AVAILABLE_COUNTRIES,
  isValidLanguage,
  getDefaultCountryForLanguage,
  detectLanguageFromDevice,
  type SupportedLanguage,
  type SupportedCountry,
  type Country,
} from '../constants/languages';

// Import placeholder examples
import { getRandomPlaceholder } from '../constants/examples';

type Translations = {
  [key in SupportedLanguage]: typeof fr;
};

const translations: Translations = {
  fr,
  en,
  ja,
  it,
  es,
  de,
};

// Re-export for backward compatibility
export const availableCountries = AVAILABLE_COUNTRIES;

export type AvailableCountries = {
  [key in SupportedCountry]: Country;
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  country: SupportedCountry;
  setCountry: (country: SupportedCountry) => void;
  t: (key: string) => string;
  getRandomPlaceholder: () => string;
  availableLanguages: SupportedLanguage[];
  availableCountries: Country[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const LANGUAGE_STORAGE_KEY = '@app_language';
const COUNTRY_STORAGE_KEY = '@app_country';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [country, setCountryState] = useState<SupportedCountry>('FR');

  // Get nested value from object using dot notation
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string
  ): string => {
    return (
      (path.split('.').reduce((current: unknown, key: string) => {
        if (current && typeof current === 'object' && key in current) {
          return (current as Record<string, unknown>)[key];
        }
        return undefined;
      }, obj) as string) || path
    );
  };

  // Translation function
  const t = (key: string): string => {
    return getNestedValue(translations[language], key);
  };

  // Get random placeholder function
  const getRandomPlaceholderText = (): string => {
    return getRandomPlaceholder(language);
  };

  // Set language and save to storage
  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Set country and save to storage
  const setCountry = async (countryCode: SupportedCountry) => {
    setCountryState(countryCode);
    try {
      await AsyncStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
    } catch (error) {
      console.error('Error saving country preference:', error);
    }
  };

  // Initialize language and country on app start
  useEffect(() => {
    const initializePreferences = async () => {
      try {
        // Initialize language
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && isValidLanguage(savedLanguage)) {
          setLanguageState(savedLanguage);
        } else {
          // If no saved preference, detect device language
          const deviceLocales = getLocales();
          const deviceLanguage = deviceLocales[0]?.languageCode ?? undefined;
          const detectedLanguage = detectLanguageFromDevice(deviceLanguage);
          setLanguageState(detectedLanguage);
        }

        // Initialize country
        const savedCountry = await AsyncStorage.getItem(COUNTRY_STORAGE_KEY);
        const supportedCountryCodes = availableCountries.map(c => c.code);

        if (
          savedCountry &&
          supportedCountryCodes.includes(savedCountry as SupportedCountry)
        ) {
          setCountryState(savedCountry as SupportedCountry);
        } else {
          // If no saved preference, detect device region
          const deviceLocales = getLocales();
          const deviceRegion = deviceLocales[0]?.regionCode;

          if (
            deviceRegion &&
            supportedCountryCodes.includes(deviceRegion as SupportedCountry)
          ) {
            setCountryState(deviceRegion as SupportedCountry);
          } else {
            // Default based on language preference
            const currentLanguage =
              savedLanguage && isValidLanguage(savedLanguage)
                ? savedLanguage
                : detectLanguageFromDevice(
                    deviceLocales[0]?.languageCode ?? undefined
                  );
            const defaultCountry =
              getDefaultCountryForLanguage(currentLanguage);
            setCountryState(defaultCountry);
          }
        }
      } catch (error) {
        console.error('Error initializing preferences:', error);
        setLanguageState(DEFAULT_LANGUAGE);
        setCountryState(getDefaultCountryForLanguage(DEFAULT_LANGUAGE));
      }
    };

    initializePreferences();
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    country,
    setCountry,
    t,
    getRandomPlaceholder: getRandomPlaceholderText,
    availableLanguages: [...SUPPORTED_LANGUAGES],
    availableCountries,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
