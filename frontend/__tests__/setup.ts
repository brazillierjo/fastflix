/**
 * Jest Setup File
 * Minimal mocks for testing
 */

import { QueryClient } from '@tanstack/react-query';

// Mock react-native-css-interop - use moduleNameMapper in jest.config.js instead

// Global QueryClient for tests - will be cleaned up after each test
declare global {
  // eslint-disable-next-line no-var
  var testQueryClient: QueryClient | undefined;
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock localStorage for Zustand persist middleware
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Silence all console output in tests
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.warn = jest.fn();
global.console.error = jest.fn();
global.console.debug = jest.fn();

// Cleanup after each test to prevent open handles
afterEach(async () => {
  // Clean up React Query client if it exists
  if (global.testQueryClient) {
    global.testQueryClient.clear();
    global.testQueryClient = undefined;
  }
  jest.clearAllMocks();
  // Clear all timers to prevent open handles
  jest.clearAllTimers();
});

afterAll(async () => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  // Wait for any pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));
});
