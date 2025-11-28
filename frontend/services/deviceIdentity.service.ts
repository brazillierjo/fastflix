/**
 * Device Identity Service
 *
 * Manages persistent device identity using Keychain storage.
 * This service ensures users maintain the same identity across app reinstalls.
 */

import * as SecureStore from 'expo-secure-store';
import {
  DeviceIdentity,
  DeviceIdentityService,
  DeviceIdentityError,
  DEVICE_IDENTITY_CONSTANTS,
} from '@/types/deviceIdentity.types';
import { APIResponse } from '@/types/api';
import {
  generateDeviceId,
  isValidDeviceId,
  extractTimestampFromDeviceId,
} from '@/utils/deviceIdentifier.utils';

class DeviceIdentityServiceImpl implements DeviceIdentityService {
  private static instance: DeviceIdentityServiceImpl;
  private cachedIdentity: DeviceIdentity | null = null;

  static getInstance(): DeviceIdentityServiceImpl {
    if (!DeviceIdentityServiceImpl.instance) {
      DeviceIdentityServiceImpl.instance = new DeviceIdentityServiceImpl();
    }
    return DeviceIdentityServiceImpl.instance;
  }

  private constructor() {}

  /**
   * Create an API error response
   */
  private createErrorResponse<T>(
    code: DeviceIdentityError['code'],
    message: string,
    defaultValue: T,
    originalError?: Error
  ): APIResponse<T> {
    console.error(
      `DeviceIdentityService Error [${code}]:`,
      message,
      originalError
    );

    return {
      success: false,
      data: defaultValue,
      error: {
        code,
        message,
        details: { originalError: originalError?.message },
      },
    };
  }

  /**
   * Get or create a device ID
   */
  async getDeviceId(): Promise<APIResponse<string>> {
    try {
      // Check cache first
      if (this.cachedIdentity) {
        await this.updateLastAccessed();
        return {
          success: true,
          data: this.cachedIdentity.deviceId,
        };
      }

      // Try to load from keychain
      const identityResult = await this.getDeviceIdentity();

      if (identityResult.success && identityResult.data.deviceId) {
        await this.updateLastAccessed();
        return {
          success: true,
          data: identityResult.data.deviceId,
        };
      }

      // Create new device ID if none exists
      const newDeviceIdResult = await this.createDeviceId();
      if (newDeviceIdResult.success) {
        return {
          success: true,
          data: newDeviceIdResult.data,
        };
      }

      return this.createErrorResponse(
        'GENERATION_ERROR',
        'Failed to get or create device ID',
        '',
        new Error('All device ID methods failed')
      );
    } catch (error) {
      return this.createErrorResponse(
        'GENERATION_ERROR',
        'Failed to get device ID',
        '',
        error as Error
      );
    }
  }

  /**
   * Create a new device ID and store it securely
   */
  async createDeviceId(): Promise<APIResponse<string>> {
    try {
      const deviceId = generateDeviceId();

      if (!isValidDeviceId(deviceId)) {
        return this.createErrorResponse(
          'GENERATION_ERROR',
          'Generated device ID failed validation',
          ''
        );
      }

      const now = new Date().toISOString();
      const identity: DeviceIdentity = {
        deviceId,
        createdAt: now,
        lastAccessed: now,
        version: DEVICE_IDENTITY_CONSTANTS.VERSION,
      };

      // Store in keychain
      await SecureStore.setItemAsync(
        DEVICE_IDENTITY_CONSTANTS.KEYCHAIN_KEY,
        JSON.stringify(identity)
      );

      // Update cache
      this.cachedIdentity = identity;

      console.log('Created new device ID:', deviceId);

      return {
        success: true,
        data: deviceId,
      };
    } catch (error) {
      return this.createErrorResponse(
        'KEYCHAIN_ERROR',
        'Failed to create and store device ID',
        '',
        error as Error
      );
    }
  }

