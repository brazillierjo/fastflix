#!/usr/bin/env node
/* eslint-env node */

/**
 * Version Bump Script for FastFlix
 *
 * This script helps manage version increments and build numbers
 * Usage:
 *   npm run version:patch  # 0.0.1 -> 0.0.2
 *   npm run version:minor  # 0.0.1 -> 0.1.0
 *   npm run version:major  # 0.0.1 -> 1.0.0
 *   npm run build:ios     # Increment iOS build number
 *   npm run build:android # Increment Android version code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];

// Sync app.json version with package.json version and update android versionCode
function syncAppJson(newVersion) {
  const appJsonPath = path.join(__dirname, '../app.json');
  if (!fs.existsSync(appJsonPath)) return;

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const oldVersion = appJson.expo.version;
  appJson.expo.version = newVersion;

  // Increment Android versionCode on every version bump
  if (appJson.expo.android && appJson.expo.android.versionCode !== undefined) {
    const oldCode = appJson.expo.android.versionCode;
    appJson.expo.android.versionCode = oldCode + 1;
    console.log(`   🤖 Android versionCode: ${oldCode} -> ${oldCode + 1}`);
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log(`   📱 app.json version: ${oldVersion} -> ${newVersion}`);
}

// Read current .env file or create default values
function readEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }

  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value !== undefined) {
      env[key.trim()] = value.trim();
    }
  });

  return {
    iosBuildNumber: parseInt(env.IOS_BUILD_NUMBER || '1'),
    androidVersionCode: parseInt(env.ANDROID_VERSION_CODE || '1'),
    envContent,
    envPath,
  };
}

// Write updated .env file
function writeEnvFile(envPath, envContent, iosBuildNumber, androidVersionCode) {
  let newContent = envContent;

  // Update or add iOS build number
  if (newContent.includes('IOS_BUILD_NUMBER=')) {
    newContent = newContent.replace(
      /IOS_BUILD_NUMBER=\d+/,
      `IOS_BUILD_NUMBER=${iosBuildNumber}`
    );
  } else {
    newContent += `\nIOS_BUILD_NUMBER=${iosBuildNumber}`;
  }

  // Update or add Android version code
  if (newContent.includes('ANDROID_VERSION_CODE=')) {
    newContent = newContent.replace(
      /ANDROID_VERSION_CODE=\d+/,
      `ANDROID_VERSION_CODE=${androidVersionCode}`
    );
  } else {
    newContent += `\nANDROID_VERSION_CODE=${androidVersionCode}`;
  }

  fs.writeFileSync(envPath, newContent);
}

switch (command) {
  case 'patch':
  case 'minor':
  case 'major':
    try {
      console.log(`🔄 Bumping ${command} version...`);
      execSync(`npm version ${command} --no-git-tag-version`, { stdio: 'inherit' });
      const newPkg = require('../package.json');
      syncAppJson(newPkg.version);
      console.log('✅ Version updated successfully!');
    } catch (error) {
      console.error('❌ Error updating version:', error.message);
      process.exit(1);
    }
    break;

  case 'set':
    try {
      const targetVersion = args[1];
      if (!targetVersion || !/^\d+\.\d+\.\d+$/.test(targetVersion)) {
        console.error('❌ Usage: node version-bump.js set <x.y.z>');
        process.exit(1);
      }
      console.log(`🔄 Setting version to ${targetVersion}...`);
      execSync(`npm version ${targetVersion} --no-git-tag-version`, { stdio: 'inherit' });
      syncAppJson(targetVersion);
      console.log('✅ Version set successfully!');
    } catch (error) {
      console.error('❌ Error setting version:', error.message);
      process.exit(1);
    }
    break;

  case 'build-ios':
    try {
      const { iosBuildNumber, androidVersionCode, envContent, envPath } =
        readEnvFile();
      const newIosBuildNumber = iosBuildNumber + 1;

      writeEnvFile(envPath, envContent, newIosBuildNumber, androidVersionCode);

      console.log(
        `🍎 iOS build number updated: ${iosBuildNumber} -> ${newIosBuildNumber}`
      );
    } catch (error) {
      console.error('❌ Error updating iOS build number:', error.message);
      process.exit(1);
    }
    break;

  case 'build-android':
    try {
      const { iosBuildNumber, androidVersionCode, envContent, envPath } =
        readEnvFile();
      const newAndroidVersionCode = androidVersionCode + 1;

      writeEnvFile(envPath, envContent, iosBuildNumber, newAndroidVersionCode);

      console.log(
        `🤖 Android version code updated: ${androidVersionCode} -> ${newAndroidVersionCode}`
      );
    } catch (error) {
      console.error('❌ Error updating Android version code:', error.message);
      process.exit(1);
    }
    break;

  case 'build-both':
    try {
      const { iosBuildNumber, androidVersionCode, envContent, envPath } =
        readEnvFile();
      const newIosBuildNumber = iosBuildNumber + 1;
      const newAndroidVersionCode = androidVersionCode + 1;

      writeEnvFile(
        envPath,
        envContent,
        newIosBuildNumber,
        newAndroidVersionCode
      );

      console.log(`📱 Build numbers updated:`);
      console.log(`   🍎 iOS: ${iosBuildNumber} -> ${newIosBuildNumber}`);
      console.log(
        `   🤖 Android: ${androidVersionCode} -> ${newAndroidVersionCode}`
      );
    } catch (error) {
      console.error('❌ Error updating build numbers:', error.message);
      process.exit(1);
    }
    break;

  case 'status':
    try {
      const packageJson = require('../package.json');
      const { iosBuildNumber, androidVersionCode } = readEnvFile();

      console.log('📊 Current Version Status:');
      console.log(`   📦 Version: ${packageJson.version}`);
      console.log(`   🍎 iOS Build: ${iosBuildNumber}`);
      console.log(`   🤖 Android Code: ${androidVersionCode}`);
    } catch (error) {
      console.error('❌ Error reading version status:', error.message);
      process.exit(1);
    }
    break;

  default:
    console.log('📋 FastFlix Version Management');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/version-bump.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  patch        Increment patch version (0.0.1 -> 0.0.2)');
    console.log('  minor        Increment minor version (0.0.1 -> 0.1.0)');
    console.log('  major        Increment major version (0.0.1 -> 1.0.0)');
    console.log('  set <x.y.z>  Set specific version (e.g., set 3.0.0)');
    console.log('  build-ios    Increment iOS build number');
    console.log('  build-android Increment Android version code');
    console.log('  build-both   Increment both build numbers');
    console.log('  status       Show current version status');
    console.log('');
    console.log('Examples:');
    console.log('  npm run version:patch');
    console.log('  npm run build:ios');
    console.log('  npm run version:status');
}
