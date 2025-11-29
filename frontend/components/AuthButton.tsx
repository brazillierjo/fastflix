/**
 * Authentication Button Component
 * Reusable button for authentication actions (Sign In/Sign Out)
 */

import { cn } from '@/utils/cn';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface AuthButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export default function AuthButton({
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  children,
}: AuthButtonProps) {
  const getVariantClasses = () => {
    if (loading || disabled) {
      return 'bg-light-muted dark:bg-dark-muted';
    }

    switch (variant) {
      case 'primary':
        return 'bg-light-primary dark:bg-dark-primary';
      case 'secondary':
        return 'bg-light-accent dark:bg-dark-accent';
      case 'danger':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-light-primary dark:bg-dark-primary';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      className={cn(
        'flex-row items-center justify-center rounded-xl px-6 py-4',
        getVariantClasses()
      )}
    >
      {loading ? (
        <>
          <ActivityIndicator
            size="small"
            color="#ffffff"
            style={{ marginRight: 8 }}
          />
          <Text className="text-base font-semibold text-white">
            Loading...
          </Text>
        </>
      ) : (
        <Text className="text-base font-semibold text-white">{children}</Text>
      )}
    </TouchableOpacity>
  );
}
