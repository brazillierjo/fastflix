'use client';

import { APP_STORE_LINKS } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

const BADGE_MAP: Record<string, string> = {
  en: '/badge-en.svg',
  fr: '/badge-fr.svg',
  de: '/badge-de.svg',
  es: '/badge-es.svg',
  it: '/badge-it.svg',
  ja: '/badge-ja.svg',
};

/**
 * Official Apple App Store badge — uses Apple's own SVG assets
 * downloaded from https://tools.applemediaservices.com
 * Automatically switches language based on the site's current locale.
 */
export function AppStoreBadge({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const badgeSrc = BADGE_MAP[language] || BADGE_MAP.en;

  return (
    <a
      href={APP_STORE_LINKS.ios}
      target='_blank'
      rel='noopener noreferrer'
      className={`inline-block transition-opacity hover:opacity-80 ${className}`}
      aria-label='Download on the App Store'
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={badgeSrc}
        alt='Download on the App Store'
        height={48}
        style={{ height: 48, width: 'auto' }}
      />
    </a>
  );
}
