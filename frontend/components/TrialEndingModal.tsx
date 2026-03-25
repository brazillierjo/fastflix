import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSquircle, getButtonBorderRadius } from '@/utils/designHelpers';
import { MotiView } from 'moti';
import React from 'react';
import { Modal, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface TrialEndingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  trialDay: number;
}

export default function TrialEndingModal({
  visible,
  onClose,
  onSubscribe,
  trialDay,
}: TrialEndingModalProps) {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isDay7 = trialDay >= 7;
  const isDay6 = trialDay === 6;

  // Icon based on day
  const iconName: keyof typeof Ionicons.glyphMap =
    trialDay === 5 ? 'hourglass' : 'alarm';
  const iconColor = trialDay === 5 ? '#F59E0B' : '#EF4444';
  const iconBg =
    trialDay === 5
      ? isDark
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(245, 158, 11, 0.1)'
      : isDark
        ? 'rgba(239, 68, 68, 0.15)'
        : 'rgba(239, 68, 68, 0.1)';

  // Title based on day
  const title = isDay7
    ? t('trial.endingModal.title7') || 'Your trial ends today'
    : isDay6
      ? t('trial.endingModal.title6') || 'Last chance to subscribe!'
      : t('trial.endingModal.title5') || 'Your trial is ending soon';

  const features = [
    {
      icon: 'sparkles' as const,
      label:
        t('trial.endingModal.feature1') || 'Unlimited AI recommendations',
    },
    {
      icon: 'bookmark' as const,
      label: t('trial.endingModal.feature2') || 'Personal watchlist',
    },
    {
      icon: 'star' as const,
      label: t('trial.endingModal.feature3') || 'Personalized daily picks',
    },
  ];

  const greenPrimary = '#10B981';

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View className='flex-1 items-center justify-center bg-black/50 px-6'>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={getSquircle(20)}
          className='w-full max-w-sm bg-light-background p-6 dark:bg-dark-surface'
        >
          {/* Icon */}
          <View className='mb-4 items-center'>
            <View
              className='h-16 w-16 items-center justify-center rounded-full'
              style={{ backgroundColor: iconBg }}
            >
              <Ionicons name={iconName} size={32} color={iconColor} />
            </View>
          </View>

          {/* Title */}
          <Text className='mb-2 text-center text-xl font-bold text-light-text dark:text-dark-text'>
            {title}
          </Text>

          {/* Subtitle */}
          <Text className='mb-4 text-center text-sm text-light-muted dark:text-dark-muted'>
            {t('trial.endingModal.subtitle') || "Don't lose access to:"}
          </Text>

          {/* Features list */}
          <View className='mb-6'>
            {features.map((feature, index) => (
              <View key={index} className='mb-2 flex-row items-center'>
                <Ionicons
                  name={feature.icon}
                  size={18}
                  color={greenPrimary}
                />
                <Text className='ml-3 flex-1 text-sm text-light-text dark:text-dark-text'>
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onSubscribe();
            }}
            style={[
              getButtonBorderRadius(),
              {
                backgroundColor: greenPrimary,
                shadowColor: greenPrimary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
            className='mb-3 py-3.5'
          >
            <Text className='text-center text-base font-bold text-white'>
              {t('trial.banner.subscribe') || 'Subscribe Now'}
            </Text>
          </TouchableOpacity>

          {/* Secondary button */}
          <TouchableOpacity onPress={onClose} className='py-2'>
            <Text className='text-center text-sm text-light-muted dark:text-dark-muted'>
              {isDay7
                ? t('trial.endingModal.understand') || 'I understand'
                : t('trial.endingModal.remindLater') || 'Remind me later'}
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}
