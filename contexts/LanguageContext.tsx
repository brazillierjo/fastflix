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

type Translations = {
  [key in SupportedLanguage]: typeof fr;
};

const translations: Translations = {
  fr,
  en,
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  availableLanguages: SupportedLanguage[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

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

  // Initialize language on app start
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // First, try to get saved language preference
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (
          savedLanguage &&
          (savedLanguage === 'fr' || savedLanguage === 'en')
        ) {
          setLanguageState(savedLanguage as SupportedLanguage);
          return;
        }

        // If no saved preference, detect device language
        const deviceLocales = getLocales();
        const deviceLanguage = deviceLocales[0]?.languageCode;

        // Check if device language is supported
        if (deviceLanguage === 'fr') {
          setLanguageState('fr');
        } else {
          // Default to English for any other language
          setLanguageState('en');
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        setLanguageState('en'); // Fallback to English
      }
    };

    initializeLanguage();
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: ['fr', 'en'],
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
