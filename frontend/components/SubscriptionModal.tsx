import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { cn } from '@/utils/cn';
import {
  detectCurrencyFromPriceString,
  extractPriceFromString,
  formatPriceForCountry,
  getCurrencyForCountry,
} from '@/utils/currency';
import { getSquircle, getButtonBorderRadius } from '@/utils/designHelpers';
import * as Sentry from '@sentry/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PurchasesPackage } from 'react-native-purchases';

import PlanCard from '@/components/subscription/PlanCard';
import FeaturesList from '@/components/subscription/FeaturesList';
import { trackSubscriptionPlanSelect, trackSubscriptionPurchase, trackSubscriptionRestore } from '@/services/analytics';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionSuccess?: () => void;
}

type PlanType = 'monthly' | 'quarterly' | 'annual';

export default function SubscriptionModal({
  visible,
  onClose,
  onSubscriptionSuccess,
}: SubscriptionModalProps) {
  const { t, country } = useLanguage();
  const {
    isLoading,
    offerings,
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
    getQuarterlyPackage,
    getAnnualPackage,
    refreshOfferings,
    isTrialEligible,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('quarterly');
  const selectPlan = (plan: PlanType) => { trackSubscriptionPlanSelect(plan); setSelectedPlan(plan); };
  const [purchasing, setPurchasing] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const hasOfferings = offerings && offerings.length > 0;

  useEffect(() => {
    let isMounted = true;
    const loadOfferings = async () => {
      if (visible && !hasOfferings && !isLoading) {
        setIsLoadingOfferings(true);
        try {
          await refreshOfferings();
        } catch (error) {
          Sentry.captureException(error, { tags: { context: 'refresh-offerings' } });
        } finally {
          if (isMounted) setIsLoadingOfferings(false);
        }
      }
    };
    loadOfferings();
    return () => { isMounted = false; };
  }, [visible, hasOfferings, isLoading, refreshOfferings]);

  const monthlyPackage = getMonthlyPackage();
  const quarterlyPackage = getQuarterlyPackage();
  const annualPackage = getAnnualPackage();

  // Price helpers
  const getNumericPrice = (priceString: string): number => extractPriceFromString(priceString) ?? 0;

  const formatPrice = (priceString: string): string => {
    const numericPrice = extractPriceFromString(priceString);
    if (numericPrice === null) return priceString;
    const currentCurrency = detectCurrencyFromPriceString(priceString);
    const targetCurrency = getCurrencyForCountry(country);
    if (currentCurrency === targetCurrency) return formatPriceForCountry(numericPrice, country);
    return priceString;
  };

  const formatNumericPrice = (price: number): string => formatPriceForCountry(price, country);

  const calculateSavings = (actualPrice: number, monthlyRef: number, months: number): number => {
    const wouldBe = monthlyRef * months;
    if (wouldBe === 0) return 0;
    return Math.round(((wouldBe - actualPrice) / wouldBe) * 100);
  };

  const monthlyPrice = monthlyPackage ? getNumericPrice(monthlyPackage.product.priceString) : 0;
  const quarterlyPerMonth = quarterlyPackage ? getNumericPrice(quarterlyPackage.product.priceString) / 3 : 0;
  const annualPerWeek = annualPackage ? getNumericPrice(annualPackage.product.priceString) / 52 : 0;
  const quarterlySavings = quarterlyPackage ? calculateSavings(getNumericPrice(quarterlyPackage.product.priceString), monthlyPrice, 3) : 0;
  const annualSavings = annualPackage ? calculateSavings(getNumericPrice(annualPackage.product.priceString), monthlyPrice, 12) : 0;

  const getSelectedPackage = (): PurchasesPackage | null => {
    switch (selectedPlan) {
      case 'monthly': return monthlyPackage;
      case 'quarterly': return quarterlyPackage;
      case 'annual': return annualPackage;
      default: return null;
    }
  };

  const handlePurchase = async () => {
    const packageToPurchase = getSelectedPackage();
    if (!packageToPurchase) {
      Sentry.captureMessage('No package selected for purchase', 'warning');
      Alert.alert(
        t('subscription.error.title') || 'Error',
        t('subscription.error.noPackage') || 'No subscription package available. Please try again later.'
      );
      return;
    }
    try {
      setPurchasing(true);
      await purchasePackage(packageToPurchase);
      trackSubscriptionPurchase(selectedPlan);
      if (onSubscriptionSuccess) onSubscriptionSuccess();
      onClose();
    } catch (error) {
      const purchaseError = error as { userCancelled?: boolean };
      if (!purchaseError.userCancelled) {
        Sentry.captureException(error, { tags: { context: 'purchase' } });
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      trackSubscriptionRestore();
      const restored = await restorePurchases();
      if (restored && onSubscriptionSuccess) {
        onSubscriptionSuccess();
        onClose();
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { context: 'restore-purchases' } });
    } finally {
      setPurchasing(false);
    }
  };

  // Theme
  const greenPrimary = '#10B981';
  const greenDark = '#059669';
  const greenBg = isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)';

  const features = [
    { icon: 'sparkles' as const, label: t('subscription.features.unlimited.title') || 'Unlimited AI recommendations' },
    { icon: 'funnel' as const, label: t('subscription.features.platforms.title') || 'Smart streaming platform filters' },
    { icon: 'bookmark' as const, label: t('subscription.features.watchlist.title') || 'Personal watchlist with alerts' },
    { icon: 'star' as const, label: t('subscription.features.dailyPick.title') || 'Personalized daily picks' },
    { icon: 'time' as const, label: t('subscription.features.history.title') || 'Search history & taste profile' },
  ];

  // Loading state
  if (isLoading || isLoadingOfferings) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className='flex-1 items-center justify-center bg-black/50'>
            <View style={getSquircle(18)} className='bg-light-background p-8 dark:bg-dark-surface'>
              <ActivityIndicator size='large' color={greenPrimary} />
              <Text className='mt-4 text-center text-sm text-light-muted dark:text-dark-muted'>
                {t('subscription.loading') || 'Loading subscription options...'}
              </Text>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    );
  }

  // Error state
  if (!hasOfferings) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className='flex-1 items-center justify-center bg-black/50'>
            <View style={getSquircle(18)} className='bg-light-background p-8 dark:bg-dark-surface'>
              <Ionicons name='cloud-offline-outline' size={48} color={greenPrimary} />
              <Text className='mt-4 text-center text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('subscription.error.loadFailed') || 'Unable to load plans'}
              </Text>
              <Text className='mt-2 text-center text-sm text-light-muted dark:text-dark-muted'>
                {t('subscription.error.tryAgain') || 'Please check your connection and try again'}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  setIsLoadingOfferings(true);
                  try { await refreshOfferings(); } finally { setIsLoadingOfferings(false); }
                }}
                style={[getButtonBorderRadius(), { backgroundColor: greenPrimary }]}
                className='mt-6 px-8 py-3'
                accessibilityLabel='Retry loading plans'
                accessibilityRole='button'
              >
                <Text className='text-center text-base font-semibold text-white'>
                  {t('common.retry') || 'Retry'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} className='mt-4 py-2' accessibilityLabel='Close' accessibilityRole='button'>
                <Text className='text-center text-sm text-light-muted dark:text-dark-muted'>
                  {t('common.close') || 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType='slide' presentationStyle='pageSheet'>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className='flex-1 bg-light-background dark:bg-dark-background'>
          {/* Close button */}
          <View className='absolute right-4 top-4 z-10'>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel='Close subscription modal'
              accessibilityRole='button'
              className='h-8 w-8 items-center justify-center rounded-full'
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }}
            >
              <Ionicons name='close' size={18} color={isDark ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>

          <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 500 }}>
              <LinearGradient
                colors={isDark ? ['#064E3B', '#065F46', '#141414'] : ['#D1FAE5', '#A7F3D0', '#FFFFFF']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                className='items-center px-6 pb-8 pt-14'
              >
                <MotiView
                  from={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', delay: 200 }}
                  className='mb-4 h-20 w-20 items-center justify-center rounded-full'
                  style={{ backgroundColor: greenBg }}
                >
                  <Ionicons name='diamond' size={40} color={greenPrimary} />
                </MotiView>

                {isTrialEligible && (
                  <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 300 }} className='mb-3'>
                    <View className='self-center rounded-full px-5 py-1.5' style={{ backgroundColor: greenPrimary }}>
                      <Text className='text-sm font-bold text-white'>
                        {t('subscription.trialBadge') || '7 DAYS FREE'}
                      </Text>
                    </View>
                  </MotiView>
                )}

                <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 350 }}>
                  <Text className='mb-2 text-center text-2xl font-bold text-light-text dark:text-dark-text'>
                    {isTrialEligible
                      ? t('subscription.hero.title') || 'Try FastFlix Pro free for 7 days'
                      : t('subscription.hero.titleNoTrial') || 'Unlock FastFlix Pro'}
                  </Text>
                  <Text className='text-center text-base text-light-muted dark:text-dark-muted'>
                    {isTrialEligible
                      ? t('subscription.hero.subtitle') || 'Unlimited recommendations, then choose your plan'
                      : t('subscription.hero.subtitleNoTrial') || 'Get unlimited recommendations with Pro'}
                  </Text>
                </MotiView>
              </LinearGradient>
            </MotiView>

            {/* Features */}
            <FeaturesList features={features} greenPrimary={greenPrimary} greenBg={greenBg} />

            {/* Social Proof */}
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 800 }}
              className='mx-6 mb-6 items-center rounded-2xl py-4'
              style={{ backgroundColor: greenBg }}
            >
              <View className='mb-1 flex-row items-center'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name='star' size={16} color='#FBBF24' style={{ marginHorizontal: 1 }} />
                ))}
              </View>
              <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
                {t('subscription.socialProof') || 'Join 10,000+ movie lovers'}
              </Text>
              <Text className='text-xs text-light-muted dark:text-dark-muted'>
                {t('subscription.socialProofSub') || 'Rated 4.9 stars by our community'}
              </Text>
            </MotiView>

            {/* Plans */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 900 }}
              className='mb-6 px-6'
            >
              <Text className='mb-4 text-center text-lg font-semibold text-light-text dark:text-dark-text'>
                {t('subscription.plans.title') || 'Choose Your Plan'}
              </Text>

              {monthlyPackage && (
                <PlanCard
                  title={t('subscription.monthly.title') || 'Monthly'}
                  description={t('subscription.monthly.description') || 'Flexible monthly billing'}
                  price={formatPrice(monthlyPackage.product.priceString)}
                  period={t('subscription.monthly.period') || '/month'}
                  selected={selectedPlan === 'monthly'}
                  onPress={() => selectPlan('monthly')}
                  greenPrimary={greenPrimary}
                  greenDark={greenDark}
                  greenBg={greenBg}
                />
              )}

              {quarterlyPackage && (
                <PlanCard
                  title={t('subscription.quarterly.title') || '3 Months'}
                  price={formatPrice(quarterlyPackage.product.priceString)}
                  period={t('subscription.quarterly.period') || '/3 months'}
                  perUnitLabel={`${formatNumericPrice(quarterlyPerMonth)}${t('subscription.perMonth') || '/mo'}`}
                  comparisonPrice={quarterlySavings > 0 ? formatNumericPrice(monthlyPrice * 3) : undefined}
                  savingsPercent={quarterlySavings > 0 ? quarterlySavings : undefined}
                  badgeLabel={t('subscription.popular') || 'POPULAR'}
                  badgeVariant='outline'
                  selected={selectedPlan === 'quarterly'}
                  onPress={() => selectPlan('quarterly')}
                  greenPrimary={greenPrimary}
                  greenDark={greenDark}
                  greenBg={greenBg}
                />
              )}

              {annualPackage && (
                <PlanCard
                  title={t('subscription.annual.title') || 'Annual'}
                  price={formatPrice(annualPackage.product.priceString)}
                  period={t('subscription.annual.period') || '/year'}
                  perUnitLabel={`${t('subscription.annual.just') || 'Just'} ${formatNumericPrice(annualPerWeek)}${t('subscription.annual.perWeek') || '/week'}`}
                  comparisonPrice={annualSavings > 0 ? formatNumericPrice(monthlyPrice * 12) : undefined}
                  savingsPercent={annualSavings > 0 ? annualSavings : undefined}
                  badgeLabel={t('subscription.bestValue') || 'BEST VALUE'}
                  badgeVariant='filled'
                  selected={selectedPlan === 'annual'}
                  onPress={() => selectPlan('annual')}
                  greenPrimary={greenPrimary}
                  greenDark={greenDark}
                  greenBg={greenBg}
                />
              )}
            </MotiView>
          </ScrollView>

          {/* Bottom Actions */}
          <View
            className='border-t border-light-border px-6 pb-6 pt-4 dark:border-dark-border'
            style={{ backgroundColor: isDark ? '#141414' : '#FFFFFF' }}
          >
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 1000 }}>
              <TouchableOpacity
                onPress={handlePurchase}
                disabled={purchasing || !getSelectedPackage()}
                accessibilityLabel={isTrialEligible ? 'Start free 7-day trial' : 'Subscribe now'}
                accessibilityRole='button'
                style={[
                  getButtonBorderRadius(),
                  { backgroundColor: greenPrimary, shadowColor: greenPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
                ]}
                className={cn('mb-2 py-4', (purchasing || !getSelectedPackage()) && 'opacity-50')}
              >
                {purchasing ? (
                  <ActivityIndicator color='white' />
                ) : (
                  <Text className='text-center text-lg font-bold text-white'>
                    {isTrialEligible
                      ? t('subscription.startTrial') || 'Start Free 7-Day Trial'
                      : t('subscription.subscribe') || 'Subscribe Now'}
                  </Text>
                )}
              </TouchableOpacity>

              <Text className='mb-3 text-center text-xs text-light-muted dark:text-dark-muted'>
                {isTrialEligible
                  ? t('subscription.trialReassurance') || 'No charge until trial ends. Cancel anytime.'
                  : t('subscription.cancelAnytime') || 'Cancel anytime'}
              </Text>
            </MotiView>

            <TouchableOpacity onPress={handleRestore} disabled={purchasing} className='py-2' accessibilityLabel='Restore purchases' accessibilityRole='button'>
              <Text className='text-center text-sm font-medium' style={{ color: greenPrimary }}>
                {t('subscription.restore') || 'Restore Purchases'}
              </Text>
            </TouchableOpacity>

            <View className='mt-3'>
              <Text className='mb-2 text-center text-xs text-light-muted dark:text-dark-muted'>
                {t('subscription.terms') || 'Subscription automatically renews unless cancelled. Terms and conditions apply.'}
              </Text>
              <View className='flex-row justify-center gap-6'>
                <TouchableOpacity onPress={() => Linking.openURL('https://fastflix-website.vercel.app/privacy-policy')} accessibilityRole='link'>
                  <Text className='text-xs text-light-muted underline dark:text-dark-muted'>
                    {t('profile.privacyPolicy') || 'Privacy Policy'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL('https://fastflix-website.vercel.app/terms-of-use')} accessibilityRole='link'>
                  <Text className='text-xs text-light-muted underline dark:text-dark-muted'>
                    {t('profile.termsOfUse') || 'Terms of Use'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
