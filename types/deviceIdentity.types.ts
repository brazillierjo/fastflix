/**
 * Device Identity Types
 * 
 * Types for managing persistent device identity across app reinstalls
 */

import { APIResponse } from './api';

export interface DeviceIdentity {
  deviceId: string;
  createdAt: string;
  lastAccessed: string;
  version: string;
}

export interface PersistentUserData {
  deviceId: string;
  monthlyPromptCount: number;
  currentMonth: string;
  lastUpdated: string;
  revenueCatUserId?: string;
}

export interface DeviceIdentityService {
  getDeviceId(): Promise<APIResponse<string>>;
  createDeviceId(): Promise<APIResponse<string>>;
  getDeviceIdentity(): Promise<APIResponse<DeviceIdentity>>;
  updateLastAccessed(): Promise<APIResponse<boolean>>;
  clearDeviceIdentity(): Promise<APIResponse<boolean>>;
}

export interface PersistentUserService {
  getUserData(deviceId: string): Promise<APIResponse<PersistentUserData>>;
  setUserData(data: PersistentUserData): Promise<APIResponse<boolean>>;
  incrementPromptCount(deviceId: string): Promise<APIResponse<number>>;
  resetMonthlyCount(deviceId: string): Promise<APIResponse<boolean>>;
  migrateFromOldSystem(oldUserId: string, newDeviceId: string): Promise<APIResponse<boolean>>;
}

export interface DeviceIdentityError {
  code: 'KEYCHAIN_ERROR' | 'GENERATION_ERROR' | 'MIGRATION_ERROR' | 'VALIDATION_ERROR';
  message: string;
  originalError?: Error;
}

export const DEVICE_IDENTITY_CONSTANTS = {
  KEYCHAIN_KEY: 'fastflix_device_identity',
  STORAGE_KEY_PREFIX: 'fastflix_persistent_user',
  VERSION: '1.0.0',
  ID_PREFIX: 'ffx_device',
  ID_LENGTH: 32,
} as const;