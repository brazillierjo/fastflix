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
  const [purchasing, setPurchasing] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Check if offerings are available
  const hasOfferings = offerings && offerings.length > 0;

  // Refresh offerings when modal opens if they're not loaded
  useEffect(() => {
    let isMounted = true;

    const loadOfferings = async () => {
      if (visible && !hasOfferings && !isLoading) {
        setIsLoadingOfferings(true);
        try {
          await refreshOfferings();
        } catch (error) {
          Sentry.captureException(error, {
            tags: { context: 'refresh-offerings' },
          });
        } finally {
          if (isMounted) {
            setIsLoadingOfferings(false);
          }
        }
      }
    };

    loadOfferings();

    return () => {
      isMounted = false;
    };
  }, [visible, hasOfferings, isLoading, refreshOfferings]);

  const monthlyPackage = getMonthlyPackage();
  const quarterlyPackage = getQuarterlyPackage();
  const annualPackage = getAnnualPackage();

  // Extract numeric price from RevenueCat price string
  const getNumericPrice = (priceString: string): number => {
    const price = extractPriceFromString(priceString);
    return price ?? 0;
  };

  // Format price according to user's country currency
  const formatPrice = (priceString: string): string => {
    const numericPrice = extractPriceFromString(priceString);

    if (numericPrice === null) {
      return priceString;
    }

    const currentCurrency = detectCurrencyFromPriceString(priceString);
    const targetCurrency = getCurrencyForCountry(country);

    if (currentCurrency === targetCurrency) {
      return formatPriceForCountry(numericPrice, country);
    }

    return priceString;
  };

  // Format a numeric price
  const formatNumericPrice = (price: number): string => {
    return formatPriceForCountry(price, country);
  };

  // Calculate savings percentage
  const calculateSavings = (
    actualPrice: number,
    comparedToMonthlyPrice: number,
    months: number
  ): number => {
    const wouldBe = comparedToMonthlyPrice * months;
    if (wouldBe === 0) return 0;
    return Math.round(((wouldBe - actualPrice) / wouldBe) * 100);
  };

  // Get monthly price for comparison
  const monthlyPrice = monthlyPackage
    ? getNumericPrice(monthlyPackage.product.priceString)
    : 0;

  // Calculate comparison prices
  const quarterlyComparisonPrice = monthlyPrice * 3;
  const annualComparisonPrice = monthlyPrice * 12;

  // Calculate per-month prices for discounted plans
  const quarterlyPerMonth = quarterlyPackage
    ? getNumericPrice(quarterlyPackage.product.priceString) / 3
    : 0;
  const annualPerWeek = annualPackage
    ? getNumericPrice(annualPackage.product.priceString) / 52
    : 0;

  // Calculate savings
  const quarterlySavings = quarterlyPackage
    ? calculateSavings(
        getNumericPrice(quarterlyPackage.product.priceString),
        monthlyPrice,
        3
      )
    : 0;

  const annualSavings = annualPackage
    ? calculateSavings(
        getNumericPrice(annualPackage.product.priceString),
        monthlyPrice,
        12
      )
    : 0;

  const getSelectedPackage = (): PurchasesPackage | null => {
    switch (selectedPlan) {
      case 'monthly':
        return monthlyPackage;
      case 'quarterly':
        return quarterlyPackage;
      case 'annual':
        return annualPackage;
      default:
        return null;
    }
  };

  const handlePurchase = async () => {
    const packageToPurchase = getSelectedPackage();

    if (!packageToPurchase) {
      Sentry.captureMessage('No package selected for purchase', 'warning');
      Alert.alert(
        t('subscription.error.title') || 'Error',
        t('subscription.error.noPackage') ||
          'No subscription package available. Please try again later.'
      );
      return;
    }

    try {
      setPurchasing(true);
      await purchasePackage(packageToPurchase);

      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }

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
      const restored = await restorePurchases();

      if (restored && onSubscriptionSuccess) {
        onSubscriptionSuccess();
        onClose();
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { context: 'restore-purchases' },
      });
    } finally {
      setPurchasing(false);
    }
  };

  // Green color scheme
  const greenPrimary = '#10B981'; // emerald-500
  const greenDark = '#059669'; // emerald-600
  const greenBg = isDark
    ? 'rgba(16, 185, 129, 0.15)'
    : 'rgba(16, 185, 129, 0.1)';

  // Features list
  const features = [
    {
      icon: 'sparkles' as const,
      label:
        t('subscription.features.unlimited.title') ||
        'Unlimited AI recommendations',
    },
    {
      icon: 'funnel' as const,
      label:
        t('subscription.features.platforms.title') ||
        'Smart streaming platform filters',
    },
    {
      icon: 'bookmark' as const,
      label:
        t('subscription.features.watchlist.title') ||
        'Personal watchlist with alerts',
    },
    {
      icon: 'star' as const,
      label:
        t('subscription.features.dailyPick.title') || 'Personalized daily picks',
    },
    {
      icon: 'time' as const,
      label:
        t('subscription.features.history.title') || 'Search history & taste profile',
    },
  ];

  // Show loading state when RevenueCat is initializing or offerings are being fetched
  if (isLoading || isLoadingOfferings) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className='flex-1 items-center justify-center bg-black/50'>
            <View
              style={getSquircle(18)}
              className='bg-light-background p-8 dark:bg-dark-surface'
            >
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

  // Show error state with retry button if offerings failed to load
  if (!hasOfferings) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className='flex-1 items-center justify-center bg-black/50'>
            <View
              style={getSquircle(18)}
              className='bg-light-background p-8 dark:bg-dark-surface'
            >
              <Ionicons
              name='cloud-offline-outline'
              size={48}
              color={greenPrimary}
            />
            <Text className='mt-4 text-center text-lg font-semibold text-light-text dark:text-dark-text'>
              {t('subscription.error.loadFailed') || 'Unable to load plans'}
            </Text>
            <Text className='mt-2 text-center text-sm text-light-muted dark:text-dark-muted'>
              {t('subscription.error.tryAgain') ||
                'Please check your connection and try again'}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                setIsLoadingOfferings(true);
                try {
                  await refreshOfferings();
                } finally {
                  setIsLoadingOfferings(false);
                }
              }}
              style={[
                getButtonBorderRadius(),
                { backgroundColor: greenPrimary },
              ]}
              className='mt-6 px-8 py-3'
            >
              <Text className='text-center text-base font-semibold text-white'>
                {t('common.retry') || 'Retry'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className='mt-4 py-2'>
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
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View className='flex-1 bg-light-background dark:bg-dark-background'>
        {/* Close button - floating over hero */}
        <View className='absolute right-4 top-4 z-10'>
          <TouchableOpacity
            onPress={onClose}
            className='h-8 w-8 items-center justify-center rounded-full'
            style={{
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.1)',
            }}
          >
            <Ionicons
              name='close'
              size={18}
              color={isDark ? '#fff' : '#333'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          {/* Hero Section with Gradient */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#064E3B', '#065F46', '#141414']
                  : ['#D1FAE5', '#A7F3D0', '#FFFFFF']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              className='items-center px-6 pb-8 pt-14'
            >
              {/* Large Icon */}
              <MotiView
                from={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 200 }}
                className='mb-4 h-20 w-20 items-center justify-center rounded-full'
                style={{ backgroundColor: greenBg }}
              >
                <Ionicons name='diamond' size={40} color={greenPrimary} />
              </MotiView>

              {/* Trial Badge */}
              {isTrialEligible && (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 300 }}
                  className='mb-3'
                >
                  <View
                    className='self-center rounded-full px-5 py-1.5'
                    style={{ backgroundColor: greenPrimary }}
                  >
                    <Text className='text-sm font-bold text-white'>
                      {t('subscription.trialBadge') || '7 DAYS FREE'}
                    </Text>
                  </View>
                </MotiView>
              )}

              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 350 }}
              >
                <Text className='mb-2 text-center text-2xl font-bold text-light-text dark:text-dark-text'>
                  {isTrialEligible
                    ? t('subscription.hero.title') ||
                      'Try FastFlix Pro free for 7 days'
                    : t('subscription.hero.titleNoTrial') ||
                      'Unlock FastFlix Pro'}
                </Text>
                <Text className='text-center text-base text-light-muted dark:text-dark-muted'>
                  {isTrialEligible
                    ? t('subscription.hero.subtitle') ||
                      'Unlimited recommendations, then choose your plan'
                    : t('subscription.hero.subtitleNoTrial') ||
                      'Get unlimited recommendations with Pro'}
                </Text>
              </MotiView>
            </LinearGradient>
          </MotiView>

          {/* Features List */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
            className='px-6 py-6'
          >
            {features.map((feature, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: 450 + index * 80,
                }}
                className='mb-3 flex-row items-center'
              >
                <View
                  className='mr-3 h-8 w-8 items-center justify-center rounded-full'
                  style={{ backgroundColor: greenBg }}
                >
                  <Ionicons name={feature.icon} size={16} color={greenPrimary} />
                </View>
                <Text className='flex-1 text-base text-light-text dark:text-dark-text'>
                  {feature.label}
                </Text>
                <Ionicons
                  name='checkmark-circle'
                  size={20}
                  color={greenPrimary}
                />
              </MotiView>
            ))}
          </MotiView>

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
                <Ionicons
                  key={star}
                  name='star'
                  size={16}
                  color='#FBBF24'
                  style={{ marginHorizontal: 1 }}
                />
              ))}
            </View>
            <Text className='text-sm font-semibold text-light-text dark:text-dark-text'>
              {t('subscription.socialProof') ||
                'Join 10,000+ movie lovers'}
            </Text>
            <Text className='text-xs text-light-muted dark:text-dark-muted'>
              {t('subscription.socialProofSub') ||
                'Rated 4.9 stars by our community'}
            </Text>
          </MotiView>

          {/* Pricing Plans */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 900 }}
            className='mb-6 px-6'
          >
            <Text className='mb-4 text-center text-lg font-semibold text-light-text dark:text-dark-text'>
              {t('subscription.plans.title') || 'Choose Your Plan'}
            </Text>

            {/* Monthly Plan */}
            {monthlyPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPlan('monthly')}
                style={getSquircle(18)}
                className={cn(
                  'mb-3 border-2 p-4',
                  selectedPlan === 'monthly'
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                <View className='flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.monthly.title') || 'Monthly'}
                    </Text>
                    <Text className='text-xs text-light-muted dark:text-dark-muted'>
                      {t('subscription.monthly.description') ||
                        'Flexible monthly billing'}
                    </Text>
                  </View>
                  <View className='items-end'>
                    <Text
                      className='text-xl font-bold'
                      style={{ color: greenPrimary }}
                    >
                      {formatPrice(monthlyPackage.product.priceString)}
                    </Text>
                    <Text className='text-xs text-light-muted dark:text-dark-muted'>
                      {t('subscription.monthly.period') || '/month'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Quarterly Plan - POPULAR (default selected) */}
            {quarterlyPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPlan('quarterly')}
                style={getSquircle(18)}
                className={cn(
                  'relative mb-3 border-2 p-4',
                  selectedPlan === 'quarterly'
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                {/* Popular Badge */}
                <View
                  className='absolute -top-3 left-4 rounded-full px-3 py-1'
                  style={{
                    backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                    borderWidth: 1,
                    borderColor: greenPrimary,
                  }}
                >
                  <Text
                    className='text-xs font-bold'
                    style={{ color: greenPrimary }}
                  >
                    {t('subscription.popular') || 'POPULAR'}
                  </Text>
                </View>

                <View className='mt-2 flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.quarterly.title') || '3 Months'}
                    </Text>
                    <View className='flex-row items-center gap-2'>
                      {quarterlySavings > 0 && (
                        <View
                          className='rounded-full px-2 py-0.5'
                          style={{ backgroundColor: greenBg }}
                        >
                          <Text
                            className='text-xs font-semibold'
                            style={{ color: greenDark }}
                          >
                            -{quarterlySavings}%
                          </Text>
                        </View>
                      )}
                      <Text className='text-xs text-light-muted dark:text-dark-muted'>
                        {formatNumericPrice(quarterlyPerMonth)}
                        {t('subscription.perMonth') || '/mo'}
                      </Text>
                    </View>
                  </View>
                  <View className='items-end'>
                    {quarterlySavings > 0 && (
                      <Text className='text-sm text-light-muted line-through dark:text-dark-muted'>
                        {formatNumericPrice(quarterlyComparisonPrice)}
                      </Text>
                    )}
                    <Text
                      className='text-xl font-bold'
                      style={{ color: greenPrimary }}
                    >
                      {formatPrice(quarterlyPackage.product.priceString)}
                    </Text>
                    <Text className='text-xs text-light-muted dark:text-dark-muted'>
                      {t('subscription.quarterly.period') || '/3 months'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Annual Plan - BEST VALUE */}
            {annualPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPlan('annual')}
                style={getSquircle(18)}
                className={cn(
                  'relative mb-3 border-2 p-4',
                  selectedPlan === 'annual'
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                {/* Best Value Badge */}
                <View
                  className='absolute -top-3 left-4 flex-row items-center rounded-full px-3 py-1'
                  style={{ backgroundColor: greenPrimary }}
                >
                  <Ionicons
                    name='trophy'
                    size={12}
                    color='white'
                    style={{ marginRight: 4 }}
                  />
                  <Text className='text-xs font-bold text-white'>
                    {t('subscription.bestValue') || 'BEST VALUE'}
                  </Text>
                </View>

                <View className='mt-2 flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.annual.title') || 'Annual'}
                    </Text>
                    <View className='flex-row items-center gap-2'>
                      {annualSavings > 0 && (
                        <View
                          className='rounded-full px-2 py-0.5'
                          style={{ backgroundColor: greenBg }}
                        >
                          <Text
                            className='text-xs font-bold'
                            style={{ color: greenDark }}
                          >
                            -{annualSavings}%
                          </Text>
                        </View>
                      )}
                      <Text className='text-xs text-light-muted dark:text-dark-muted'>
                        {`${t('subscription.annual.just') || 'Just'} ${formatNumericPrice(annualPerWeek)}${t('subscription.annual.perWeek') || '/week'}`}
                      </Text>
                    </View>
                  </View>
                  <View className='items-end'>
                    {annualSavings > 0 && (
                      <Text className='text-sm text-light-muted line-through dark:text-dark-muted'>
                        {formatNumericPrice(annualComparisonPrice)}
                      </Text>
                    )}
                    <Text
                      className='text-xl font-bold'
                      style={{ color: greenPrimary }}
                    >
                      {formatPrice(annualPackage.product.priceString)}
                    </Text>
                    <Text className='text-xs text-light-muted dark:text-dark-muted'>
                      {t('subscription.annual.period') || '/year'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </MotiView>
        </ScrollView>

        {/* Bottom Actions - Sticky */}
        <View
          className='border-t border-light-border px-6 pb-6 pt-4 dark:border-dark-border'
          style={{
            backgroundColor: isDark ? '#141414' : '#FFFFFF',
          }}
        >
          {/* Main CTA Button */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 1000 }}
          >
            <TouchableOpacity
              onPress={handlePurchase}
              disabled={purchasing || !getSelectedPackage()}
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
              className={cn(
                'mb-2 py-4',
                (purchasing || !getSelectedPackage()) && 'opacity-50'
              )}
            >
              {purchasing ? (
                <ActivityIndicator color='white' />
              ) : (
                <View className='items-center'>
                  <Text className='text-center text-lg font-bold text-white'>
                    {isTrialEligible
                      ? t('subscription.startTrial') ||
                        'Start Free 7-Day Trial'
                      : t('subscription.subscribe') || 'Subscribe Now'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Reassurance text below button */}
            <Text className='mb-3 text-center text-xs text-light-muted dark:text-dark-muted'>
              {isTrialEligible
                ? t('subscription.trialReassurance') ||
                  'No charge until trial ends. Cancel anytime.'
                : t('subscription.cancelAnytime') || 'Cancel anytime'}
            </Text>
          </MotiView>

          {/* Restore Purchases */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={purchasing}
            className='py-2'
          >
            <Text
              className='text-center text-sm font-medium'
              style={{ color: greenPrimary }}
            >
              {t('subscription.restore') || 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          {/* Terms + Legal Links */}
          <View className='mt-3'>
            <Text className='mb-2 text-center text-xs text-light-muted dark:text-dark-muted'>
              {t('subscription.terms') ||
                'Subscription automatically renews unless cancelled. Terms and conditions apply.'}
            </Text>
            <View className='flex-row justify-center gap-6'>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    'https://fastflix-website.vercel.app/privacy-policy'
                  )
                }
              >
                <Text className='text-xs text-light-muted underline dark:text-dark-muted'>
                  {t('profile.privacyPolicy') || 'Privacy Policy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    'https://fastflix-website.vercel.app/terms-of-use'
                  )
                }
              >
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
