import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HtmlLangUpdater } from '@/components/HtmlLangUpdater';
import { Navigation } from '@/components/Navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "FastFlix — Trouvez quoi regarder ce soir grâce à l'IA",
  description:
    "FastFlix utilise l'IA Google Gemini pour vous recommander des films et séries personnalisés selon vos goûts. Notez, découvrez et trouvez votre prochaine pépite.",
  keywords: [
    'film',
    'série',
    'recommandation',
    'IA',
    'streaming',
    'Netflix',
    'Disney+',
    'Amazon Prime',
  ],
  authors: [{ name: 'FastFlix' }],
  creator: 'FastFlix',
  openGraph: {
    title: 'FastFlix — Trouvez quoi regarder ce soir',
    description:
      "L'IA qui apprend vos goûts et vous recommande des films et séries parfaits pour vous.",
    url: 'https://fastflix.fr',
    siteName: 'FastFlix',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FastFlix — Recommandations IA de films et séries',
    description:
      "Décrivez ce que vous voulez regarder, l'IA trouve pour vous.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://fastflix.fr',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='fr'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MobileApplication',
              name: 'FastFlix',
              operatingSystem: 'iOS',
              applicationCategory: 'EntertainmentApplication',
              description:
                'AI-powered movie and TV show recommendations personalized to your taste.',
              offers: {
                '@type': 'Offer',
                price: '1.99',
                priceCurrency: 'EUR',
              },
            }),
          }}
        />
        <LanguageProvider>
          <HtmlLangUpdater />
          <Navigation />
          <main>{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
