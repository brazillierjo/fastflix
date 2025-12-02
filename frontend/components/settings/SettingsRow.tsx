import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  showChevron?: boolean;
}

export default function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  isFirst = false,
  isLast = false,
  showChevron = true,
}: SettingsRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const defaultIconColor = isDark ? '#ffffff' : '#0f172a';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      className={`bg-light-card dark:bg-dark-card ${isFirst ? 'rounded-t-xl' : ''} ${isLast ? 'rounded-b-xl' : ''} `}
    >
      <View className='flex-row items-center px-4 py-3'>
        {/* Icon */}
        <View className='mr-3 h-8 w-8 items-center justify-center rounded-lg bg-light-background dark:bg-dark-background'>
          <Ionicons
            name={icon}
            size={18}
            color={iconColor || defaultIconColor}
          />
        </View>

        {/* Content */}
        <View className='mr-2 flex-1'>
          <Text
            className='text-base font-medium text-light-text dark:text-dark-text'
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className='mt-0.5 text-sm text-light-muted dark:text-dark-muted'
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Chevron */}
        {showChevron && (
          <Ionicons
            name='chevron-forward'
            size={20}
            color={isDark ? '#6b7280' : '#9ca3af'}
          />
        )}
      </View>

      {/* Separator */}
      {!isLast && (
        <View className='ml-16 h-px bg-light-border dark:bg-dark-border' />
      )}
    </TouchableOpacity>
  );
}
