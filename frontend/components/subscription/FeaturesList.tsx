import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React from 'react';
import { Text, View } from 'react-native';

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

interface FeaturesListProps {
  features: Feature[];
  greenPrimary: string;
  greenBg: string;
}

export default function FeaturesList({
  features,
  greenPrimary,
  greenBg,
}: FeaturesListProps) {
  return (
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
          accessibilityLabel={feature.label}
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
          <Ionicons name='checkmark-circle' size={20} color={greenPrimary} />
        </MotiView>
      ))}
    </MotiView>
  );
}
