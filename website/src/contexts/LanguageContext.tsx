'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationKey, getTranslation } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Supported languages
    const supportedLanguages: Language[] = ['en', 'fr', 'it', 'ja', 'es', 'de'];

    // Check for saved language preference
    const savedLanguage = localStorage.getItem('fastflix-language') as Language;
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      const detectedLang = supportedLanguages.find(lang =>
        browserLang.startsWith(lang)
      );
      if (detectedLang) {
        setLanguage(detectedLang);
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('fastflix-language', lang);
  };

  const t = (key: TranslationKey) => {
    return getTranslation(language, key);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
