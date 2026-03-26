/**
 * OfflineBanner - Shows a banner when the app detects no network connectivity
 * Uses a simple fetch-based approach to check connectivity
 */

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        // Quick ping to check connectivity
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mounted) setIsOffline(false);
      } catch {
        if (mounted) setIsOffline(true);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View className='bg-amber-600 px-4 py-2'>
      <Text className='text-center text-xs font-medium text-white'>
        Pas de connexion internet
      </Text>
    </View>
  );
}
