# Versioning System - FastFlix

## Overview

This document describes the versioning system implemented for the FastFlix application, compatible with App Store Connect and Google Play Console.

## Version Structure

### Semantic Versioning
We use the `MAJOR.MINOR.PATCH` format:
- **MAJOR**: Breaking changes incompatible with previous versions
- **MINOR**: New backward-compatible features
- **PATCH**: Backward-compatible bug fixes

### Current Version
- **Version**: `0.0.1`
- **iOS Build**: `1`
- **Android Version Code**: `1`

## Centralized Version Management

### Single Source of Truth
To avoid maintaining version numbers in multiple files, we recommend using a centralized approach:

#### Option 1: Environment Variables (Recommended)
Create a `.env` file with version information:
```env
APP_VERSION=0.0.1
IOS_BUILD_NUMBER=1
ANDROID_VERSION_CODE=1
```

#### Option 2: Version Configuration File
Create a `version.json` file:
```json
{
  "version": "0.0.1",
  "iosBuildNumber": "1",
  "androidVersionCode": 1
}
```

#### Option 3: Use package.json as Single Source
Use only `package.json` version and generate others programmatically:
```javascript
// In app.config.js
const packageJson = require('./package.json');

export default {
  expo: {
    version: packageJson.version,
    // ...
  }
};
```

## Configuration Files

### Current Implementation (Multiple Files)

#### 1. package.json
```json
{
  "version": "0.0.1"
}
```

#### 2. app.json
```json
{
  "expo": {
    "version": "0.0.1",
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

#### 3. app.config.js
Same configuration as app.json but in JavaScript format.

### Recommended Implementation (Centralized)

#### 1. Create version.js utility
```javascript
// utils/version.js
const packageJson = require('../package.json');

module.exports = {
  version: packageJson.version,
  iosBuildNumber: process.env.IOS_BUILD_NUMBER || '1',
  androidVersionCode: parseInt(process.env.ANDROID_VERSION_CODE || '1'),
};
```

#### 2. Update app.config.js
```javascript
const { version, iosBuildNumber, androidVersionCode } = require('./utils/version');

export default {
  expo: {
    version,
    ios: {
      buildNumber: iosBuildNumber,
    },
    android: {
      versionCode: androidVersionCode,
    },
    // ...
  },
};
```

## Version Display

The version is displayed dynamically in the profile page using the `utils/appVersion.ts` utility:

```typescript
import { getAppVersion } from '@/utils/appVersion';

// In component
<Text>{getAppVersion()}</Text>
```

## Update Process

### Current Process (Multiple Files)
1. **Update version** in 3 files:
   - `package.json`
   - `app.json`
   - `app.config.js`

2. **Increment build numbers**:
   - iOS: `buildNumber` (string)
   - Android: `versionCode` (number)

### Recommended Process (Centralized)
1. **Update version** in `package.json` only
2. **Update build numbers** in `.env` file:
   ```env
   IOS_BUILD_NUMBER=2
   ANDROID_VERSION_CODE=2
   ```
3. **Version progression examples**:
   ```
   0.0.1 (build 1) → 0.0.2 (build 2) → 0.1.0 (build 3) → 1.0.0 (build 4)
   ```

## App Store Connect Compatibility

### iOS
- `version` corresponds to "Version Number" in App Store Connect
- `buildNumber` corresponds to "Build Number" in App Store Connect
- Each submission must have a unique `buildNumber`

### Android
- `version` corresponds to "Version name" in Google Play Console
- `versionCode` corresponds to "Version code" in Google Play Console
- Each submission must have a higher `versionCode` than the previous

## Best Practices

1. **Use centralized versioning** to avoid synchronization issues
2. **Increment build/versionCode** for each store submission
3. **Use Git tags** to mark versions:
   ```bash
   git tag -a v0.0.1 -m "Version 0.0.1"
   git push origin v0.0.1
   ```
4. **Document changes** in a CHANGELOG.md file
5. **Test version display** in the app before publishing
6. **Use environment variables** for build-specific configurations

## Automation

To automate the process:
- Use npm scripts to increment versions automatically
- Integrate with CI/CD tools like GitHub Actions
- Use EAS Build from Expo for automatic build management
- Create scripts to sync versions across files if needed

## Useful Commands

```bash
# Check current version
npm version

# Auto-increment (updates package.json)
npm version patch  # 0.0.1 → 0.0.2
npm version minor  # 0.0.1 → 0.1.0
npm version major  # 0.0.1 → 1.0.0

# Build with EAS
eas build --platform ios
eas build --platform android

# Update environment variables
echo "IOS_BUILD_NUMBER=2" >> .env
echo "ANDROID_VERSION_CODE=2" >> .env
```

## Migration to Centralized Versioning

To migrate from the current multi-file approach to centralized versioning:

1. Create a `utils/version.js` file
2. Update `app.config.js` to use the centralized version
3. Remove version from `app.json` (use only `app.config.js`)
4. Create `.env` file for build numbers
5. Test the configuration
6. Update deployment scripts if necessary

This approach ensures version consistency and reduces maintenance overhead.