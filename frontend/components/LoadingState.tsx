import { useLanguage } from '@/contexts/LanguageContext';
import { getNetflixRed } from '@/utils/designHelpers';
import { MotiView } from 'moti';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingStateProps {
  isSearching: boolean;
}

export default function LoadingState({ isSearching }: LoadingStateProps) {
  const { t } = useLanguage();

  return (
    <View className='flex-1 items-center justify-center bg-light-background dark:bg-dark-background'>
      {isSearching ? (
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          className='items-center'
        >
          <ActivityIndicator size='large' color={getNetflixRed()} />
          <Text className='mt-6 text-center text-lg font-medium text-light-text dark:text-dark-text'>
            {t('welcome.searching')}
          </Text>
          <Text className='mt-2 text-center text-sm text-light-textMuted dark:text-dark-textMuted'>
            {t('welcome.pleaseWait') || 'Veuillez patienter...'}
          </Text>
        </MotiView>
      ) : (
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          className='items-center'
        >
          <ActivityIndicator size='large' color={getNetflixRed()} />
          <Text className='mt-6 text-center text-lg font-medium text-light-text dark:text-dark-text'>
            {t('welcome.generating')}
          </Text>
          <Text className='mt-2 text-center text-sm text-light-textMuted dark:text-dark-textMuted'>
            {t('welcome.pleaseWait') || 'Veuillez patienter...'}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
