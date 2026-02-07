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

  // Green color scheme
  const greenPrimary = '#10B981'; // emerald-500
  const greenDark = '#059669'; // emerald-600
  const greenBg = isDark
    ? 'rgba(16, 185, 129, 0.15)'
    : 'rgba(16, 185, 129, 0.1)';

  // Show loading state when RevenueCat is initializing or offerings are being fetched
  if (isLoading || isLoadingOfferings) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
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
      </Modal>
    );
  }

  // Show error state with retry button if offerings failed to load
  if (!hasOfferings) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
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
          {/* Free Trial Banner */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className='p-6'
          >
            {/* Trial Badge */}
            <View className='mb-4 items-center'>
              <View
                className='rounded-full px-5 py-2'
                style={{ backgroundColor: greenPrimary }}
              >
                <Text className='text-base font-bold text-white'>
                  {t('subscription.trialBadge') || '7 DAYS FREE'}
                </Text>
              </View>
            </View>

            <Text className='mb-2 text-center text-xl font-semibold text-light-text dark:text-dark-text'>
              {t('subscription.hero.title') ||
                'Try FastFlix Pro free for 7 days'}
            </Text>
            <Text className='mb-4 text-center text-sm text-light-muted dark:text-dark-muted'>
              {t('subscription.hero.subtitle') ||
                'Unlimited recommendations, then choose your plan'}
            </Text>

            {/* Feature highlight */}
            <View
              className='flex-row items-center justify-center gap-2 rounded-xl p-3'
              style={{ backgroundColor: greenBg }}
            >
              <Ionicons
                name='checkmark-circle'
                size={20}
                color={greenPrimary}
              />
              <Text
                className='text-sm font-medium'
                style={{ color: greenDark }}
              >
                {t('subscription.features.unlimited.title') ||
                  'Unlimited Recommendations'}
              </Text>
            </View>
          </MotiView>

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
                    <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
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
          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || !getSelectedPackage()}
            style={[getButtonBorderRadius(), { backgroundColor: greenPrimary }]}
            className={cn(
              'mb-2 py-4',
              (purchasing || !getSelectedPackage()) && 'opacity-50'
            )}
          >
            {purchasing ? (
              <ActivityIndicator color='white' />
            ) : (
              <Text className='text-center text-lg font-semibold text-white'>
                {t('subscription.startTrial') || 'Start 7-Day Free Trial'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Trial reassurance */}
          <Text className='mb-4 text-center text-sm text-light-muted dark:text-dark-muted'>
            {t('subscription.trialReassurance') ||
              'Cancel anytime during your free trial'}
          </Text>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={purchasing}
            className='py-3'
          >
            <Text
              className='text-center text-sm font-medium'
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
