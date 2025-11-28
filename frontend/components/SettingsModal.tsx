import React from 'react';
import {
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../utils/cn';
import { LanguageSelector } from './LanguageSelector';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isVisible,
  onClose,
}) => {
  const { t } = useLanguage();

  return (
    <Modal
      visible={isVisible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView
        className={cn('flex-1 bg-light-surface dark:bg-dark-surface')}
      >
        <View
          className={cn(
            'flex-row items-center justify-between border-b border-light-border px-6 py-4 dark:border-dark-border'
          )}
        >
          <Text
            className={cn(
              'text-xl font-semibold text-light-primary dark:text-dark-primary'
            )}
          >
            {t('modal.title')}
          </Text>

          <TouchableOpacity onPress={onClose} className={cn('p-2')}>
            <Text
              className={cn(
                'text-2xl text-light-primary dark:text-dark-primary'
              )}
            >
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <View className={cn('flex-1 px-6 py-8')}>
          <LanguageSelector />
        </View>
      </SafeAreaView>
    </Modal>
  );
};
