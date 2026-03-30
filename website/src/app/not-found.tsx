import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className='flex min-h-[80vh] flex-col items-center justify-center px-4'>
      <Image
        src='/logo.png'
        alt='FastFlix'
        width={64}
        height={64}
        className='mb-8 rounded-[14px] shadow-lg'
      />
      <h1 className='text-6xl font-bold text-gray-900 dark:text-white'>404</h1>
      <p className='mt-4 text-xl text-gray-600 dark:text-gray-400'>
        This page doesn&apos;t exist.
      </p>
      <Link
        href='/'
        className='from-netflix to-netflix-dark mt-8 rounded-xl bg-gradient-to-r px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90'
      >
        Back to Home
      </Link>
    </div>
  );
}
