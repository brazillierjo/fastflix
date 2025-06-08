const packageJson = require('../package.json');

/**
 * Centralized version management for the FastFlix application
 * This file serves as the single source of truth for version information
 */
module.exports = {
  // Main version from package.json
  version: packageJson.version,
  
  // iOS build number (string format required by App Store)
  iosBuildNumber: process.env.IOS_BUILD_NUMBER || '1',
  
  // Android version code (integer format required by Play Store)
  androidVersionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1'),
  
  // Helper function to get full version info
  getVersionInfo: () => {
    const version = packageJson.version;
    const iosBuild = process.env.IOS_BUILD_NUMBER || '1';
    const androidCode = parseInt(process.env.ANDROID_VERSION_CODE || '1');
    
    return {
      version,
      iosBuildNumber: iosBuild,
      androidVersionCode: androidCode,
      fullVersionIOS: `${version} (${iosBuild})`,
      fullVersionAndroid: `${version} (${androidCode})`,
    };
  },
};