/**
 * Mock for react-native-css-interop
 * Used in Jest tests to avoid native module issues
 */

// Use jest.requireActual to get React safely
const React = jest.requireActual('react');

module.exports = {
  cssInterop: jest.fn(),
  remapProps: jest.fn(),
  useColorScheme: jest.fn(() => 'light'),
  // Directly use React.createElement from the requireActual
  createInteropElement: React.createElement,
  StyleSheet: {
    create: styles => styles,
  },
};
