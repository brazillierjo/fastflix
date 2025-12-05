/**
 * Jest Configuration for FastFlix React Native App
 * Optimized for testing React Native components and business logic
 */

module.exports = {
  preset: 'react-native',

  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform files with babel
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/constants/(.*)$': '<rootDir>/constants/$1',
    '^@/store/(.*)$': '<rootDir>/store/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    // Mock native modules that cause issues in tests
    '^react-native-css-interop$':
      '<rootDir>/__mocks__/react-native-css-interop.js',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/ios/',
    '<rootDir>/android/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|expo-.*|@react-navigation|react-native-vector-icons|react-native-.*|@react-native-.*|zustand)/)',
  ],

  // Collect coverage from
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // Coverage thresholds - targeting tested files only
  // Components are not unit tested (they use integration/E2E tests)
  coverageThreshold: {
    './hooks/useBackendMovieSearch.ts': {
      branches: 80,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './hooks/useWatchlist.ts': {
      branches: 60,
      functions: 85,
      lines: 80,
      statements: 80,
    },
    './services/backend-api.service.ts': {
      branches: 65,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './utils/cn.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Mock modules - removed expo moduleNameMapping as it's not available
  // This would be added if using expo-jest preset

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Globals
  globals: {
    __DEV__: true,
  },

  // Force Jest to exit after all tests complete
  forceExit: true,

  // Detect open handles for debugging
  detectOpenHandles: false,
};
