import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAppVersion } from '@/utils/appVersion';
import React from 'react';
import {
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const links = [
    {
      icon: 'shield-checkmark' as const,
      title: t('profile.privacyPolicy') || 'Privacy Policy',
      url: 'https://fastflix-website.vercel.app/privacy-policy',
    },
    {
      icon: 'document-text' as const,
      title: t('profile.termsOfUse') || 'Terms of Use',
      url: 'https://fastflix-website.vercel.app/terms',
    },
    {
      icon: 'help-circle' as const,
      title: t('profile.support') || 'Support Center',
      url: 'https://fastflix-website.vercel.app/support',
    },
    {
      icon: 'globe' as const,
      title: t('profile.website') || 'Website',
      url: 'https://fastflix-website.vercel.app',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border">
          <View className="w-20" />
          <Text className="text-lg font-semibold text-light-text dark:text-dark-text">
            {t('profile.aboutApp') || 'About'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="min-w-[80px] items-center justify-center rounded-full bg-netflix-500 px-4 py-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-base font-semibold text-white">
              {t('common.done') || 'Done'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 px-4 pt-6">
          {/* App Info */}
          <View className="items-center mb-8">
            <View className="h-20 w-20 rounded-2xl bg-netflix-500 items-center justify-center mb-3">
              <Ionicons name="film" size={40} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-light-text dark:text-dark-text">
              FastFlix
            </Text>
            <Text className="text-base text-light-muted dark:text-dark-muted mt-1">
              {t('profile.version') || 'Version'} {getAppVersion()}
            </Text>
          </View>

          {/* Links */}
          <View className="rounded-xl bg-light-card dark:bg-dark-card overflow-hidden">
            {links.map((link, index) => (
              <View key={link.url}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(link.url)}
                  className="flex-row items-center px-4 py-3"
                >
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background">
                    <Ionicons
                      name={link.icon}
                      size={18}
                      color={isDark ? '#ffffff' : '#0f172a'}
                    />
                  </View>
                  <Text className="flex-1 text-base text-light-text dark:text-dark-text">
                    {link.title}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={18}
                    color={isDark ? '#6b7280' : '#9ca3af'}
                  />
                </TouchableOpacity>
                {index < links.length - 1 && (
                  <View className="ml-16 h-px bg-light-border dark:bg-dark-border" />
                )}
              </View>
            ))}
          </View>

          {/* Footer */}
          <Text className="mt-8 text-center text-sm text-light-muted dark:text-dark-muted">
            Made with ❤️ for movie lovers
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
