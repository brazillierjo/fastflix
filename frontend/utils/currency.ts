import { SupportedCountry } from '@/constants/languages';

// Mapping des pays vers leurs devises
const COUNTRY_CURRENCY_MAP: Record<SupportedCountry, string> = {
  FR: 'EUR',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  JP: 'JPY',
};

// Symboles des devises
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  CAD: 'C$',
  GBP: '£',
  JPY: '¥',
};

// Mapping des devises vers leurs locales pour le formatage
const CURRENCY_LOCALES: Record<string, string> = {
  EUR: 'fr-FR',
  USD: 'en-US',
  CAD: 'en-CA',
  GBP: 'en-GB',
  JPY: 'ja-JP',
};

/**
 * Obtient la devise pour un pays donné
 * @param country - Code du pays
 * @returns Code de la devise (EUR, USD, etc.)
 */
export const getCurrencyForCountry = (country: SupportedCountry): string => {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
};

/**
 * Obtient le symbole de devise pour un pays donné
 * @param country - Code du pays
 * @returns Symbole de la devise (€, $, etc.)
 */
const getCurrencySymbolForCountry = (country: SupportedCountry): string => {
  const currency = getCurrencyForCountry(country);
  return CURRENCY_SYMBOLS[currency] || '$';
};

/**
 * Formate un prix selon la devise et les conventions locales du pays
 * @param price - Prix à formater (nombre)
 * @param country - Code du pays
 * @returns Prix formaté avec la devise appropriée
 */
export const formatPriceForCountry = (
  price: number,
  country: SupportedCountry
): string => {
  const currency = getCurrencyForCountry(country);
  const locale = CURRENCY_LOCALES[currency] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  } catch {
    // Fallback en cas d'erreur de formatage
    const symbol = getCurrencySymbolForCountry(country);
    return `${symbol}${price.toFixed(2)}`;
  }
};

/**
 * Extrait le prix numérique d'une chaîne de prix RevenueCat
 * @param priceString - Chaîne de prix de RevenueCat (ex: "$9.99")
 * @returns Prix numérique ou null si impossible à extraire
 */
export const extractPriceFromString = (priceString: string): number | null => {
  // Supprime tous les caractères non numériques sauf le point et la virgule
  const cleanPrice = priceString.replace(/[^0-9.,]/g, '');

  // Remplace la virgule par un point pour la conversion
  const normalizedPrice = cleanPrice.replace(',', '.');

  const price = parseFloat(normalizedPrice);
  return isNaN(price) ? null : price;
};

/**
 * Détecte la devise probable d'une chaîne de prix
 * @param priceString - Chaîne de prix (ex: "€9.99", "$9.99")
 * @returns Code de devise détecté ou 'USD' par défaut
 */
export const detectCurrencyFromPriceString = (priceString: string): string => {
  if (priceString.includes('€')) return 'EUR';
  if (priceString.includes('£')) return 'GBP';
  if (priceString.includes('¥')) return 'JPY';
  if (priceString.includes('C$')) return 'CAD';
  if (priceString.includes('$')) return 'USD';

  return 'USD'; // Défaut
};
