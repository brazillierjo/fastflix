// Configuration centralisée des langues et pays supportés

// Langues supportées
export const SUPPORTED_LANGUAGES = [
  'fr',
  'en',
  'ja',
  'it',
  'es',
  'de',
] as const;
export const DEFAULT_LANGUAGE = 'en' as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Pays supportés
const SUPPORTED_COUNTRIES = [
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
const LANGUAGE_COUNTRY_MAP: Record<SupportedLanguage, SupportedCountry> = {
  fr: 'FR',
  en: 'US',
  ja: 'JP',
  it: 'IT',
  es: 'ES',
  de: 'DE',
};

// Mapping des codes de langue vers les codes TMDB
const TMDB_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  ja: 'ja-JP',
  it: 'it-IT',
  es: 'es-ES',
  de: 'de-DE',
};

/**
 * Convertit un code de langue de l'application vers le code de langue TMDB
 * @param language - Code de langue de l'application (fr, en, ja, it)
 * @returns Code de langue TMDB (fr-FR, en-US, ja-JP, it-IT)
 */
export const getLanguageForTMDB = (language: SupportedLanguage): string => {
  return TMDB_LANGUAGE_MAP[language] || TMDB_LANGUAGE_MAP[DEFAULT_LANGUAGE];
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
interface Language {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

// Liste des langues disponibles avec leurs informations d'affichage
export const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

// Utilitaires pour la gestion des langues
export const isValidLanguage = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
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
