import 'dotenv/config';

export default {
  expo: {
    name: 'what-movie-tonight',
    slug: 'what-movie-tonight',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      TMDB_API_KEY: process.env.TMDB_API_KEY,
      TMDB_TOKEN: process.env.TMDB_TOKEN,
    },
  },
};
