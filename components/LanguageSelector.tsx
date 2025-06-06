import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Text, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../utils/cn';

interface LanguageSelectorProps {
  style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  style,
}) => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();

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
    <View className={cn('relative w-full', style)}>
      <Text className='text-center text-lg font-medium text-black dark:text-white'>
        {t('settings.language')}
      </Text>

      <Picker
        selectedValue={language}
        onValueChange={itemValue => setLanguage(itemValue as 'fr' | 'en')}
      >
        {availableLanguages.map(lang => (
          <Picker.Item
            key={lang}
            label={`${getLanguageFlag(lang)} ${t(`languages.${lang}`)}`}
            value={lang}
          />
        ))}
      </Picker>
    </View>
  );
};
