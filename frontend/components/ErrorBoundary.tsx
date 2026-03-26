/**
 * ErrorBoundary - Catches unhandled React errors to prevent full app crashes
 */

import React, { Component, type ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as Sentry from '@sentry/react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className='flex-1 items-center justify-center bg-light-background p-6 dark:bg-dark-background'>
          <Text className='mb-2 text-center text-lg font-bold text-light-text dark:text-dark-text'>
            Oops, une erreur est survenue
          </Text>
          <Text className='mb-6 text-center text-sm text-light-muted dark:text-dark-muted'>
            L'application a rencontré un problème inattendu.
          </Text>
          <TouchableOpacity
            className='rounded-xl bg-netflix-500 px-6 py-3'
            onPress={() => this.setState({ hasError: false })}
          >
            <Text className='font-semibold text-white'>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
