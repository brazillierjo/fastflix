import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FastFlix - Pages Légales',
  description: "Pages légales pour l&apos;application FastFlix",
};

export default function Home() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='mx-auto max-w-2xl text-center'>
        <div className='rounded-2xl bg-white p-8 shadow-xl md:p-12'>
          <h1 className='mb-4 text-4xl font-bold text-gray-900 md:text-5xl'>
            FastFlix
          </h1>
          <p className='mb-8 text-xl text-gray-600'>
            Pages légales et assistance
          </p>

          <div className='space-y-4'>
            <Link
              href='/privacy-policy'
              className='block w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 hover:shadow-lg'
            >
              📋 Politique de Confidentialité
            </Link>

            <Link
              href='/support'
              className='block w-full rounded-lg bg-green-600 px-6 py-4 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-green-700 hover:shadow-lg'
            >
              🆘 Centre d&apos;Assistance
            </Link>
          </div>

          <div className='mt-8 border-t border-gray-200 pt-8'>
            <p className='text-sm text-gray-500'>
              Ces pages sont requises pour la publication sur l&apos;App Store
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
