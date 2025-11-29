const fs = require('fs');
const path = require('path');

// Read package.json version
const packageJson = require('../package.json');
const version = packageJson.version;

// Read build numbers from .env or .env.local
function readBuildNumbers() {
  const envPath = path.join(__dirname, '../.env');
  const envLocalPath = path.join(__dirname, '../.env.local');
  const envExamplePath = path.join(__dirname, '../.env.example');

  let envContent = '';

  // Try .env first, then .env.local, then .env.example
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
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
    iosBuildNumber: env.IOS_BUILD_NUMBER || '1',
    androidVersionCode: parseInt(env.ANDROID_VERSION_CODE || '1'),
  };
}

const { iosBuildNumber, androidVersionCode } = readBuildNumbers();

module.exports = {
  version,
  iosBuildNumber,
  androidVersionCode,
};
