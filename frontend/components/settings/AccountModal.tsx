import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AccountModal({ visible, onClose }: AccountModalProps) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!user) return null;

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
            {t('profile.account') || 'Account'}
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
          {/* User Avatar */}
          <View className="items-center mb-8">
            <View className="h-20 w-20 rounded-full bg-netflix-500 items-center justify-center mb-3">
              <Text className="text-3xl font-bold text-white">
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            {user.name && (
              <Text className="text-xl font-semibold text-light-text dark:text-dark-text">
                {user.name}
              </Text>
            )}
          </View>

          {/* Account Info */}
          <View className="rounded-xl bg-light-card dark:bg-dark-card overflow-hidden">
            {/* Email */}
            <View className="flex-row items-center px-4 py-3">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background">
                <Ionicons
                  name="mail"
                  size={18}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-light-muted dark:text-dark-muted">
                  {t('profile.email') || 'Email'}
                </Text>
                <Text className="text-base text-light-text dark:text-dark-text" numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </View>

            <View className="ml-16 h-px bg-light-border dark:bg-dark-border" />

            {/* Sign-in Method */}
            <View className="flex-row items-center px-4 py-3">
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background">
                <Ionicons
                  name={user.auth_provider === 'apple' ? 'logo-apple' : 'logo-google'}
                  size={18}
                  color={isDark ? '#ffffff' : '#0f172a'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-light-muted dark:text-dark-muted">
                  {t('profile.signInMethod') || 'Sign-in Method'}
                </Text>
                <Text className="text-base text-light-text dark:text-dark-text">
                  {user.auth_provider === 'apple' ? 'Apple' : 'Google'}
                </Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="mt-8 rounded-xl bg-light-card dark:bg-dark-card px-4 py-3"
          >
            <Text className="text-center text-base font-medium text-red-500">
              {t('profile.signOut') || 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
