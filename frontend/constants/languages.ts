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

// Country type — any ISO 3166-1 alpha-2 code
export type SupportedCountry = string;

// Configuration des langues avec leurs pays par défaut
const LANGUAGE_COUNTRY_MAP: Record<SupportedLanguage, string> = {
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
 */
export const getLanguageForTMDB = (language: SupportedLanguage): string => {
  return TMDB_LANGUAGE_MAP[language] || TMDB_LANGUAGE_MAP[DEFAULT_LANGUAGE];
};

// Interface pour les pays
export interface Country {
  code: string;
  name: string;
  flag: string;
}

// Liste complète des pays supportés par TMDB (streaming providers)
// Les plus courants en premier pour un meilleur UX
export const AVAILABLE_COUNTRIES: Country[] = [
  // Tier 1 — Most common
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  // Tier 2 — Europe
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  // Tier 3 — Americas
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'GF', name: 'French Guiana', flag: '🇬🇫' },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  // Tier 4 — Asia-Pacific
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  // Tier 5 — Middle East & Africa
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  // Tier 6 — Eastern Europe & Central Asia
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
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
): string => {
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
