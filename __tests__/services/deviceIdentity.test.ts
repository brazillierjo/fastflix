/**
 * Device Identity Service Tests
 */

import { deviceIdentityService } from '@/services/deviceIdentity.service';
import { DEVICE_IDENTITY_CONSTANTS } from '@/types/deviceIdentity.types';
import { isValidDeviceId } from '@/utils/deviceIdentifier.utils';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('DeviceIdentityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the singleton's cache for each test
    (deviceIdentityService as any).cachedIdentity = null;
  });

  describe('getDeviceId', () => {
    it('should create a new device ID if none exists', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);
      mockedSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      const result = await deviceIdentityService.getDeviceId();

      expect(result.success).toBe(true);
      expect(result.data).toMatch(/^ffx_device_/);
      expect(isValidDeviceId(result.data)).toBe(true);
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        DEVICE_IDENTITY_CONSTANTS.KEYCHAIN_KEY,
        expect.stringContaining('deviceId')
      );
    });

    it('should return existing device ID from storage', async () => {
      const existingIdentity = {
        deviceId: 'ffx_device_meln7rm_TestDeviceId123',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastAccessed: '2024-01-01T00:00:00.000Z',
        version: '1.0.0'
      };

      mockedSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(existingIdentity));
      mockedSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      const result = await deviceIdentityService.getDeviceId();

      expect(result.success).toBe(true);
      expect(result.data).toBe('ffx_device_meln7rm_TestDeviceId123');
    });

    it('should handle keychain errors gracefully when getting fails but creating succeeds', async () => {
      // First call fails (getDeviceIdentity), then creation succeeds
      mockedSecureStore.getItemAsync.mockRejectedValueOnce(new Error('Keychain error'));
      mockedSecureStore.setItemAsync.mockResolvedValueOnce(undefined);

      const result = await deviceIdentityService.getDeviceId();

      // The service should recover by creating a new ID
      expect(result.success).toBe(true);
      expect(result.data).toMatch(/^ffx_device_/);
    });
  });

  describe('clearDeviceIdentity', () => {
    it('should clear device identity successfully', async () => {
      mockedSecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

      const result = await deviceIdentityService.clearDeviceIdentity();

      expect(result.success).toBe(true);
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(
        DEVICE_IDENTITY_CONSTANTS.KEYCHAIN_KEY
      );
    });
  });

  describe('validateDeviceIdentity', () => {
    it('should validate existing device identity', async () => {
      const validIdentity = {
        deviceId: 'ffx_device_meln7rm_TestDeviceId123',
        createdAt: '2024-01-01T00:00:00.000Z',
        lastAccessed: '2024-01-01T00:00:00.000Z',
        version: '1.0.0'
      };

      mockedSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(validIdentity));

      const result = await deviceIdentityService.validateDeviceIdentity();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for invalid device identity', async () => {
      mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const result = await deviceIdentityService.validateDeviceIdentity();

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });
});