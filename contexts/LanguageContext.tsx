import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import fr from '../locales/fr.json';
import en from '../locales/en.json';

export type SupportedLanguage = 'fr' | 'en';
export type SupportedCountry = 'FR' | 'US' | 'CA' | 'GB' | 'DE' | 'ES' | 'IT';

type Translations = {
  [key in SupportedLanguage]: typeof fr;
};

const translations: Translations = {
  fr,
  en,
};

export interface Country {
  code: SupportedCountry;
  name: string;
  flag: string;
}

export const availableCountries: Country[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
];

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  country: SupportedCountry;
  setCountry: (country: SupportedCountry) => void;
  t: (key: string) => string;
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
  const getNestedValue = (obj: any, path: string): string => {
    return (
      path.split('.').reduce((current, key) => current?.[key], obj) || path
    );
  };

  // Translation function
  const t = (key: string): string => {
    return getNestedValue(translations[language], key);
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
        if (
          savedLanguage &&
          (savedLanguage === 'fr' || savedLanguage === 'en')
        ) {
          setLanguageState(savedLanguage as SupportedLanguage);
        } else {
          // If no saved preference, detect device language
          const deviceLocales = getLocales();
          const deviceLanguage = deviceLocales[0]?.languageCode;
          
          if (deviceLanguage === 'fr') {
            setLanguageState('fr');
          } else {
            setLanguageState('en');
          }
        }

        // Initialize country
        const savedCountry = await AsyncStorage.getItem(COUNTRY_STORAGE_KEY);
        const supportedCountryCodes = availableCountries.map(c => c.code);
        
        if (savedCountry && supportedCountryCodes.includes(savedCountry as SupportedCountry)) {
          setCountryState(savedCountry as SupportedCountry);
        } else {
          // If no saved preference, detect device region
          const deviceLocales = getLocales();
          const deviceRegion = deviceLocales[0]?.regionCode;
          
          if (deviceRegion && supportedCountryCodes.includes(deviceRegion as SupportedCountry)) {
            setCountryState(deviceRegion as SupportedCountry);
          } else {
            // Default based on language preference
            const defaultCountry = savedLanguage === 'fr' || deviceLocales[0]?.languageCode === 'fr' ? 'FR' : 'US';
            setCountryState(defaultCountry);
          }
        }
      } catch (error) {
        console.error('Error initializing preferences:', error);
        setLanguageState('en');
        setCountryState('FR');
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
    availableLanguages: ['fr', 'en'],
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
