/**
 * Authentication Service
 * Handles Apple/Google Sign In and JWT token management
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { backendAPIService } from './backend-api.service';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Storage keys
const AUTH_TOKEN_KEY = 'fastflix_auth_token';
const USER_DATA_KEY = 'fastflix_user_data';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  auth_provider: 'apple' | 'google';
  provider_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<AuthResponse> {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Apple Authentication is not available on this device');
      }

      // Request Apple Sign In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Prepare request for backend
      const requestBody = {
        identityToken: credential.identityToken!,
        user: credential.fullName
          ? {
              email: credential.email || undefined,
              name: {
                firstName: credential.fullName.givenName || undefined,
                lastName: credential.fullName.familyName || undefined,
              },
            }
          : undefined,
      };

      // Call backend auth endpoint
      const response = await backendAPIService.signInWithApple(requestBody);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Apple Sign In failed');
      }

      const authData = response.data;

      // Store token and user data
      await this.storeAuthData(authData.token, authData.user);

      return authData;
    } catch (error) {
      console.error('Apple Sign In error:', error);

      if (error instanceof Error && error.message.includes('ERR_CANCELED')) {
        throw new Error('Apple Sign In was cancelled');
      }

      throw error;
    }
  }

  /**
   * Get Google Client ID from config
   */
  getGoogleClientId(): string | undefined {
    return Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  }

  /**
   * Sign in with Google using ID token from expo-auth-session
   */
  async signInWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      // Call backend auth endpoint
      const response = await backendAPIService.signInWithGoogle({ idToken });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Google Sign In failed');
      }

      const authData = response.data;

      // Store token and user data
      await this.storeAuthData(authData.token, authData.user);

      return authData;
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);

      if (!userData) {
        return null;
      }

      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return token !== null;
  }

  /**
   * Store auth data (token + user)
   */
  private async storeAuthData(token: string, user: User): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
  }

  /**
   * Refresh user data from backend
   */
  async refreshUserData(): Promise<User | null> {
    try {
      const response = await backendAPIService.getCurrentUser();

      if (!response.success || !response.data) {
        return null;
      }

      const user = response.data.user;

      // Update stored user data
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));

      return user;
    } catch (error) {
      console.error('Refresh user data error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
