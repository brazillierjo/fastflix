/**
 * Storage Service - Centralized data persistence
 * Handles AsyncStorage operations with error handling and type safety
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '@/constants/app';
import { APIResponse, UserPreferences } from '@/types/api';

export interface MonthlyPromptData {
  month: string; // YYYY-MM format
  count: number;
  userId: string;
  lastUpdated: string;
}

export interface UserStorageData {
  language: string;
  country: string;
  preferences: UserPreferences;
  monthlyPromptData: MonthlyPromptData;
}

class StorageService {
  // Generic method to safely get data from storage
  private async safeGet<T>(
    key: string,
    defaultValue: T
  ): Promise<APIResponse<T>> {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item === null) {
        return {
          success: true,
          data: defaultValue,
        };
      }

      const parsed = JSON.parse(item);
      return {
        success: true,
        data: parsed,
      };
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return {
        success: false,
        data: defaultValue,
        error: {
          code: 'STORAGE_READ_ERROR',
          message: `Failed to read ${key} from storage`,
          details: { key, error: (error as Error).message },
        },
      };
    }
  }

  // Generic method to safely set data to storage
  private async safeSet<T>(
    key: string,
    value: T
  ): Promise<APIResponse<boolean>> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
      return {
        success: false,
        data: false,
        error: {
          code: 'STORAGE_WRITE_ERROR',
          message: `Failed to write ${key} to storage`,
          details: { key, error: (error as Error).message },
        },
      };
    }
  }

  // Language management
  async getLanguage(): Promise<APIResponse<string>> {
    return this.safeGet(APP_CONFIG.STORAGE_KEYS.LANGUAGE, 'en');
  }

  async setLanguage(language: string): Promise<APIResponse<boolean>> {
    return this.safeSet(APP_CONFIG.STORAGE_KEYS.LANGUAGE, language);
  }

  // Country management
  async getCountry(): Promise<APIResponse<string>> {
    return this.safeGet(APP_CONFIG.STORAGE_KEYS.COUNTRY, 'FR');
  }

  async setCountry(country: string): Promise<APIResponse<boolean>> {
    return this.safeSet(APP_CONFIG.STORAGE_KEYS.COUNTRY, country);
  }

  // User preferences management
  async getUserPreferences(): Promise<APIResponse<UserPreferences>> {
    const defaultPreferences: UserPreferences = {
      darkMode: false,
      notifications: true,
      autoPlay: false,
      dataUsage: 'medium',
    };

    return this.safeGet(
      APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES,
      defaultPreferences
    );
  }

  async setUserPreferences(
    preferences: UserPreferences
  ): Promise<APIResponse<boolean>> {
    return this.safeSet(APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  // Monthly prompt data management
  async getMonthlyPromptData(
    userId: string = 'anonymous'
  ): Promise<APIResponse<MonthlyPromptData>> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const storageKey = `${APP_CONFIG.STORAGE_KEYS.MONTHLY_PROMPT_DATA}_${userId}`;

    const defaultData: MonthlyPromptData = {
      month: currentMonth,
      count: 0,
      userId,
      lastUpdated: new Date().toISOString(),
    };

    const result = await this.safeGet(storageKey, defaultData);

    if (result.success && result.data) {
      // Check if it's a new month and reset if necessary
      if (result.data.month !== currentMonth) {
        const resetData: MonthlyPromptData = {
          month: currentMonth,
          count: 0,
          userId,
          lastUpdated: new Date().toISOString(),
        };

        await this.safeSet(storageKey, resetData);
        return {
          success: true,
          data: resetData,
        };
      }
    }

    return result;
  }

  async setMonthlyPromptData(
    data: MonthlyPromptData
  ): Promise<APIResponse<boolean>> {
    const storageKey = `${APP_CONFIG.STORAGE_KEYS.MONTHLY_PROMPT_DATA}_${data.userId}`;
    const updatedData = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    return this.safeSet(storageKey, updatedData);
  }

  async incrementMonthlyPromptCount(
    userId: string = 'anonymous'
  ): Promise<APIResponse<number>> {
    try {
      const dataResult = await this.getMonthlyPromptData(userId);

      if (!dataResult.success) {
        return {
          success: false,
          data: 0,
          error: dataResult.error,
        };
      }

      const newCount = dataResult.data.count + 1;
      const updatedData: MonthlyPromptData = {
        ...dataResult.data,
        count: newCount,
        lastUpdated: new Date().toISOString(),
      };

      const setResult = await this.setMonthlyPromptData(updatedData);

      if (!setResult.success) {
        return {
          success: false,
          data: dataResult.data.count,
          error: setResult.error,
        };
      }

      return {
        success: true,
        data: newCount,
      };
    } catch (error) {
      console.error('Failed to increment prompt count:', error);
      return {
        success: false,
        data: 0,
        error: {
          code: 'INCREMENT_ERROR',
          message: 'Failed to increment prompt count',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Bulk operations
  async getUserData(
    userId: string = 'anonymous'
  ): Promise<APIResponse<UserStorageData>> {
    try {
      const [
        languageResult,
        countryResult,
        preferencesResult,
        promptDataResult,
      ] = await Promise.all([
        this.getLanguage(),
        this.getCountry(),
        this.getUserPreferences(),
        this.getMonthlyPromptData(userId),
      ]);

      // Check if any operation failed
      const results = [
        languageResult,
        countryResult,
        preferencesResult,
        promptDataResult,
      ];
      const failedResult = results.find(result => !result.success);

      if (failedResult) {
        return {
          success: false,
          data: {} as UserStorageData,
          error: failedResult.error,
        };
      }

      return {
        success: true,
        data: {
          language: languageResult.data,
          country: countryResult.data,
          preferences: preferencesResult.data,
          monthlyPromptData: promptDataResult.data,
        },
      };
    } catch (error) {
      console.error('Failed to get user data:', error);
      return {
        success: false,
        data: {} as UserStorageData,
        error: {
          code: 'BULK_READ_ERROR',
          message: 'Failed to retrieve user data',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async setUserData(
    data: Partial<UserStorageData>,
    userId: string = 'anonymous'
  ): Promise<APIResponse<boolean>> {
    try {
      const operations: Promise<APIResponse<boolean>>[] = [];

      if (data.language !== undefined) {
        operations.push(this.setLanguage(data.language));
      }

      if (data.country !== undefined) {
        operations.push(this.setCountry(data.country));
      }

      if (data.preferences !== undefined) {
        operations.push(this.setUserPreferences(data.preferences));
      }

      if (data.monthlyPromptData !== undefined) {
        operations.push(this.setMonthlyPromptData(data.monthlyPromptData));
      }

      const results = await Promise.all(operations);
      const failedResult = results.find(result => !result.success);

      if (failedResult) {
        return {
          success: false,
          data: false,
          error: failedResult.error,
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Failed to set user data:', error);
      return {
        success: false,
        data: false,
        error: {
          code: 'BULK_WRITE_ERROR',
          message: 'Failed to save user data',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  // Cleanup methods
  async clearUserData(
    userId: string = 'anonymous'
  ): Promise<APIResponse<boolean>> {
    try {
      const keys = [
        APP_CONFIG.STORAGE_KEYS.LANGUAGE,
        APP_CONFIG.STORAGE_KEYS.COUNTRY,
        APP_CONFIG.STORAGE_KEYS.USER_PREFERENCES,
        `${APP_CONFIG.STORAGE_KEYS.MONTHLY_PROMPT_DATA}_${userId}`,
      ];

      await AsyncStorage.multiRemove(keys);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Failed to clear user data:', error);
      return {
        success: false,
        data: false,
        error: {
          code: 'CLEAR_ERROR',
          message: 'Failed to clear user data',
          details: { error: (error as Error).message },
        },
      };
    }
  }

  async clearAllData(): Promise<APIResponse<boolean>> {
    try {
      await AsyncStorage.clear();
      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return {
        success: false,
        data: false,
        error: {
          code: 'CLEAR_ALL_ERROR',
          message: 'Failed to clear all data',
          details: { error: (error as Error).message },
        },
      };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
