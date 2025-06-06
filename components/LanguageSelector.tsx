import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../utils/cn';

interface LanguageSelectorProps {
  style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  style,
}) => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleLanguageSelect = (lang: 'fr' | 'en') => {
    setLanguage(lang);
    setIsModalVisible(false);
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'fr':
        return '🇫🇷';
      case 'en':
        return '🇺🇸';
      default:
        return '🌐';
    }
  };

  return (
    <View className={cn('relative', style)}>
      <TouchableOpacity
        className='min-w-30 flex-row items-center rounded-xl border border-neutral-300 bg-light-background px-3 py-2 dark:border-neutral-600 dark:bg-dark-surface'
        onPress={() => setIsModalVisible(true)}
      >
        <Text className='mr-2 text-base'>{getLanguageFlag(language)}</Text>
        <Text className='text-light-text dark:text-dark-text flex-1 text-sm font-medium'>
          {t(`languages.${language}`)}
        </Text>
        <Text className='ml-1 text-xs text-neutral-400 dark:text-neutral-500'>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          className='flex-1 items-center justify-center bg-black/50'
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View className='min-w-50 max-w-75 rounded-2xl bg-light-background p-5 shadow-lg dark:bg-dark-surface'>
            <Text className='text-light-text dark:text-dark-text mb-4 text-center text-lg font-semibold'>
              {t('settings.language')}
            </Text>

            {availableLanguages.map(lang => (
              <TouchableOpacity
                key={lang}
                className={cn(
                  'my-0.5 flex-row items-center rounded-lg px-2 py-3',
                  language === lang &&
                    'bg-light-primary/10 dark:bg-dark-primary/10'
                )}
                onPress={() => handleLanguageSelect(lang)}
              >
                <Text className='mr-3 text-lg'>{getLanguageFlag(lang)}</Text>
                <Text
                  className={cn(
                    'text-light-text dark:text-dark-text flex-1 text-base',
                    language === lang &&
                      'font-semibold text-light-primary dark:text-dark-primary'
                  )}
                >
                  {t(`languages.${lang}`)}
                </Text>
                {language === lang && (
                  <Text className='text-base font-bold text-light-primary dark:text-dark-primary'>
                    ✓
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
