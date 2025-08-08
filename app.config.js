import 'dotenv/config';

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
    icon: './assets/app-images/icon.png',
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
      image: './assets/app-images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
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
        foregroundImage: './assets/app-images/adaptive-icon/foreground.png',
        backgroundImage: './assets/app-images/adaptive-icon/background.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.fastflix.app',
      versionCode: androidVersionCode,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/app-images/favicon.png',
    },
    plugins: ['expo-router'],
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
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      TMDB_API_KEY: process.env.TMDB_API_KEY,
      EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:
        process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      eas: {
        projectId: 'd040206b-f26d-4432-a0fd-847ad637352f',
      },
    },
  },
};
