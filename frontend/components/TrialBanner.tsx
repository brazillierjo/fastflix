import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { getSquircle } from '@/utils/designHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface TrialBannerProps {
  onSubscribe: () => void;
}

const BANNER_DISMISSED_PREFIX = '@fastflix/trial_banner_dismissed_';

export default function TrialBanner({ onSubscribe }: TrialBannerProps) {
  const { t } = useLanguage();
  const { customerInfo } = useSubscription();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [dismissed, setDismissed] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  // Determine trial day from customerInfo
  const trialDay = useMemo(() => {
    if (!customerInfo) return null;
    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    const trialEntitlement = activeEntitlements.find(
      e => e.periodType === 'TRIAL'
    );
    if (!trialEntitlement?.latestPurchaseDate) return null;

    const purchaseDate = new Date(trialEntitlement.latestPurchaseDate);
    const now = new Date();
    const diffMs = now.getTime() - purchaseDate.getTime();
    const daysSinceStart = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    // Day 1 is the first day
    return Math.min(7, Math.max(1, daysSinceStart + 1));
  }, [customerInfo]);

  // Check if banner was dismissed today
  useEffect(() => {
    if (trialDay === null) {
      setCheckedStorage(true);
      return;
    }
    let cancelled = false;
    const today = new Date().toISOString().split('T')[0];
    const key = `${BANNER_DISMISSED_PREFIX}${today}`;
    AsyncStorage.getItem(key).then(value => {
      if (cancelled) return;
      if (value === 'true') {
        setDismissed(true);
      }
      setCheckedStorage(true);
    });
    return () => {
      cancelled = true;
    };
  }, [trialDay]);

  if (!checkedStorage || trialDay === null || dismissed) {
    return null;
  }

  const handleDismiss = async () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${BANNER_DISMISSED_PREFIX}${today}`;
    await AsyncStorage.setItem(key, 'true');
    setDismissed(true);
  };

  // Determine message, icon, and colors based on trial day
  let message: string;
  let iconName: keyof typeof Ionicons.glyphMap;
  let bgColor: string;
  let textColor: string;
  let iconColor: string;
  let showCta = false;

  const remaining = 7 - trialDay;

  if (trialDay <= 2) {
    message = (t('trial.banner.day1') || 'Welcome! Day {{day}} of your free trial').replace('{{day}}', String(trialDay));
    iconName = 'sparkles';
    bgColor = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';
    textColor = isDark ? '#6EE7B7' : '#065F46';
    iconColor = '#10B981';
  } else if (trialDay <= 4) {
    message = (t('trial.banner.day3') || "Day {{day}} - You're exploring great content!").replace('{{day}}', String(trialDay));
    iconName = 'heart';
    bgColor = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';
    textColor = isDark ? '#6EE7B7' : '#065F46';
    iconColor = '#10B981';
  } else if (trialDay === 5) {
    message = (t('trial.banner.day5') || 'Only {{remaining}} days left in your trial').replace('{{remaining}}', String(remaining));
    iconName = 'time';
    bgColor = isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)';
    textColor = isDark ? '#FCD34D' : '#92400E';
    iconColor = '#F59E0B';
  } else if (trialDay === 6) {
    message = t('trial.banner.day6') || 'Your trial ends tomorrow!';
    iconName = 'warning';
    bgColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
    textColor = isDark ? '#FCA5A5' : '#991B1B';
    iconColor = '#EF4444';
  } else {
    // Day 7
    message = t('trial.banner.day7') || 'Your trial ends today';
    iconName = 'warning';
    bgColor = isDark ? 'rgba(229, 9, 20, 0.2)' : 'rgba(229, 9, 20, 0.1)';
    textColor = isDark ? '#FCA5A5' : '#991B1B';
    iconColor = '#E50914';
    showCta = true;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      className='mt-4 px-6'
    >
      <View
        style={[getSquircle(12), { backgroundColor: bgColor }]}
        className='flex-row items-center px-3 py-3'
      >
        <Ionicons name={iconName} size={18} color={iconColor} />
        <Text
          className='ml-2 flex-1 text-sm font-medium'
          style={{ color: textColor }}
          numberOfLines={2}
        >
          {message}
        </Text>
        {showCta && (
          <TouchableOpacity
            onPress={onSubscribe}
            style={[getSquircle(8), { backgroundColor: '#E50914' }]}
            className='ml-2 px-3 py-1.5'
          >
            <Text className='text-xs font-bold text-white'>
              {t('trial.banner.subscribe') || 'Subscribe Now'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleDismiss}
          className='ml-2 p-1'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name='close'
            size={16}
            color={isDark ? '#a3a3a3' : '#737373'}
          />
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
