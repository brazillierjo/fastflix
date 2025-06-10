'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CONTACT_EMAIL, EMAIL_SUBJECTS } from '@/lib/constants';
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  UserCheck,
  Calendar,
} from 'lucide-react';

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Eye,
      title: t('dataCollection'),
      content: t('dataCollectionDesc'),
      items: t('dataCollectionItems'),
    },
    {
      icon: Lock,
      title: t('dataUsage'),
      content: t('dataUsageDesc'),
      items: t('dataUsageItems'),
    },
    {
      icon: Shield,
      title: t('dataSharing'),
      content: t('dataSharingDesc'),
      items: t('dataSharingItems'),
    },
    {
      icon: Calendar,
      title: t('dataRetention'),
      content: t('dataRetentionDesc'),
      items: null,
    },
    {
      icon: UserCheck,
      title: t('yourRights'),
      content: t('yourRightsDesc'),
      items: t('yourRightsItems'),
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link href='/'>
            <Button variant='ghost' className='mb-4'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('backToHome')}
            </Button>
          </Link>
          <div className='text-center'>
            <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100'>
              <Shield className='h-8 w-8 text-blue-600' />
            </div>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              {t('privacyTitle')}
            </h1>
            <p className='mx-auto max-w-2xl text-lg text-gray-600'>
              {t('privacyIntro')}
            </p>
            <div className='mt-4 text-sm text-gray-500'>
              {t('lastUpdated')}: December 2024
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='space-y-8'>
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100'>
                      <Icon className='h-5 w-5 text-blue-600' />
                    </div>
                    <span className='text-xl font-semibold text-gray-900'>
                      {section.title}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='mb-4 text-gray-700'>{section.content}</p>
                  {section.items && (
                    <ul className='space-y-2'>
                      {section.items.map((item: string, itemIndex: number) => (
                        <li
                          key={itemIndex}
                          className='flex items-start space-x-2'
                        >
                          <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500' />
                          <span className='text-gray-600'>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Section */}
        <Card className='mt-12 border-blue-200 bg-blue-50'>
          <CardContent className='p-8 text-center'>
            <h3 className='mb-4 text-xl font-semibold text-gray-900'>
              {t('privacyContactTitle')}
            </h3>
            <p className='text-muted-foreground mb-6'>
              {t('privacyContactDesc')}
            </p>
            <Button
              className='px-6 py-2'
              onClick={() =>
                (window.location.href = `mailto:${CONTACT_EMAIL}?subject=${EMAIL_SUBJECTS.general}`)
              }
            >
              {t('contactUs')}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='mt-12 text-center'>
          <Separator className='mb-6' />
          <p className='text-sm text-gray-500'>{t('privacyFooter')}</p>
        </div>
      </div>
    </div>
  );
}
