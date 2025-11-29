/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { useLanguage } from './LanguageContext';
import { authService, User } from '../services/auth.service';

export interface AuthContextType {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  /**
   * Load user from secure storage
   */
  const loadUser = async () => {
    try {
      setIsLoading(true);
      const storedUser = await authService.getCurrentUser();
      setUser(storedUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Apple
   */
  const signInWithApple = async () => {
    try {
      setIsLoading(true);

      const authData = await authService.signInWithApple();

      setUser(authData.user);

      // Show success message
      Alert.alert(
        t('auth.success.title') || 'Welcome!',
        t('auth.success.message') ||
          `Welcome${authData.user.name ? ` ${authData.user.name}` : ''}!`
      );
    } catch (error) {
      console.error('Sign in error:', error);

      // Don't show error if user cancelled
      if (error instanceof Error && error.message.includes('cancelled')) {
        return;
      }

      Alert.alert(
        t('auth.error.title') || 'Sign In Failed',
        t('auth.error.message') ||
          (error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.')
      );

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setUser(null);

      Alert.alert(
        t('auth.signout.title') || 'Signed Out',
        t('auth.signout.message') || 'You have been signed out successfully.'
      );
    } catch (error) {
      console.error('Sign out error:', error);

      Alert.alert(
        t('auth.error.title') || 'Error',
        t('auth.error.signout') ||
          'Failed to sign out. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data from backend
   */
  const refreshUser = async () => {
    try {
      const freshUser = await authService.refreshUserData();
      if (freshUser) {
        setUser(freshUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    signInWithApple,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
