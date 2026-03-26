'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_STORE_LINKS } from '@/lib/constants';
import {
  Smartphone,
  Tablet,
  MessageSquare,
  Filter,
  Download,
  Sparkles,
  Star,
  TrendingUp,
  Heart,
} from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();

  const features = [
    {
      icon: MessageSquare,
      title: t('flexiblePrompts'),
      description: t('flexiblePromptsDesc'),
    },
    {
      icon: Heart,
      title: t('aiPowered'),
      description: t('aiPoweredDesc'),
    },
    {
      icon: Filter,
      title: t('platformFiltering'),
      description: t('platformFilteringDesc'),
    },
    {
      icon: Sparkles,
      title: t('forYou'),
      description: t('forYouDesc'),
    },
    {
      icon: TrendingUp,
      title: t('dailyPick'),
      description: t('dailyPickDesc'),
    },
    {
      icon: Star,
      title: t('watchlistFeature'),
      description: t('watchlistFeatureDesc'),
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-20 sm:py-32'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <Image
              src='/logo.png'
              alt='FastFlix'
              width={80}
              height={80}
              className='mx-auto mb-6 rounded-[18px] shadow-lg'
            />

            <Badge variant='secondary' className='mb-4 px-3 py-1'>
              <Sparkles className='mr-1 h-3 w-3' />
              {t('heroBadge')}
            </Badge>

            <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white'>
              {t('heroTitle')}{' '}
              <span className='from-netflix to-netflix-dark bg-gradient-to-r bg-clip-text text-transparent'>
                {t('heroTitleHighlight')}
              </span>
            </h1>
            <p className='mx-auto mt-6 max-w-3xl text-xl leading-8 text-gray-600'>
              {t('heroDescription')}
            </p>
            <p className='mx-auto mt-4 max-w-2xl text-lg text-gray-500'>
              {t('heroSubDescription')}
            </p>
            <div className='mt-10 flex items-center justify-center gap-x-6'>
              <Button size='lg' asChild>
                <a
                  href={APP_STORE_LINKS.ios}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Download className='mr-2 h-4 w-4' />
                  {t('downloadIOS')}
                </a>
              </Button>
            </div>

            <p className='mt-4 text-sm text-gray-500'>
              {t('privacyStatement')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='bg-white py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              {t('featuresTitle')}
            </h2>
            <p className='mt-4 text-lg text-gray-600'>
              {t('featuresDescription')}
            </p>
          </div>
          <div className='mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className='border-0 text-center shadow-lg transition-shadow hover:shadow-xl'
                >
                  <CardContent className='p-6'>
                    <div className='rounded-squircle from-netflix to-netflix-dark mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-gradient-to-br'>
                      <Icon className='h-6 w-6 text-white' />
                    </div>
                    <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                      {feature.title}
                    </h3>
                    <p className='text-gray-600'>{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className='bg-gray-50 py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              {t('previewTitle')}
            </h2>
            <p className='mt-4 text-lg text-gray-600'>
              {t('previewDescription')}
            </p>
          </div>
          <div className='mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12 lg:gap-16'>
            {/* Home Screen */}
            <div className='flex flex-col items-center'>
              <div className='overflow-hidden rounded-[2.5rem] border-[8px] border-gray-900 bg-gray-900 shadow-2xl'>
                <Image
                  src='/screenshot-home.png'
                  alt='FastFlix Home Screen'
                  width={280}
                  height={607}
                  className='rounded-[2rem]'
                  priority
                />
              </div>
              <p className='mt-4 text-sm font-medium text-gray-600'>
                {t('previewHome')}
              </p>
            </div>
            {/* Search Screen */}
            <div className='flex flex-col items-center'>
              <div className='overflow-hidden rounded-[2.5rem] border-[8px] border-gray-900 bg-gray-900 shadow-2xl'>
                <Image
                  src='/screenshot-search.png'
                  alt='FastFlix AI Search'
                  width={280}
                  height={607}
                  className='rounded-[2rem]'
                  priority
                />
              </div>
              <p className='mt-4 text-sm font-medium text-gray-600'>
                {t('previewSearch')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='bg-white py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl'>
              {t('platformTitle')}
            </h2>
            <p className='mt-4 text-lg text-gray-600'>
              {t('platformDescription')}
            </p>
            <div className='mt-12 flex items-center justify-center space-x-12'>
              <div className='text-center'>
                <Smartphone className='text-netflix mx-auto mb-2 h-12 w-12' />
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  {t('iphoneSupport')}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {t('iphoneRequirement')}
                </p>
              </div>
              <div className='text-center'>
                <Tablet className='text-netflix mx-auto mb-2 h-12 w-12' />
                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                  {t('ipadSupport')}
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {t('ipadRequirement')}
                </p>
              </div>
            </div>
            <div className='mx-auto mt-12 max-w-4xl'>
              <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                <div className='text-center'>
                  <div className='bg-netflix/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
                    <span className='text-netflix text-lg font-bold'>1</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    {t('step1Title')}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {t('step1Desc')}
                  </p>
                </div>
                <div className='text-center'>
                  <div className='bg-netflix/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
                    <span className='text-netflix text-lg font-bold'>2</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    {t('step2Title')}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {t('step2Desc')}
                  </p>
                </div>
                <div className='text-center'>
                  <div className='bg-netflix/30 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
                    <span className='text-netflix text-lg font-bold'>3</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                    {t('step3Title')}
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {t('step3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='from-netflix to-netflix-dark bg-gradient-to-r py-20'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <Image
              src='/logo.png'
              alt='FastFlix'
              width={64}
              height={64}
              className='mx-auto mb-6 rounded-[14px] shadow-2xl'
            />
            <h2 className='text-3xl font-bold tracking-tight text-white sm:text-4xl'>
              {t('ctaTitle')}
            </h2>
            <h3 className='mt-2 text-2xl font-semibold tracking-tight text-white/90'>
              {t('ctaSubtitle')}
            </h3>
            <div className='mt-8 flex items-center justify-center gap-x-6'>
              <Button
                size='lg'
                variant='secondary'
                className='px-8 py-3'
                onClick={() => window.open(APP_STORE_LINKS.ios, '_blank')}
              >
                <Download className='mr-2 h-4 w-4' />
                {t('downloadForIOS')}
              </Button>
              <Link href='/support'>
                <Button
                  size='lg'
                  variant='outline'
                  className='hover:text-netflix border-white bg-white/20 px-8 py-3 text-white hover:bg-white'
                >
                  {t('learnMore')}
                </Button>
              </Link>
            </div>
            <p className='mt-4 text-sm text-white/60'>{t('ctaPrivacy')}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='mb-4 flex items-center justify-center space-x-3'>
              <Image
                src='/logo.png'
                alt='FastFlix'
                width={36}
                height={36}
                className='rounded-[8px]'
              />
              <span className='text-xl font-bold text-white'>FastFlix</span>
            </div>
            <div className='mb-8 flex justify-center space-x-8'>
              <Link
                href='/privacy-policy'
                className='text-gray-400 transition-colors hover:text-white'
              >
                {t('privacyPolicy')}
              </Link>
              <Link
                href='/terms-of-use'
                className='text-gray-400 transition-colors hover:text-white'
              >
                {t('termsOfUse')}
              </Link>
              <Link
                href='/support'
                className='text-gray-400 transition-colors hover:text-white'
              >
                {t('support')}
              </Link>
            </div>
            <p className='text-sm text-gray-400'>
              © {new Date().getFullYear()} FastFlix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
