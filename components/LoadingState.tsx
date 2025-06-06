import { useLanguage } from '@/contexts/LanguageContext';
import { MotiView } from 'moti';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingStateProps {
  isSearching: boolean;
}

export default function LoadingState({ isSearching }: LoadingStateProps) {
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isSearching ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'timing',
            duration: 600,
          }}
          style={{
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size='large' color='#000' />
          <Text
            style={{
              fontSize: 16,
              color: '#666',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
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
          style={{
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size='large' color='#000' />
          <Text
            style={{
              fontSize: 16,
              color: '#666',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            {t('welcome.generating')}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
