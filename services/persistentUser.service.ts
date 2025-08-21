/**
 * Persistent User Service
 * 
 * Manages user data persistence using device identity as the stable key.
 * Handles prompt counting, migration from old system, and monthly resets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PersistentUserData, 
  PersistentUserService, 
  DEVICE_IDENTITY_CONSTANTS 
} from '@/types/deviceIdentity.types';
import { APIResponse } from '@/types/api';
import { deviceIdentityService } from './deviceIdentity.service';
import {
  getCurrentMonth,
  isNewMonth,
  generateMigrationKey,
  sanitizeUserId
} from '@/utils/deviceIdentifier.utils';

class PersistentUserServiceImpl implements PersistentUserService {
  private static instance: PersistentUserServiceImpl;

  static getInstance(): PersistentUserServiceImpl {
    if (!PersistentUserServiceImpl.instance) {
      PersistentUserServiceImpl.instance = new PersistentUserServiceImpl();
    }
    return PersistentUserServiceImpl.instance;
  }

  private constructor() {}

  /**
   * Generate storage key for user data
   */
  private getStorageKey(deviceId: string): string {
    return `${DEVICE_IDENTITY_CONSTANTS.STORAGE_KEY_PREFIX}_${sanitizeUserId(deviceId)}`;
  }

  /**
   * Create default user data
   */
  private createDefaultUserData(deviceId: string): PersistentUserData {
    return {
      deviceId,
      monthlyPromptCount: 0,
      currentMonth: getCurrentMonth(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Create an error response
   */
  private createErrorResponse<T>(
    code: string,
    message: string,
    defaultValue: T,
    originalError?: Error
  ): APIResponse<T> {
    console.error(`PersistentUserService Error [${code}]:`, message, originalError);
    
    return {
      success: false,
      data: defaultValue,
      error: {
        code,
        message,
        details: { originalError: originalError?.message }
      }
    };
  }

  /**
   * Get user data for a device
   */
  async getUserData(deviceId: string): Promise<APIResponse<PersistentUserData>> {
    try {
      const storageKey = this.getStorageKey(deviceId);
      const storedData = await AsyncStorage.getItem(storageKey);

      if (!storedData) {
        // No data found, return default
        const defaultData = this.createDefaultUserData(deviceId);
        return {
          success: true,
          data: defaultData
        };
      }

      const userData: PersistentUserData = JSON.parse(storedData);

      // Check if we need to reset for new month
      if (isNewMonth(userData.currentMonth)) {
        const resetData: PersistentUserData = {
          ...userData,
          monthlyPromptCount: 0,
          currentMonth: getCurrentMonth(),
          lastUpdated: new Date().toISOString()
        };

        // Save the reset data
        await this.setUserData(resetData);
        
        console.log(`Reset monthly count for device ${deviceId} (new month: ${getCurrentMonth()})`);
        
        return {
          success: true,
          data: resetData
        };
      }

      return {
        success: true,
        data: userData
      };

    } catch (error) {
      return this.createErrorResponse(
        'STORAGE_READ_ERROR',
        `Failed to get user data for device ${deviceId}`,
        this.createDefaultUserData(deviceId),
        error as Error
      );
    }
  }

  /**
   * Set user data for a device
   */
  async setUserData(data: PersistentUserData): Promise<APIResponse<boolean>> {
    try {
      const updatedData: PersistentUserData = {
        ...data,
        lastUpdated: new Date().toISOString()
      };

      const storageKey = this.getStorageKey(data.deviceId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedData));

      return {
        success: true,
        data: true
      };

    } catch (error) {
      return this.createErrorResponse(
        'STORAGE_WRITE_ERROR',
        `Failed to set user data for device ${data.deviceId}`,
        false,
        error as Error
      );
    }
  }

  /**
   * Increment prompt count for a device
   */
  async incrementPromptCount(deviceId: string): Promise<APIResponse<number>> {
    try {
      const userDataResult = await this.getUserData(deviceId);
      
      if (!userDataResult.success) {
        return {
          success: false,
          data: 0,
          error: userDataResult.error
        };
      }

      const newCount = userDataResult.data.monthlyPromptCount + 1;
      const updatedData: PersistentUserData = {
        ...userDataResult.data,
        monthlyPromptCount: newCount
      };

      const setResult = await this.setUserData(updatedData);
      
      if (!setResult.success) {
        return {
          success: false,
          data: userDataResult.data.monthlyPromptCount,
          error: setResult.error
        };
      }

      console.log(`Incremented prompt count to ${newCount} for device ${deviceId}`);

      return {
        success: true,
        data: newCount
      };

    } catch (error) {
      return this.createErrorResponse(
        'INCREMENT_ERROR',
        `Failed to increment prompt count for device ${deviceId}`,
        0,
        error as Error
      );
    }
  }

  /**
   * Reset monthly count for a device
   */
  async resetMonthlyCount(deviceId: string): Promise<APIResponse<boolean>> {
    try {
      const userDataResult = await this.getUserData(deviceId);
      
      if (!userDataResult.success) {
        return {
          success: false,
          data: false,
          error: userDataResult.error
        };
      }

      const resetData: PersistentUserData = {
        ...userDataResult.data,
        monthlyPromptCount: 0,
        currentMonth: getCurrentMonth()
      };

      const setResult = await this.setUserData(resetData);
      
      if (!setResult.success) {
        return {
          success: false,
          data: false,
          error: setResult.error
        };
      }

      console.log(`Reset monthly count for device ${deviceId}`);

      return {
        success: true,
        data: true
      };

    } catch (error) {
      return this.createErrorResponse(
        'RESET_ERROR',
        `Failed to reset monthly count for device ${deviceId}`,
        false,
        error as Error
      );
    }
  }

  /**
   * Migrate data from old RevenueCat system to new device-based system
   */
  async migrateFromOldSystem(oldUserId: string, newDeviceId: string): Promise<APIResponse<boolean>> {
    try {
      console.log(`Starting migration from ${oldUserId} to ${newDeviceId}`);

      // Check if we already migrated this user
      const migrationKey = generateMigrationKey(oldUserId);
      const alreadyMigrated = await AsyncStorage.getItem(migrationKey);
      
      if (alreadyMigrated) {
        console.log(`Migration already completed for ${oldUserId}`);
        return {
          success: true,
          data: true
        };
      }

      // Try to find old data using the legacy format
      const currentMonth = getCurrentMonth();
      const oldStorageKey = `fastflix_prompts_${oldUserId}_${currentMonth}`;
      const oldPromptCount = await AsyncStorage.getItem(oldStorageKey);

      let promptCount = 0;
      if (oldPromptCount) {
        promptCount = parseInt(oldPromptCount, 10) || 0;
        console.log(`Found ${promptCount} prompts to migrate from ${oldUserId}`);
      }

      // Create new user data with migrated prompt count
      const newUserData: PersistentUserData = {
        deviceId: newDeviceId,
        monthlyPromptCount: promptCount,
        currentMonth,
        lastUpdated: new Date().toISOString(),
        revenueCatUserId: oldUserId // Keep reference for debugging
      };

      // Save new data
      const setResult = await this.setUserData(newUserData);
      
      if (!setResult.success) {
        return {
          success: false,
          data: false,
          error: setResult.error
        };
      }

      // Mark migration as completed
      await AsyncStorage.setItem(migrationKey, new Date().toISOString());

      // Clean up old data (optional, for storage space)
      try {
        await AsyncStorage.removeItem(oldStorageKey);
        console.log(`Cleaned up old storage key: ${oldStorageKey}`);
      } catch (cleanupError) {
        console.warn('Failed to clean up old storage:', cleanupError);
        // Don't fail the migration for cleanup errors
      }

      console.log(`Successfully migrated ${promptCount} prompts from ${oldUserId} to ${newDeviceId}`);

      return {
        success: true,
        data: true
      };

    } catch (error) {
      return this.createErrorResponse(
        'MIGRATION_ERROR',
        `Failed to migrate from ${oldUserId} to ${newDeviceId}`,
        false,
        error as Error
      );
    }
  }

  /**
   * Get user data using device identity service
   */
  async getCurrentUserData(): Promise<APIResponse<PersistentUserData>> {
    try {
      const deviceIdResult = await deviceIdentityService.getDeviceId();
      
      if (!deviceIdResult.success) {
        return {
          success: false,
          data: this.createDefaultUserData(''),
          error: deviceIdResult.error
        };
      }

      return await this.getUserData(deviceIdResult.data);

    } catch (error) {
      return this.createErrorResponse(
        'DEVICE_ID_ERROR',
        'Failed to get current user data',
        this.createDefaultUserData(''),
        error as Error
      );
    }
  }

  /**
   * Increment prompt count for current device
   */
  async incrementCurrentUserPromptCount(): Promise<APIResponse<number>> {
    try {
      const deviceIdResult = await deviceIdentityService.getDeviceId();
      
      if (!deviceIdResult.success) {
        return {
          success: false,
          data: 0,
          error: deviceIdResult.error
        };
      }

      return await this.incrementPromptCount(deviceIdResult.data);

    } catch (error) {
      return this.createErrorResponse(
        'DEVICE_ID_ERROR',
        'Failed to increment current user prompt count',
        0,
        error as Error
      );
    }
  }

  /**
   * Clear all user data (for testing/reset purposes)
   */
  async clearAllUserData(): Promise<APIResponse<boolean>> {
    try {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter keys that match our pattern
      const userDataKeys = allKeys.filter(key => 
        key.startsWith(DEVICE_IDENTITY_CONSTANTS.STORAGE_KEY_PREFIX)
      );

      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log(`Cleared ${userDataKeys.length} user data entries`);
      }

      return {
        success: true,
        data: true
      };

    } catch (error) {
      return this.createErrorResponse(
        'CLEAR_ERROR',
        'Failed to clear all user data',
        false,
        error as Error
      );
    }
  }
}

// Export singleton instance
export const persistentUserService = PersistentUserServiceImpl.getInstance();