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
import { MotiView } from 'moti';
import React, { useState } from 'react';
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
import { PurchasesPackage } from 'react-native-purchases';
import AppIcon from './AppIcon';

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
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
    getQuarterlyPackage,
    getAnnualPackage,
    trialInfo,
    startFreeTrial,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('quarterly');
  const [purchasing, setPurchasing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      Sentry.captureException(error, { tags: { context: 'purchase' } });
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

  const handleStartTrial = async () => {
    try {
      setPurchasing(true);
      const success = await startFreeTrial();

      if (success) {
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess();
        }
        onClose();
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { context: 'start-trial' } });
    } finally {
      setPurchasing(false);
    }
  };

  const canStartTrial = !trialInfo?.used;

  const features = [
    {
      icon: <AppIcon size={24} />,
      title:
        t('subscription.features.unlimited.title') ||
        'Unlimited Recommendations',
      description:
        t('subscription.features.unlimited.description') ||
        'Get as many movie recommendations as you want',
    },
  ];

  // Green color scheme
  const greenPrimary = '#10B981'; // emerald-500
  const greenDark = '#059669'; // emerald-600
  const greenBg = isDark
    ? 'rgba(16, 185, 129, 0.15)'
    : 'rgba(16, 185, 129, 0.1)';

  if (isLoading) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <View className='flex-1 items-center justify-center bg-black/50'>
          <View
            style={getSquircle(18)}
            className='bg-light-background p-8 dark:bg-dark-surface'
          >
            <ActivityIndicator size='large' color={greenPrimary} />
            <Text className='mt-4 text-center text-light-muted dark:text-dark-muted'>
              {t('subscription.loading') || 'Loading subscription options...'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
    >
      <View className='flex-1 bg-light-background dark:bg-dark-background'>
        {/* Header */}
        <View className='flex-row items-center justify-between border-b border-light-border p-6 dark:border-dark-border'>
          <Text className='text-2xl font-bold text-light-text dark:text-dark-text'>
            {t('subscription.title') || 'Go Premium'}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className='h-8 w-8 items-center justify-center rounded-full bg-light-surface dark:bg-dark-surface'
          >
            <Text className='text-lg text-light-muted dark:text-dark-muted'>
              ×
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className='p-6'
          >
            <View className='mb-4 flex-row items-center justify-center gap-2'>
              <Ionicons name='film' size={40} color={greenPrimary} />
              <Ionicons
                name='sparkles'
                size={32}
                color={isDark ? '#fbbf24' : '#f59e0b'}
              />
            </View>
            <Text className='mb-2 text-center text-xl font-semibold text-light-text dark:text-dark-text'>
              {t('subscription.hero.title') || 'Unlock Premium Features'}
            </Text>
            <Text className='mb-8 text-center text-light-muted dark:text-dark-muted'>
              {t('subscription.hero.subtitle') ||
                'Get the most out of your movie discovery experience'}
            </Text>
          </MotiView>

          {/* Features */}
          <View className='mb-8 px-6'>
            {features.map((feature, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'timing',
                  duration: 600,
                  delay: index * 100,
                }}
                className='mb-6 flex-row items-center'
              >
                <View
                  className='mr-4 h-12 w-12 items-center justify-center rounded-full'
                  style={{ backgroundColor: greenBg }}
                >
                  <Ionicons name='film' size={24} color={greenPrimary} />
                </View>
                <View className='flex-1'>
                  <Text className='mb-1 font-semibold text-light-text dark:text-dark-text'>
                    {feature.title}
                  </Text>
                  <Text className='text-sm text-light-muted dark:text-dark-muted'>
                    {feature.description}
                  </Text>
                </View>
              </MotiView>
            ))}
          </View>

          {/* Pricing Plans */}
          <View className='mb-8 px-6'>
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
                    <Text className='font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.monthly.title') || 'Monthly'}
                    </Text>
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
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
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.monthly.period') || '/month'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Quarterly Plan - POPULAR */}
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
                  className='absolute -top-2 left-4 rounded-full px-3 py-1'
                  style={{ backgroundColor: greenPrimary }}
                >
                  <Text className='text-xs font-semibold text-white'>
                    {t('subscription.popular') || 'POPULAR'}
                  </Text>
                </View>

                <View className='mt-2 flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text className='font-semibold text-light-text dark:text-dark-text'>
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
                      <Text className='text-sm text-light-muted dark:text-dark-muted'>
                        {t('subscription.quarterly.description') || 'Save more'}
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
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.quarterly.period') || '/3 months'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Annual Plan */}
            {annualPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPlan('annual')}
                style={getSquircle(18)}
                className={cn(
                  'mb-3 border-2 p-4',
                  selectedPlan === 'annual'
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                <View className='flex-row items-center justify-between'>
                  <View className='flex-1'>
                    <Text className='font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.annual.title') || 'Annual'}
                    </Text>
                    <View className='flex-row items-center gap-2'>
                      {annualSavings > 0 && (
                        <View
                          className='rounded-full px-2 py-0.5'
                          style={{ backgroundColor: greenBg }}
                        >
                          <Text
                            className='text-xs font-semibold'
                            style={{ color: greenDark }}
                          >
                            -{annualSavings}%
                          </Text>
                        </View>
                      )}
                      <Text className='text-sm text-light-muted dark:text-dark-muted'>
                        {t('subscription.annual.description') || 'Best value'}
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
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.annual.period') || '/year'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className='border-t border-light-border p-6 dark:border-dark-border'>
          {/* Free Trial Button - PRIMARY CTA - Only shown if user hasn't used trial */}
          {canStartTrial && (
            <>
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{
                  type: 'timing',
                  duration: 1500,
                  loop: true,
                }}
              >
                <TouchableOpacity
                  onPress={handleStartTrial}
                  disabled={purchasing}
                  style={[
                    getButtonBorderRadius(),
                    { backgroundColor: greenPrimary },
                  ]}
                  className={cn('py-4', purchasing && 'opacity-50')}
                >
                  {purchasing ? (
                    <ActivityIndicator color='white' />
                  ) : (
                    <View className='flex-row items-center justify-center gap-2'>
                      <MotiView
                        from={{ rotate: '0deg' }}
                        animate={{
                          rotate: ['0deg', '-10deg', '10deg', '0deg'],
                        }}
                        transition={{
                          type: 'timing',
                          duration: 500,
                          loop: true,
                          delay: 2000,
                        }}
                      >
                        <Ionicons name='gift-outline' size={22} color='white' />
                      </MotiView>
                      <Text className='text-center text-lg font-semibold text-white'>
                        {t('subscription.startTrial') ||
                          'Start 7-Day Free Trial'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </MotiView>
              <Text className='mb-4 mt-2 text-center text-sm text-light-muted dark:text-dark-muted'>
                {t('subscription.trialReassurance') ||
                  'No payment now. Cancel anytime.'}
              </Text>
            </>
          )}

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || !getSelectedPackage()}
            style={[
              getButtonBorderRadius(),
              canStartTrial
                ? { borderWidth: 2, borderColor: greenPrimary }
                : { backgroundColor: greenPrimary },
            ]}
            className={cn(
              'mb-4 py-4',
              (purchasing || !getSelectedPackage()) && 'opacity-50'
            )}
          >
            {purchasing ? (
              <ActivityIndicator
                color={canStartTrial ? greenPrimary : 'white'}
              />
            ) : (
              <Text
                className={cn('text-center text-lg font-semibold')}
                style={{ color: canStartTrial ? greenPrimary : 'white' }}
              >
                {t('subscription.subscribe') || 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={purchasing}
            className='py-3'
          >
            <Text
              className='text-center font-medium'
              style={{ color: greenPrimary }}
            >
              {t('subscription.restore') || 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          <Text className='mt-4 text-center text-xs text-light-muted dark:text-dark-muted'>
            {t('subscription.terms') ||
              'Subscription automatically renews unless cancelled. Terms and conditions apply.'}
          </Text>
        </View>

        {/* Legal Links */}
        <View className='my-3 flex-row justify-center gap-6'>
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
    </Modal>
  );
}
