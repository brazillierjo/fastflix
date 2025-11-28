import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { AVAILABLE_LANGUAGES } from '../constants/languages';
import { cn } from '../utils/cn';

interface LanguageSelectorProps {
  style?: ViewStyle;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  style,
}) => {
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  const getLanguageFlag = (lang: string) => {
    const language = AVAILABLE_LANGUAGES.find(l => l.code === lang);
    return language?.flag || '🌐';
  };

  return (
    <View className={cn('relative w-full', style)}>
      <Text className='text-center text-lg font-medium text-light-primary dark:text-dark-primary'>
        {t('settings.language')}
      </Text>

      <Picker
        selectedValue={language}
        onValueChange={itemValue =>
          setLanguage(itemValue as 'fr' | 'en' | 'ja')
        }
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
