import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

interface AppIconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export default function AppIcon({ size = 40, style }: AppIconProps) {
  return (
    <Image
      source={require('../assets/app-images/icon.png')}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.2, // 20% border radius for modern look
        },
        style,
      ]}
      resizeMode='contain'
    />
  );
}
