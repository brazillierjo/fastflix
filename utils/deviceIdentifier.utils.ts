/**
 * Device Identifier Utilities
 * 
 * Utilities for generating and validating device identifiers
 */

import { DEVICE_IDENTITY_CONSTANTS } from '@/types/deviceIdentity.types';

/**
 * Generate a cryptographically secure random string
 */
export const generateSecureRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (modern environments)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};

/**
 * Generate a unique device identifier
 */
export const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = generateSecureRandomString(DEVICE_IDENTITY_CONSTANTS.ID_LENGTH - timestamp.length - DEVICE_IDENTITY_CONSTANTS.ID_PREFIX.length - 1);
  
  return `${DEVICE_IDENTITY_CONSTANTS.ID_PREFIX}_${timestamp}_${randomPart}`;
};

/**
 * Validate device identifier format
 */
export const isValidDeviceId = (deviceId: string): boolean => {
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }
  
  // Check if it starts with our prefix
  if (!deviceId.startsWith(DEVICE_IDENTITY_CONSTANTS.ID_PREFIX)) {
    return false;
  }
  
  // Check minimum length
  if (deviceId.length < 20) {
    return false;
  }
  
  // Check for valid characters (alphanumeric + underscore)
  const validPattern = /^[a-zA-Z0-9_]+$/;
  return validPattern.test(deviceId);
};

/**
 * Extract timestamp from device ID (if available)
 */
export const extractTimestampFromDeviceId = (deviceId: string): Date | null => {
  try {
    if (!isValidDeviceId(deviceId)) {
      return null;
    }
    
    const parts = deviceId.split('_');
    if (parts.length < 3) {
      return null;
    }
    
    const timestamp = parseInt(parts[2], 36);
    if (isNaN(timestamp)) {
      return null;
    }
    
    return new Date(timestamp);
  } catch (error) {
    console.warn('Failed to extract timestamp from device ID:', error);
    return null;
  }
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Check if we're in a new month compared to stored data
 */
export const isNewMonth = (storedMonth: string): boolean => {
  const currentMonth = getCurrentMonth();
  return currentMonth !== storedMonth;
};

/**
 * Generate a migration key for old RevenueCat user IDs
 */
export const generateMigrationKey = (oldUserId: string): string => {
  return `migration_${oldUserId}`;
};

/**
 * Sanitize user ID for storage
 */
export const sanitizeUserId = (userId: string): string => {
  // Remove any characters that might cause issues in storage keys
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
};