// Configuration centralisée des langues et pays supportés

// Langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ja', 'it'] as const;
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
    it: 'IT',
  };

// Mapping des codes de langue vers les codes TMDB
export const TMDB_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  ja: 'ja-JP',
  it: 'it-IT',
};

/**
 * Convertit un code de langue de l'application vers le code de langue TMDB
 * @param language - Code de langue de l'application (fr, en, ja, it)
 * @returns Code de langue TMDB (fr-FR, en-US, ja-JP, it-IT)
 */
export const getLanguageForTMDB = (language: SupportedLanguage): string => {
  return TMDB_LANGUAGE_MAP[language] || TMDB_LANGUAGE_MAP[DEFAULT_LANGUAGE];
};

/**
 * Détermine les langues de fallback pour les recherches TMDB
 * Retourne un tableau de langues TMDB ordonnées par priorité de recherche
 * @param primaryLanguage - Langue principale sélectionnée par l'utilisateur
 * @returns Tableau des codes de langue TMDB pour la stratégie de fallback
 */
export const getTMDBFallbackLanguages = (
  primaryLanguage: SupportedLanguage
): string[] => {
  const primaryTMDBLanguage = getLanguageForTMDB(primaryLanguage);

  // Ordre de priorité pour les langues de fallback basé sur la couverture TMDB
  const fallbackPriority: SupportedLanguage[] = ['en', 'fr', 'it', 'ja'];

  // Créer la liste des langues de fallback en excluant la langue principale
  const fallbackLanguages = fallbackPriority
    .filter(lang => lang !== primaryLanguage)
    .map(lang => getLanguageForTMDB(lang));

  return [primaryTMDBLanguage, ...fallbackLanguages];
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
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
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
