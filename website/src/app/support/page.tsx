'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CONTACT_EMAIL, EMAIL_SUBJECTS } from '@/lib/constants';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  Bug,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';

export default function Support() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems = t('faqItems');

  const contactOptions = [
    {
      icon: Bug,
      title: t('bugReport'),
      description: t('bugReportDesc'),
      action: `mailto:${CONTACT_EMAIL}?subject=${EMAIL_SUBJECTS.bugReport}`,
      buttonText: t('reportBug'),
    },
    {
      icon: Lightbulb,
      title: t('featureRequest'),
      description: t('featureRequestDesc'),
      action: `mailto:${CONTACT_EMAIL}?subject=${EMAIL_SUBJECTS.featureRequest}`,
      buttonText: t('submitIdea'),
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
              <HelpCircle className='h-8 w-8 text-green-600' />
            </div>
            <h1 className='mb-4 text-4xl font-bold text-gray-900'>
              {t('supportTitle')}
            </h1>
            <p className='text-lg text-gray-600'>{t('supportSubtitle')}</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='mb-12'>
          <h2 className='mb-6 text-center text-2xl font-bold text-gray-900'>
            {t('faq')}
          </h2>
          <div className='space-y-4'>
            {faqItems.map((item: any, index: number) => (
              <Card key={index} className='shadow-md'>
                <CardHeader
                  className='cursor-pointer transition-colors hover:bg-gray-50'
                  onClick={() => toggleFaq(index)}
                >
                  <CardTitle className='flex items-center justify-between'>
                    <span className='text-lg font-medium text-gray-900'>
                      {item.question}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp className='h-5 w-5 text-gray-500' />
                    ) : (
                      <ChevronDown className='h-5 w-5 text-gray-500' />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaq === index && (
                  <CardContent className='pt-0'>
                    <Separator className='mb-4' />
                    <p className='leading-relaxed text-gray-600'>
                      {item.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <div className='mb-12'>
          <h2 className='mb-6 text-center text-2xl font-bold text-gray-900'>
            {t('contactSupport')}
          </h2>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card
                  key={index}
                  className='shadow-lg transition-shadow hover:shadow-xl'
                >
                  <CardContent className='p-6'>
                    <div className='flex items-start space-x-4'>
                      <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100'>
                        <Icon className='h-6 w-6 text-blue-600' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                          {option.title}
                        </h3>
                        <p className='text-muted-foreground'>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Help */}
        <Card className='border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50'>
          <CardContent className='p-8 text-center'>
            <h3 className='mb-4 text-xl font-semibold text-gray-900'>
              {t('needImmediateHelp')}
            </h3>
            <p className='mb-6 text-gray-600'>
              Pour signaler un bug, demander une nouvelle fonctionnalité ou
              obtenir de l&apos;aide, contactez-nous par email.
            </p>
            <div className='flex justify-center'>
              <Button
                onClick={() =>
                  (window.location.href = `mailto:${CONTACT_EMAIL}?subject=${EMAIL_SUBJECTS.support}`)
                }
              >
                <Mail className='mr-2 h-4 w-4' />
                {t('contactUs')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Info */}
        <div className='mt-8 text-center'>
          <Separator className='mb-6' />
          <div className='grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-3'>
            <div>
              <strong className='text-gray-900'>{t('emailSupportTime')}</strong>
              <br />
              {t('emailResponseTime')}
            </div>
            <div>
              <strong className='text-gray-900'>{t('bugReportsTime')}</strong>
              <br />
              {t('bugAcknowledgeTime')}
            </div>
            <div>
              <strong className='text-gray-900'>
                {t('featureRequestsTime')}
              </strong>
              <br />
              {t('featureReviewTime')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
