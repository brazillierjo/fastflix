require('dotenv').config({ path: '.env.local' });

const {
  version,
  iosBuildNumber,
  androidVersionCode,
} = require('./utils/version');

export default {
  expo: {
    name: 'FastFlix',
    slug: 'fastflix',
    version,
    description:
      'AI-powered movie and TV show recommendations. Discover what to watch tonight with personalized suggestions based on your mood and preferences.',
    orientation: 'portrait',
    icon: './assets/appstore.png',
    scheme: 'fastflix',
    userInterfaceStyle: 'automatic',
    category: 'entertainment',
    keywords: [
      'movies',
      'tv shows',
      'recommendations',
      'streaming',
      'entertainment',
      'AI',
    ],
    splash: {
      image: './assets/appstore.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fastflix.app',
      buildNumber: iosBuildNumber,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/appstore.png',
        backgroundColor: '#000000',
      },
      package: 'com.fastflix.app',
      versionCode: androidVersionCode,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/playstore.png',
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-apple-authentication'],
    experiments: {
      typedRoutes: true,
    },
    updates: {
      url: 'https://u.expo.dev/d040206b-f26d-4432-a0fd-847ad637352f',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    extra: {
      API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:
        process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:
        process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      eas: {
        projectId: 'd040206b-f26d-4432-a0fd-847ad637352f',
      },
    },
  },
};