  /**
   * Get complete device identity from keychain
   */
  async getDeviceIdentity(): Promise<APIResponse<DeviceIdentity>> {
    try {
      // Check cache first
      if (this.cachedIdentity) {
        return {
          success: true,
          data: this.cachedIdentity,
        };
      }

      const storedData = await SecureStore.getItemAsync(
        DEVICE_IDENTITY_CONSTANTS.KEYCHAIN_KEY
      );

      if (!storedData) {
        return {
          success: false,
          data: {
            deviceId: '',
            createdAt: '',
            lastAccessed: '',
            version: DEVICE_IDENTITY_CONSTANTS.VERSION,
          },
          error: {
            code: 'KEYCHAIN_ERROR',
            message: 'No device identity found in keychain',
          },
        };
      }

      const identity: DeviceIdentity = JSON.parse(storedData);

      // Validate the stored identity
      if (!identity.deviceId || !isValidDeviceId(identity.deviceId)) {
        await this.clearDeviceIdentity(); // Clear invalid data
        return this.createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid device identity in storage',
          {
            deviceId: '',
            createdAt: '',
            lastAccessed: '',
            version: DEVICE_IDENTITY_CONSTANTS.VERSION,
          }
        );
      }

      // Update cache
      this.cachedIdentity = identity;

      return {
        success: true,
        data: identity,
      };
    } catch (error) {
      return this.createErrorResponse(
        'KEYCHAIN_ERROR',
        'Failed to retrieve device identity',
        {
          deviceId: '',
          createdAt: '',
          lastAccessed: '',
          version: DEVICE_IDENTITY_CONSTANTS.VERSION,
        },
        error as Error
      );
    }
  }

  /**
   * Update last accessed timestamp
   */
  async updateLastAccessed(): Promise<APIResponse<boolean>> {
    try {
      const identityResult = await this.getDeviceIdentity();

      if (!identityResult.success) {
        return {
          success: false,
          data: false,
          error: identityResult.error,
        };
      }

      const updatedIdentity: DeviceIdentity = {
        ...identityResult.data,
        lastAccessed: new Date().toISOString(),
      };

      await SecureStore.setItemAsync(
        DEVICE_IDENTITY_CONSTANTS.KEYCHAIN_KEY,
        JSON.stringify(updatedIdentity)
      );

      // Update cache
      this.cachedIdentity = updatedIdentity;

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return this.createErrorResponse(
        'KEYCHAIN_ERROR',
        'Failed to update last accessed timestamp',
        false,
        error as Error
      );
    }
  }

  /**
   * Clear device identity (for testing or reset purposes)
   */
  async clearDeviceIdentity(): Promise<APIResponse<boolean>> {
    try {
      await SecureStore.deleteItemAsync(DEVICE_IDENTITY_CONSTANTS.KEYCHAIN_KEY);
      this.cachedIdentity = null;

      console.log('Device identity cleared');

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return this.createErrorResponse(
        'KEYCHAIN_ERROR',
        'Failed to clear device identity',
        false,
        error as Error
      );
    }
  }

  /**
   * Get device creation date (useful for analytics)
   */
  async getDeviceCreationDate(): Promise<APIResponse<Date | null>> {
    try {
      const identityResult = await this.getDeviceIdentity();

      if (!identityResult.success) {
        return {
          success: false,
          data: null,
          error: identityResult.error,
        };
      }

      let creationDate: Date | null = null;

      // Try to get from stored data first
      if (identityResult.data.createdAt) {
        creationDate = new Date(identityResult.data.createdAt);
      } else {
        // Fallback to extracting from device ID
        creationDate = extractTimestampFromDeviceId(
          identityResult.data.deviceId
        );
      }

      return {
        success: true,
        data: creationDate,
      };
    } catch (error) {
      return this.createErrorResponse(
        'VALIDATION_ERROR',
        'Failed to get device creation date',
        null,
        error as Error
      );
    }
  }

  /**
   * Check if device identity is valid and accessible
   */
  async validateDeviceIdentity(): Promise<APIResponse<boolean>> {
    try {
      const identityResult = await this.getDeviceIdentity();

      if (!identityResult.success) {
        return {
          success: true, // Method succeeded, but identity is not valid
          data: false,
        };
      }

      const isValid = isValidDeviceId(identityResult.data.deviceId);

      return {
        success: true,
        data: isValid,
      };
    } catch (error) {
      return this.createErrorResponse(
        'VALIDATION_ERROR',
        'Failed to validate device identity',
        false,
        error as Error
      );
    }
  }
}

// Export singleton instance
export const deviceIdentityService = DeviceIdentityServiceImpl.getInstance();
