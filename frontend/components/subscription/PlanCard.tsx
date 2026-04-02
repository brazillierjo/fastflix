import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { cn } from '@/utils/cn';
import { getSquircle } from '@/utils/designHelpers';

interface PlanCardProps {
  title: string;
  description?: string;
  price: string;
  period: string;
  perUnitLabel?: string;
  comparisonPrice?: string;
  savingsPercent?: number;
  badgeLabel?: string;
  badgeVariant?: 'outline' | 'filled';
  selected: boolean;
  onPress: () => void;
  greenPrimary: string;
  greenDark: string;
  greenBg: string;
}

export default function PlanCard({
  title,
  description,
  price,
  period,
  perUnitLabel,
  comparisonPrice,
  savingsPercent,
  badgeLabel,
  badgeVariant = 'outline',
  selected,
  onPress,
  greenPrimary,
  greenDark,
  greenBg,
}: PlanCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={getSquircle(18)}
      accessibilityLabel={`${title} plan, ${price} ${period}`}
      accessibilityRole='radio'
      accessibilityState={{ selected }}
      className={cn(
        'relative mb-3 border-2 p-4',
        selected
          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
          : 'border-light-border bg-light-background dark:border-dark-border dark:bg-dark-surface'
      )}
    >
      {badgeLabel && (
        <View
          className='absolute -top-3 left-4 flex-row items-center rounded-full px-3 py-1'
          style={
            badgeVariant === 'filled'
              ? { backgroundColor: greenPrimary }
              : {
                  backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                  borderWidth: 1,
                  borderColor: greenPrimary,
                }
          }
        >
          {badgeVariant === 'filled' && (
            <Ionicons
              name='trophy'
              size={12}
              color='white'
              style={{ marginRight: 4 }}
            />
          )}
          <Text
            className='text-xs font-bold'
            style={{
              color: badgeVariant === 'filled' ? 'white' : greenPrimary,
            }}
          >
            {badgeLabel}
          </Text>
        </View>
      )}

      <View
        className={cn(
          'flex-row items-center justify-between',
          badgeLabel && 'mt-2'
        )}
      >
        <View className='flex-1'>
          <Text className='text-base font-semibold text-light-text dark:text-dark-text'>
            {title}
          </Text>
          {description && !savingsPercent && (
            <Text className='text-xs text-light-muted dark:text-dark-muted'>
              {description}
            </Text>
          )}
          {(savingsPercent || perUnitLabel) && (
            <View className='flex-row items-center gap-2'>
              {savingsPercent ? (
                <View
                  className='rounded-full px-2 py-0.5'
                  style={{ backgroundColor: greenBg }}
                >
                  <Text
                    className='text-xs font-semibold'
                    style={{ color: greenDark }}
                  >
                    -{savingsPercent}%
                  </Text>
                </View>
              ) : null}
              {perUnitLabel && (
                <Text className='text-xs text-light-muted dark:text-dark-muted'>
                  {perUnitLabel}
                </Text>
              )}
            </View>
          )}
        </View>
        <View className='items-end'>
          {comparisonPrice && (
            <Text className='text-sm text-light-muted line-through dark:text-dark-muted'>
              {comparisonPrice}
            </Text>
          )}
          <Text className='text-xl font-bold' style={{ color: greenPrimary }}>
            {price}
          </Text>
          <Text className='text-xs text-light-muted dark:text-dark-muted'>
            {period}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
