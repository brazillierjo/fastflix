// Configuration centralisée des langues et pays supportés

// Langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ja'] as const;
export const DEFAULT_LANGUAGE = 'en' as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Pays supportés
export const SUPPORTED_COUNTRIES = [
  'FR',
  'US',
  'CA',
  'GB',
  'DE',
  'ES',
  'IT',
  'JP',
] as const;

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

// Configuration des langues avec leurs pays par défaut
export const LANGUAGE_COUNTRY_MAP: Record<SupportedLanguage, SupportedCountry> =
  {
    fr: 'FR',
    en: 'US',
    ja: 'JP',
  };

// Interface pour les pays
export interface Country {
  code: SupportedCountry;
  name: string;
  flag: string;
}

// Liste des pays disponibles
export const AVAILABLE_COUNTRIES: Country[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];

// Interface pour les langues avec leurs informations d'affichage
export interface Language {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

// Liste des langues disponibles avec leurs informations d'affichage
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

// Utilitaires pour la gestion des langues
export const isValidLanguage = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

export const isValidCountry = (
  country: string
): country is SupportedCountry => {
  return SUPPORTED_COUNTRIES.includes(country as SupportedCountry);
};

export const getDefaultCountryForLanguage = (
  language: SupportedLanguage
): SupportedCountry => {
  return LANGUAGE_COUNTRY_MAP[language] || 'US';
};

export const detectLanguageFromDevice = (
  deviceLanguage?: string
): SupportedLanguage => {
  if (deviceLanguage && isValidLanguage(deviceLanguage)) {
    return deviceLanguage;
  }
  return DEFAULT_LANGUAGE;
};
