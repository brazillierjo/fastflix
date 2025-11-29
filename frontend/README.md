# FastFlix Mobile App

AI-powered movie and TV show recommendation app for iOS and Android.

## Features

- ✅ AI-powered recommendations using Google Gemini
- ✅ Natural language search ("action movies like Die Hard")
- ✅ **Smart platform filtering** ("shows on Netflix", "movies on Disney+")
- ✅ **Multilingual support** (French, English, Italian, Japanese)
- ✅ **Localized streaming availability** by country
- ✅ TMDB enriched movie/TV data
- ✅ Pro subscription via RevenueCat (Apple/Google in-app purchases)
- ✅ Free tier: 3 searches/month
- ✅ Pro tier: Unlimited searches
- ✅ Persistent device identity (survives reinstalls)

## Tech Stack

- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **State Management:** React Query (TanStack Query)
- **Styling:** NativeWind (TailwindCSS for React Native)
- **Navigation:** Expo Router (file-based)
- **Subscriptions:** RevenueCat SDK
- **Backend:** FastFlix API (https://fastflix-api.vercel.app)

## Architecture

### How It Works

```
User opens app
      ↓
deviceId generated/retrieved (iOS Keychain)
      ↓
RevenueCat configured with deviceId as appUserID
      ↓
User selects language & country (stored locally)
      ↓
User searches for movies (natural language)
      ↓
Frontend sends: { deviceId, query, language, country }
      ↓
Backend checks subscription status in database
      ↓
AI processes query (detects platforms, generates recommendations)
      ↓
TMDB enriches data (localized to user's country & language)
      ↓
Smart filtering applies (if platforms detected)
      ↓
Backend returns results (respecting quota)
```

### Subscription Flow

```
User taps "Upgrade to Pro"
      ↓
RevenueCat presents Apple/Google payment sheet
      ↓
User completes purchase
      ↓
RevenueCat sends webhook to backend
      ↓
Backend updates database: status = "active"
      ↓
Next search automatically gets unlimited access ✅
```

### Device Identity

The `deviceId` is generated once and stored in iOS Keychain (survives app reinstalls):

1. **Generated:** `ffx_device_ABC123` (random, unique)
2. **Stored:** iOS Keychain (permanent storage)
3. **Used for:**
   - Backend API requests (quota tracking)
   - RevenueCat user ID (subscription linking)
   - Analytics and support

**Why it survives reinstalls:**
- iOS Keychain persists across app installations
- Android Keystore persists (if not wiped)
- Ensures users don't lose Pro subscription or quota

## Prerequisites

- Node.js 20+
- npm or pnpm
- Expo CLI
- iOS Simulator (macOS) or Android Emulator
- Xcode (for iOS builds)
- Android Studio (for Android builds)

## Installation

```bash
# Install dependencies
npm install

# iOS: Install pods
cd ios && pod install && cd ..
```

## Environment Variables

Create `.env.local`:

```env
# Backend API
EXPO_PUBLIC_API_URL=https://fastflix-api.vercel.app

# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_revenuecat_key

# Build Configuration
IOS_BUILD_NUMBER=1
ANDROID_VERSION_CODE=1
```

## Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (limited functionality)
npm run web
```

## Scripts

```bash
# Development
npm start             # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run on web browser

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking (Expo uses expo-doctor)

# Build
npm run build:ios     # Build iOS app
npm run build:android # Build Android app
```

## Project Structure

```
frontend/
├── app/                    # Expo Router pages
│   ├── index.tsx          # Home screen (search)
│   ├── profile.tsx        # Profile screen (subscription)
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── SearchForm.tsx
│   ├── MovieResults.tsx
│   ├── SubscriptionModal.tsx
│   └── ...
├── contexts/              # React contexts
│   ├── RevenueCatContext.tsx  # Subscription management
│   └── LanguageContext.tsx    # Multi-language
├── hooks/                 # Custom hooks
│   ├── useBackendMovieSearch.ts  # API search hook
│   └── useAppState.ts            # App state management
├── services/              # Business logic
│   ├── backend-api.service.ts    # Backend API client
│   └── device-identity.service.ts # Device ID management
├── constants/             # App constants
├── utils/                 # Utilities
└── assets/               # Images, fonts, etc.
```

## Key Components

### `useBackendMovieSearch` Hook
Handles all movie/TV searches via backend API. Automatically manages:
- Device ID attachment
- Language/country preferences
- Error handling
- Quota exceeded detection

### `RevenueCatContext`
Manages subscription state:
- Configure RevenueCat with deviceId
- Check Pro status
- Handle purchases
- Restore purchases

### `device-identity.service.ts`
Generates and persists device ID:
- iOS: Keychain storage
- Android: Keystore storage
- Format: `ffx_device_[random]`

## RevenueCat Configuration

### 1. Create Products

In RevenueCat dashboard, create products:
- Monthly: `com.fastflix.pro.monthly`
- Yearly: `com.fastflix.pro.yearly`

### 2. Configure App

Set the API key in `.env.local`:
```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_YOUR_KEY_HERE
```

### 3. Configure Webhook

The webhook is already configured to send events to:
```
https://fastflix-api.vercel.app/api/subscription/webhook
```

**Events handled:**
- INITIAL_PURCHASE
- RENEWAL
- CANCELLATION
- EXPIRATION
- PRODUCT_CHANGE
- BILLING_ISSUE
- TEST

## Building for Production

### iOS

```bash
# Local build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Local build
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

## Testing Subscriptions

### iOS Sandbox

1. Add sandbox tester in App Store Connect
2. Sign out of real Apple ID on device
3. Run app and make purchase
4. Sign in with sandbox account when prompted

### Android Testing

1. Add test account in Google Play Console
2. Upload APK to internal testing track
3. Install and test purchase

### Verify Backend Sync

After purchase, check backend database:
```bash
turso db shell fastflix-db "SELECT * FROM subscriptions WHERE device_id = 'YOUR_DEVICE_ID';"
```

Should show `status = 'active'`.

## Troubleshooting

**"Network request failed":**
- Check API_URL in `.env.local`
- Verify backend is running
- Check device has internet connection

**Subscription not working:**
- Verify RevenueCat API key is correct
- Check RevenueCat webhook is configured
- Send test webhook from RevenueCat dashboard
- Check backend database for subscription entry

**Device ID issues:**
- Clear app data and reinstall
- Check iOS Keychain access permissions
- Verify `expo-secure-store` is installed

**Build errors:**
```bash
# Clear Expo cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules && npm install

# iOS: Reinstall pods
cd ios && pod install && cd ..
```

## License

Proprietary - All rights reserved
