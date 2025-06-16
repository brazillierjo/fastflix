'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CONTACT_EMAIL, EMAIL_SUBJECTS } from '@/lib/constants';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Users,
  CreditCard,
  Copyright,
  AlertTriangle,
  XCircle,
  Edit,
  Scale,
} from 'lucide-react';

export default function TermsOfUse() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: CheckCircle,
      title: t('acceptanceOfTerms'),
      content: t('acceptanceOfTermsDesc'),
      items: null,
    },
    {
      icon: Users,
      title: t('useOfService'),
      content: t('useOfServiceDesc'),
      items: t('useOfServiceItems'),
    },
    {
      icon: CreditCard,
      title: t('subscriptionTerms'),
      content: t('subscriptionTermsDesc'),
      items: t('subscriptionTermsItems'),
    },
    {
      icon: Copyright,
      title: t('intellectualProperty'),
      content: t('intellectualPropertyDesc'),
      items: null,
    },
    {
      icon: AlertTriangle,
      title: t('limitationOfLiability'),
      content: t('limitationOfLiabilityDesc'),
      items: null,
    },
    {
      icon: XCircle,
      title: t('termination'),
      content: t('terminationDesc'),
      items: null,
    },
    {
      icon: Edit,
      title: t('changesToTerms'),
      content: t('changesToTermsDesc'),
      items: null,
    },
    {
      icon: Scale,
      title: t('governingLaw'),
      content: t('governingLawDesc'),
      items: null,
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
            <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
              <FileText className='h-8 w-8 text-green-600' />
            </div>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              {t('termsTitle')}
            </h1>
            <p className='mx-auto max-w-2xl text-lg text-gray-600'>
              {t('termsIntro')}
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
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100'>
                      <Icon className='h-5 w-5 text-green-600' />
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
                          <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500' />
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
        <Card className='mt-12 border-green-200 bg-green-50'>
          <CardContent className='p-8 text-center'>
            <h3 className='mb-4 text-xl font-semibold text-gray-900'>
              {t('termsContactTitle')}
            </h3>
            <p className='text-muted-foreground mb-6'>
              {t('termsContactDesc')}
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
          <p className='text-sm text-gray-500'>{t('termsFooter')}</p>
        </div>
      </div>
    </div>
  );
}
