import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/contexts/RevenueCatContext';
import { cn } from '@/utils/cn';
import {
  detectCurrencyFromPriceString,
  extractPriceFromString,
  formatPriceForCountry,
  getCurrencyForCountry,
} from '@/utils/currency';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppIcon from './AppIcon';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({
  visible,
  onClose,
}: SubscriptionModalProps) {
  const { t, country } = useLanguage();
  const {
    isLoading,
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
    getAnnualPackage,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
    'annual'
  );
  const [purchasing, setPurchasing] = useState(false);

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
      return;
    }

    try {
      setPurchasing(true);
      await purchasePackage(packageToPurchase);
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
      await restorePurchases();
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setPurchasing(false);
    }
  };

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
          <View className='rounded-2xl bg-light-background p-8 dark:bg-dark-surface'>
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
            <Text className='mb-4 text-center text-4xl'>🎬✨</Text>
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
                <View className='mr-4 h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30'>
                  <Text className='text-2xl'>🎬</Text>
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
                className={cn(
                  'relative mb-4 rounded-2xl border-2 p-4',
                  selectedPlan === 'annual'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
                )}
              >
                {/* Popular Badge */}
                <View className='absolute -top-2 left-4 rounded-full bg-primary-500 px-3 py-1'>
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
                className={cn(
                  'rounded-2xl border-2 p-4',
                  selectedPlan === 'monthly'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
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
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || (!monthlyPackage && !annualPackage)}
            className={cn(
              'mb-4 rounded-2xl bg-primary-500 py-4',
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
            <Text className='text-center font-medium text-primary-500'>
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
              Linking.openURL('https://fastflix-nu.vercel.app/privacy-policy')
            }
          >
            <Text className='text-xs text-light-muted underline dark:text-dark-muted'>
              {t('profile.privacyPolicy') || 'Privacy Policy'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL('https://fastflix-nu.vercel.app/terms-of-use')
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
