/**
 * Application Constants
 * Centralized configuration for the FastFlix app
 */

export const APP_CONFIG = {
  // Subscription limits
  FREE_MONTHLY_PROMPT_LIMIT: 3,
  RECOMMENDED_MOVIES_LIMIT: 10,
  MAX_SEARCH_RESULTS: 20,

  // API Configuration
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    DEFAULT_LANGUAGE: 'fr-FR',
    FALLBACK_LANGUAGE: 'en-US',
  },

  // Cache Configuration
  CACHE: {
    STALE_TIME: 5 * 60 * 1000, // 5 minutes
    GC_TIME: 10 * 60 * 1000, // 10 minutes
    RETRY_COUNT: 2,
  },

  // UI Configuration
  ANIMATION: {
    DURATION_SHORT: 300,
    DURATION_MEDIUM: 600,
    DURATION_LONG: 1000,
    SPRING_CONFIG: {
      damping: 15,
      stiffness: 150,
    },
  },

  // External Links
  LINKS: {
    PRIVACY_POLICY: 'https://fastflix-website.vercel.app/privacy-policy',
    SUPPORT: 'https://fastflix-website.vercel.app/support',
    WEBSITE: 'https://fastflix-website.vercel.app',
    TMDB_MOVIE: 'https://www.themoviedb.org/movie',
    TMDB_TV: 'https://www.themoviedb.org/tv',
  },

  // Storage Keys
  STORAGE_KEYS: {
    LANGUAGE: '@app_language',
    COUNTRY: '@app_country',
    MONTHLY_PROMPT_DATA: 'monthlyPromptData',
    USER_PREFERENCES: '@user_preferences',
  },
} as const;

