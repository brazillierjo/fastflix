/**
 * Persistent User Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistentUserService } from '@/services/persistentUser.service';
import { deviceIdentityService } from '@/services/deviceIdentity.service';
import { getCurrentMonth } from '@/utils/deviceIdentifier.utils';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock device identity service
jest.mock('@/services/deviceIdentity.service', () => ({
  deviceIdentityService: {
    getDeviceId: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedDeviceIdentityService = deviceIdentityService as jest.Mocked<typeof deviceIdentityService>;

describe('PersistentUserService', () => {
  const mockDeviceId = 'ffx_device_test123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedDeviceIdentityService.getDeviceId.mockResolvedValue({
      success: true,
      data: mockDeviceId
    });
  });

  describe('getUserData', () => {
    it('should return default data when no data exists', async () => {
      mockedAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await persistentUserService.getUserData(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data.deviceId).toBe(mockDeviceId);
      expect(result.data.monthlyPromptCount).toBe(0);
      expect(result.data.currentMonth).toBe(getCurrentMonth());
    });

    it('should return existing user data', async () => {
      const existingData = {
        deviceId: mockDeviceId,
        monthlyPromptCount: 2,
        currentMonth: getCurrentMonth(),
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingData));

      const result = await persistentUserService.getUserData(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingData);
    });

    it('should reset count for new month', async () => {
      const lastMonth = '2023-12';
      const oldData = {
        deviceId: mockDeviceId,
        monthlyPromptCount: 3,
        currentMonth: lastMonth,
        lastUpdated: '2023-12-15T00:00:00.000Z'
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(oldData));
      mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await persistentUserService.getUserData(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data.monthlyPromptCount).toBe(0);
      expect(result.data.currentMonth).toBe(getCurrentMonth());
      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('incrementPromptCount', () => {
    it('should increment prompt count successfully', async () => {
      const existingData = {
        deviceId: mockDeviceId,
        monthlyPromptCount: 1,
        currentMonth: getCurrentMonth(),
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingData));
      mockedAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await persistentUserService.incrementPromptCount(mockDeviceId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
    });
  });

  describe('migrateFromOldSystem', () => {
    it('should migrate data from old RevenueCat system', async () => {
      const oldUserId = 'oldRevenueCatId123';
      const oldPromptCount = '2';

      // Mock no existing migration
      mockedAsyncStorage.getItem
        .mockResolvedValueOnce(null) // migration key check
        .mockResolvedValueOnce(oldPromptCount); // old prompt count

      mockedAsyncStorage.setItem.mockResolvedValue(undefined);
      mockedAsyncStorage.removeItem.mockResolvedValue(undefined);

      const result = await persistentUserService.migrateFromOldSystem(oldUserId, mockDeviceId);

      expect(result.success).toBe(true);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('fastflix_persistent_user'),
        expect.stringContaining('\"monthlyPromptCount\":2')
      );
    });

    it('should skip migration if already completed', async () => {
      const oldUserId = 'oldRevenueCatId123';

      // Mock existing migration
      mockedAsyncStorage.getItem.mockResolvedValueOnce('2024-01-01T00:00:00.000Z');

      const result = await persistentUserService.migrateFromOldSystem(oldUserId, mockDeviceId);

      expect(result.success).toBe(true);
      expect(mockedAsyncStorage.setItem).not.toHaveBeenCalledWith(
        expect.stringContaining('fastflix_persistent_user'),
        expect.any(String)
      );
    });
  });

  describe('getCurrentUserData', () => {
    it('should get user data for current device', async () => {
      const existingData = {
        deviceId: mockDeviceId,
        monthlyPromptCount: 1,
        currentMonth: getCurrentMonth(),
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };

      mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(existingData));

      const result = await persistentUserService.getCurrentUserData();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingData);
      expect(mockedDeviceIdentityService.getDeviceId).toHaveBeenCalled();
    });

    it('should handle device ID service errors', async () => {
      mockedDeviceIdentityService.getDeviceId.mockResolvedValueOnce({
        success: false,
        data: '',
        error: { code: 'KEYCHAIN_ERROR', message: 'Test error' }
      });

      const result = await persistentUserService.getCurrentUserData();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('KEYCHAIN_ERROR');
    });
  });
});