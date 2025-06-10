'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Home, Shield, HelpCircle } from 'lucide-react';

export function Navigation() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className='sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600'>
              <span className='text-sm font-bold text-white'>FF</span>
            </div>
            <span className='text-xl font-bold text-gray-900'>FastFlix</span>
          </Link>

          {/* Navigation Links */}
          <div className='hidden items-center space-x-8 md:flex'>
            <Link
              href='/'
              className='flex items-center space-x-1 text-gray-600 transition-colors hover:text-gray-900'
            >
              <Home className='h-4 w-4' />
              <span>{t('home')}</span>
            </Link>
            <Link
              href='/privacy-policy'
              className='flex items-center space-x-1 text-gray-600 transition-colors hover:text-gray-900'
            >
              <Shield className='h-4 w-4' />
              <span>{t('privacyPolicy')}</span>
            </Link>
            <Link
              href='/support'
              className='flex items-center space-x-1 text-gray-600 transition-colors hover:text-gray-900'
            >
              <HelpCircle className='h-4 w-4' />
              <span>{t('support')}</span>
            </Link>
          </div>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center space-x-1'
              >
                <Globe className='h-4 w-4' />
                <span className='uppercase'>{language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-blue-50' : ''}
              >
                🇺🇸 English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('fr')}
                className={language === 'fr' ? 'bg-blue-50' : ''}
              >
                🇫🇷 Français
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
