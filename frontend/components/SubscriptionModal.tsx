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
import AppIcon from './AppIcon';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionSuccess?: () => void;
}

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
    getAnnualPackage,
    trialInfo,
    startFreeTrial,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    'annual'
  );
  const [purchasing, setPurchasing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const monthlyPackage = getMonthlyPackage();
  const annualPackage = getAnnualPackage();

  // Fonction pour formater le prix selon la devise du pays de l'utilisateur
  const formatPrice = (priceString: string): string => {
    // Extraire le prix numérique de la chaîne RevenueCat
    const numericPrice = extractPriceFromString(priceString);

    if (numericPrice === null) {
      // Si on ne peut pas extraire le prix, retourner la chaîne originale
      return priceString;
    }

    // Détecter la devise actuelle du prix
    const currentCurrency = detectCurrencyFromPriceString(priceString);
    const targetCurrency = getCurrencyForCountry(country);

    // Si la devise est déjà la bonne, formater selon les conventions locales
    if (currentCurrency === targetCurrency) {
      return formatPriceForCountry(numericPrice, country);
    }

    // Pour l'instant, on garde le prix original si les devises diffèrent
    // Dans une vraie app, on ferait une conversion avec des taux de change réels
    return priceString;
  };

  const handlePurchase = async () => {
    const packageToPurchase =
      selectedPlan === 'monthly' ? monthlyPackage : annualPackage;

    if (!packageToPurchase) {
      console.error('No package selected');
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

      // Call success callback before closing (if provided)
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setPurchasing(true);
      const restored = await restorePurchases();

      // If restore was successful and callback is provided, call it
      if (restored && onSubscriptionSuccess) {
        onSubscriptionSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Restore error:', error);
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
      console.error('Start trial error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  // Check if user can start trial (hasn't used it yet)
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

  if (isLoading) {
    return (
      <Modal visible={visible} transparent animationType='fade'>
        <View className='flex-1 items-center justify-center bg-black/50'>
          <View
            style={getSquircle(18)}
            className='bg-light-background p-8 dark:bg-dark-surface'
          >
            <ActivityIndicator size='large' color='#3B82F6' />
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
              <Ionicons
                name='film'
                size={40}
                color={isDark ? '#E50914' : '#E50914'}
              />
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
                <View className='mr-4 h-12 w-12 items-center justify-center rounded-full bg-netflix-500/10 dark:bg-netflix-500/20'>
                  <Ionicons name='film' size={24} color='#E50914' />
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

            {/* Annual Plan */}
            {annualPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPlan('annual')}
                style={getSquircle(18)}
                className={cn(
                  'relative mb-4 border-2 p-4',
                  selectedPlan === 'annual'
                    ? 'border-netflix-500 bg-netflix-500/5 dark:bg-netflix-500/10'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                {/* Popular Badge */}
                <View className='absolute -top-2 left-4 rounded-full bg-netflix-500 px-3 py-1'>
                  <Text className='text-xs font-semibold text-white'>
                    {t('subscription.popular') || 'POPULAR'}
                  </Text>
                </View>

                <View className='mt-2 flex-row items-center justify-between'>
                  <View>
                    <Text className='font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.annual.title') || 'Annual Plan'}
                    </Text>
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.annual.description') ||
                        'Best value - Save 50%'}
                    </Text>
                  </View>
                  <View className='items-end'>
                    <Text className='text-xl font-bold text-light-text dark:text-dark-text'>
                      {formatPrice(annualPackage.product.priceString)}
                    </Text>
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.annual.period') || 'per year'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Monthly Plan */}
            {monthlyPackage && (
              <TouchableOpacity
                onPress={() => setSelectedPlan('monthly')}
                style={getSquircle(18)}
                className={cn(
                  'border-2 p-4',
                  selectedPlan === 'monthly'
                    ? 'border-netflix-500 bg-netflix-500/5 dark:bg-netflix-500/10'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                <View className='flex-row items-center justify-between'>
                  <View>
                    <Text className='font-semibold text-light-text dark:text-dark-text'>
                      {t('subscription.monthly.title') || 'Monthly Plan'}
                    </Text>
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.monthly.description') ||
                        'Flexible monthly billing'}
                    </Text>
                  </View>
                  <View className='items-end'>
                    <Text className='text-xl font-bold text-light-text dark:text-dark-text'>
                      {formatPrice(monthlyPackage.product.priceString)}
                    </Text>
                    <Text className='text-sm text-light-muted dark:text-dark-muted'>
                      {t('subscription.monthly.period') || 'per month'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className='border-t border-light-border p-6 dark:border-dark-border'>
          {/* Free Trial Button - Only shown if user hasn't used trial */}
          {canStartTrial && (
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
                style={getButtonBorderRadius()}
                className={cn(
                  'mb-3 border-2 border-netflix-500 bg-netflix-500/10 py-4',
                  purchasing && 'opacity-50'
                )}
              >
                {purchasing ? (
                  <ActivityIndicator color='#E50914' />
                ) : (
                  <View className='flex-row items-center justify-center gap-2'>
                    <MotiView
                      from={{ rotate: '0deg' }}
                      animate={{ rotate: ['0deg', '-10deg', '10deg', '0deg'] }}
                      transition={{
                        type: 'timing',
                        duration: 500,
                        loop: true,
                        delay: 2000,
                      }}
                    >
                      <Ionicons name='gift-outline' size={22} color='#E50914' />
                    </MotiView>
                    <Text className='text-center text-lg font-semibold text-netflix-500'>
                      {t('subscription.startTrial') || 'Start 7-Day Free Trial'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          )}

          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || (!monthlyPackage && !annualPackage)}
            style={getButtonBorderRadius()}
            className={cn(
              'mb-4 bg-netflix-500 py-4',
              (purchasing || (!monthlyPackage && !annualPackage)) &&
                'opacity-50'
            )}
          >
            {purchasing ? (
              <ActivityIndicator color='white' />
            ) : (
              <Text className='text-center text-lg font-semibold text-white'>
                {t('subscription.subscribe') || 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestore}
            disabled={purchasing}
            className='py-3'
          >
            <Text className='text-center font-medium text-netflix-500'>
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
