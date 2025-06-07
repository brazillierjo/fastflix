import { Link, Stack } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFoundScreen() {
  const { language, t } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className='flex-1 bg-light-background dark:bg-dark-background'>
        {/* Background decoration */}
        <View className='absolute inset-0 opacity-5'>
          <View className='absolute left-10 top-20 h-32 w-32 rounded-full bg-primary-300' />
          <View className='absolute right-16 top-40 h-24 w-24 rounded-full bg-primary-200' />
          <View className='absolute bottom-32 left-20 h-20 w-20 rounded-full bg-primary-400' />
          <View className='absolute bottom-20 right-8 h-16 w-16 rounded-full bg-primary-300' />
        </View>

        {/* Main content */}
        <View className='flex-1 items-center justify-center px-8'>
          {/* Animated movie icon */}
          <MotiView
            from={{ scale: 0, rotate: '0deg' }}
            animate={{ scale: 1, rotate: '360deg' }}
            transition={{
              type: 'spring',
              duration: 1000,
              delay: 200,
            }}
            className='mb-8'
          >
            <View className='h-24 w-24 items-center justify-center rounded-full bg-primary-500 shadow-lg'>
              <Text className='text-4xl'>🎬</Text>
            </View>
          </MotiView>

          {/* Error code */}
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400 }}
            className='mb-4 text-6xl font-bold text-primary-500'
          >
            404
          </MotiText>

          {/* Title */}
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600 }}
            className='mb-4 text-center text-2xl font-bold text-light-text dark:text-dark-text'
          >
            {t('notFound.title')}
          </MotiText>

          {/* Subtitle */}
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 800 }}
            className='text-light-text-secondary dark:text-dark-text-secondary mb-8 text-center text-base leading-6'
          >
            {t('notFound.subtitle')}
          </MotiText>

          {/* Action button */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1000, type: 'spring' }}
          >
            <Link href='/' asChild>
              <TouchableOpacity className='rounded-xl bg-primary-500 px-8 py-4 shadow-lg hover:bg-primary-600 active:bg-primary-700'>
                <View className='flex-row items-center'>
                  <Text className='mr-2 text-lg font-semibold text-white'>
                    {t('notFound.backButton')}
                  </Text>
                  <Text className='text-xl'>🏠</Text>
                </View>
              </TouchableOpacity>
            </Link>
          </MotiView>

          {/* Fun message */}
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1200 }}
            className='text-light-text-secondary dark:text-dark-text-secondary mt-8 text-center text-sm italic'
          >
            {t('notFound.funMessage')}
          </MotiText>
        </View>
      </View>
    </>
  );
}
