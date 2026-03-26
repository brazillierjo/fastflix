'use client';

import { APP_STORE_LINKS } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

const BADGE_TEXT: Record<string, { line1: string; line2: string }> = {
  en: { line1: 'Download on the', line2: 'App Store' },
  fr: { line1: 'T\u00e9l\u00e9charger dans l\u2019', line2: 'App Store' },
  de: { line1: 'Laden im', line2: 'App Store' },
  es: { line1: 'Desc\u00e1rgalo en el', line2: 'App Store' },
  it: { line1: 'Scarica su', line2: 'App Store' },
  ja: { line1: '\u5165\u624b\u5148', line2: 'App Store' },
};

/**
 * Official Apple App Store badge following Apple Marketing Guidelines.
 * Black rounded-rect with Apple logo + localized text.
 */
export function AppStoreBadge({ className = '' }: { className?: string }) {
  const { language } = useLanguage();
  const text = BADGE_TEXT[language] || BADGE_TEXT.en;

  return (
    <a
      href={APP_STORE_LINKS.ios}
      target='_blank'
      rel='noopener noreferrer'
      className={`inline-block transition-opacity hover:opacity-80 ${className}`}
      aria-label='Download on the App Store'
    >
      <svg
        viewBox='0 0 200 60'
        xmlns='http://www.w3.org/2000/svg'
        className='h-[52px] w-auto'
      >
        {/* Background */}
        <rect width='200' height='60' rx='10' fill='#000' />
        <rect
          x='0.75'
          y='0.75'
          width='198.5'
          height='58.5'
          rx='9.25'
          stroke='#a6a6a6'
          strokeWidth='0.75'
          fill='none'
        />

        {/* Apple logo */}
        <g transform='translate(16, 10) scale(0.075)' fill='#fff'>
          <path d='M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 176.6 4 273.6c0 27.3 5 55.6 15 84.8 13.4 38.7 61.8 133.6 112.2 131.8 26.5-.6 45.3-19 79.7-19 33.4 0 50.8 19 80.8 19 50.9-.6 94.2-87 107-125.7-68-32.6-63.7-95.1-63.4-95.8zm-59.6-144C280.4 100 296 64.1 292.3 27c-31.5 2-68.3 21.6-90 46.3C182 97.2 164.3 134.5 168.6 168c34.4 2.6 66.3-18.4 90.5-43.3z' />
        </g>

        {/* Text */}
        <text
          x='62'
          y='24'
          fill='#fff'
          fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif'
          fontSize='11'
          fontWeight='400'
          letterSpacing='0.2'
        >
          {text.line1}
        </text>
        <text
          x='62'
          y='44'
          fill='#fff'
          fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif'
          fontSize='20'
          fontWeight='600'
          letterSpacing='-0.2'
        >
          {text.line2}
        </text>
      </svg>
    </a>
  );
}
