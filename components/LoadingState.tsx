import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import { MotiView } from 'moti';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingStateProps {
  isSearching: boolean;
}

export default function LoadingState({ isSearching }: LoadingStateProps) {
  const { t } = useLanguage();

  return (
    <View className='flex-1 items-center justify-center'>
      {isSearching ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          className='items-center'
        >
          <ActivityIndicator
            size='large'
            color='#000'
            className='text-light-primary dark:text-dark-primary'
          />
          <Text className='mt-4 text-center text-base text-neutral-500 dark:text-neutral-400'>
            {t('welcome.searching')}
          </Text>
        </MotiView>
      ) : (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          className='items-center'
        >
          <ActivityIndicator
            size='large'
            color='#000'
            className='text-light-primary dark:text-dark-primary'
          />
          <Text className='mt-4 text-center text-base text-neutral-500 dark:text-neutral-400'>
            {t('welcome.generating')}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
