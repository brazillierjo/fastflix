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
    icon: './assets/app-images/icon-1024-1024.png',
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
      image: './assets/app-images/splash-4096-4096.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fastflix.app',
      buildNumber: iosBuildNumber,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/app-images/icon-1024-1024.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.fastflix.app',
      versionCode: androidVersionCode,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/app-images/icon-1024-1024.png',
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      TMDB_API_KEY: process.env.TMDB_API_KEY,
      TMDB_TOKEN: process.env.TMDB_TOKEN,
      REVENUECAT_IOS_API_KEY: process.env.REVENUECAT_IOS_API_KEY,
    },
  },
};
