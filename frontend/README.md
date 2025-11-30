# FastFlix Mobile App

AI-powered movie and TV show recommendation app for iOS and Android.

## Production

**iOS App Store:** [Download on App Store](https://apps.apple.com/app/id6739968186)
**Backend API:** https://fastflix-api.vercel.app

## Features

- ✅ **Apple Sign In authentication** (Google Sign In ready)
- ✅ **JWT-based secure authentication** (30-day token expiration)
- ✅ **Automatic token management** (refresh on app resume, auto-logout on expiry)
- ✅ AI-powered recommendations using Google Gemini 2.0 Flash
- ✅ Natural language search ("action movies like Die Hard")
- ✅ **Smart platform filtering** ("shows on Netflix", "movies on Disney+")
- ✅ **Multilingual support** (French, English, Italian, Japanese)
- ✅ **Localized streaming availability** by country
- ✅ TMDB enriched movie/TV data
- ✅ Pro subscription via RevenueCat (Apple/Google in-app purchases)
- ✅ Pro tier: Unlimited searches

## Tech Stack

- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **State Management:** React Query (TanStack Query)
- **Authentication:** Apple Sign In, JWT tokens (expo-auth-session, expo-crypto)
- **Secure Storage:** expo-secure-store (encrypted token storage)
- **Styling:** NativeWind (TailwindCSS for React Native)
- **Navigation:** Expo Router (file-based)
- **Subscriptions:** RevenueCat SDK
- **Backend:** FastFlix API (https://fastflix-api.vercel.app)
- **Testing:** Jest + React Native Testing Library (4 tests)

## Architecture

### Authentication Flow

```
User opens app
      ↓
AuthContext checks for stored JWT token
      ↓
If no token → Show login screen
If token exists → Validate with GET /api/auth/me
      ↓
User taps "Sign in with Apple"
      ↓ iOS handles Apple Sign In
Frontend receives identityToken
      ↓ POST /api/auth/apple
Backend validates with Apple servers
      ↓ creates/updates user in database
Backend generates JWT token (30-day expiration)
      ↓ token payload: { userId, email, iat, exp }
Frontend stores token in SecureStore (encrypted)
      ↓ stores user data in SecureStore
RevenueCat configured with userId
      ↓ Purchases.logIn(userId)
User authenticated ✅
```

### Search Flow

```
User searches for movies (natural language)
      ↓
Frontend sends authenticated request
      ↓ Authorization: Bearer <JWT_TOKEN>
      ↓ { query, language, country, includeMovies, includeTvShows }
Backend validates JWT token
      ↓ extracts userId from token payload
Backend checks subscription status
      ↓ queries subscriptions WHERE user_id = userId
✅ Active subscription → Unlimited access
❌ No subscription → 402 Payment Required
      ↓
AI processes query (detects platforms, generates recommendations)
      ↓
TMDB enriches data (localized to user's country & language)
      ↓
Smart filtering applies (if platforms detected)
      ↓
Backend returns results
```

### Subscription Flow

```
User taps "Upgrade to Pro"
      ↓
RevenueCat presents Apple/Google payment sheet
      ↓ already logged in with userId
User completes purchase
      ↓
RevenueCat links purchase to userId
      ↓ via Purchases.logIn(userId)
RevenueCat sends webhook to backend
      ↓ POST /api/subscription/webhook
      ↓ { app_user_id: userId, event_type: "INITIAL_PURCHASE" }
Backend updates database
      ↓ INSERT/UPDATE subscriptions (user_id, status = "active")
Next search automatically gets unlimited access ✅
```

### Token Management

**Storage:**

- JWT token stored in `SecureStore` (encrypted, key: `fastflix_auth_token`)
- User data stored in `SecureStore` (key: `fastflix_user_data`)

**Expiration Handling:**

- Tokens expire after 30 days
- Backend returns `401 Unauthorized` when token is expired/invalid
- Frontend automatically clears auth data on 401 responses
- User is redirected to login screen

**Automatic Refresh:**

- `AppState` listener monitors app foreground/background
- When app returns to foreground → calls `GET /api/auth/me`
- Validates token is still valid
- Updates user data in context
- On 401 → auto-logout and clear auth data

**Why AppState Monitoring:**

- User might leave app for hours/days
- Token might expire while app is backgrounded
- Prevents failed searches due to expired tokens
- Ensures smooth UX by detecting expiry early

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
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_revenuecat_key

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

# Testing
npm test              # Run all tests (4 tests)
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking

# Build
npm run build:ios     # Build iOS app
npm run build:android # Build Android app
```

## Project Structure

```
frontend/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   └── login.tsx      # Apple Sign In screen
│   ├── (tabs)/            # Main app tabs (requires auth)
│   │   ├── index.tsx      # Home screen (search)
│   │   ├── profile.tsx    # Profile screen (subscription)
│   │   └── _layout.tsx    # Tab layout
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 screen
├── components/            # Reusable components
│   ├── SearchForm.tsx
│   ├── MovieResults.tsx
│   ├── SubscriptionModal.tsx
│   └── ...
├── contexts/              # React contexts
│   ├── AuthContext.tsx         # JWT authentication state
│   ├── RevenueCatContext.tsx   # Subscription management
│   └── LanguageContext.tsx     # Multi-language
├── hooks/                 # Custom hooks
│   ├── useBackendMovieSearch.ts  # API search hook
│   └── useAppState.ts            # App state management
├── services/              # Business logic
│   └── backend-api.service.ts    # Backend API client (auth + search)
├── constants/             # App constants
├── utils/                 # Utilities
└── assets/               # Images, fonts, etc.
```

## Key Components

### `AuthContext`

Manages authentication state throughout the app:

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identityToken: string, userData?: AppleUserData) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Features:**

- Stores JWT token and user data in SecureStore
- Auto-validates token on app mount (calls `/api/auth/me`)
- Auto-refreshes user data on app foreground (AppState monitoring)
- Handles 401 responses by clearing auth and redirecting to login
- Configures RevenueCat with userId on successful login

**Usage:**

```typescript
const { user, signIn, signOut } = useAuth();

// Check if user is authenticated
if (!user) {
  // Show login screen
}
```

### `useBackendMovieSearch` Hook

Handles all movie/TV searches via backend API. Automatically manages:

- JWT token attachment (Authorization: Bearer header)
- Language/country preferences
- Error handling
- 401 detection (triggers auto-logout)
- 402 detection (no active subscription)

**Usage:**

```typescript
const { mutate: search, isPending, data } = useBackendMovieSearch();

search({
  query: 'action movies',
  includeMovies: true,
  includeTvShows: false,
  language: 'en-US',
  country: 'US',
});
```

### `RevenueCatContext`

Manages subscription state:

- Configure RevenueCat with userId (via `Purchases.logIn(userId)`)
- Check Pro status
- Handle purchases
- Restore purchases
- Automatic sync with backend via webhook

**Usage:**

```typescript
const { customerInfo, isLoading } = useRevenueCat();

const isPro = customerInfo?.entitlements.active['pro'] != null;
```

### `backend-api.service.ts`

Singleton service for all backend API communication:

**Authentication Methods:**

- `signInWithApple(data)` - POST /api/auth/apple
- `getCurrentUser()` - GET /api/auth/me

**Search Methods:**

- `search(params)` - POST /api/search (requires JWT)

**Features:**

- Automatic JWT token injection from SecureStore
- Auto-clears auth data on 401 responses
- 30-second request timeout
- Comprehensive error handling

## Authentication Implementation

### Apple Sign In Integration

**Setup:**

1. Enable Apple Sign In in Xcode capabilities
2. Configure Service ID in Apple Developer Portal
3. Set `APPLE_CLIENT_ID` in backend `.env.local`

**Flow:**

```typescript
// Login screen (app/(auth)/login.tsx)
const { signIn } = useAuth();

const handleAppleSignIn = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    await signIn(credential.identityToken, {
      email: credential.email,
      name: {
        firstName: credential.fullName?.givenName,
        lastName: credential.fullName?.familyName,
      },
    });
  } catch (error) {
    console.error('Apple Sign In failed:', error);
  }
};
```

**Backend Validation:**

- Backend receives `identityToken`
- Validates with Apple's servers
- Creates/updates user in database
- Returns JWT token + user data

### JWT Token Storage

**SecureStore Keys:**

- `fastflix_auth_token` - JWT token (encrypted)
- `fastflix_user_data` - User object (encrypted)

**Security:**

- iOS: Stored in Keychain (persists across app reinstalls)
- Android: Stored in Keystore (encrypted)
- Never exposed in logs or analytics

### Automatic Logout Handling

**Triggers:**

- 401 response from backend (token expired/invalid)
- Manual sign out by user

**Actions:**

```typescript
// backend-api.service.ts
if (response.status === 401) {
  console.warn(
    '⚠️ 401 Unauthorized - Token expired or invalid. Clearing auth data.'
  );
  await SecureStore.deleteItemAsync('fastflix_auth_token');
  await SecureStore.deleteItemAsync('fastflix_user_data');
  // AuthContext detects missing token and redirects to login
}
```

### AppState Monitoring

**Purpose:** Detect token expiry when app returns to foreground

**Implementation:**

```typescript
// AuthContext.tsx
useEffect(() => {
  const subscription = AppState.addEventListener(
    'change',
    async nextAppState => {
      if (nextAppState === 'active' && user) {
        // App returned to foreground - refresh user data
        const response = await backendAPIService.getCurrentUser();

        if (response.success) {
          // Token still valid, update user data
          setUser(response.data.user);
        } else {
          // Token expired (401) - already cleared by backend-api.service
          // Just update state to trigger re-render
          setUser(null);
        }
      }
    }
  );

  return () => subscription.remove();
}, [user]);
```

## RevenueCat Configuration

### 1. Create Products

In RevenueCat dashboard, create entitlement `pro` with products:

- Monthly: `fastflix_pro_monthly_499`
- Yearly: `fastflix_pro_yearly_2999`

### 2. Configure App

Set the API key in `.env.local`:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_YOUR_KEY_HERE
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_YOUR_KEY_HERE
```

### 3. Link User to RevenueCat

**CRITICAL:** Must link userId to RevenueCat for subscription tracking:

```typescript
// AuthContext.tsx - after successful sign in
await Purchases.logIn(user.id);
```

This ensures:

- Webhook events include correct `app_user_id`
- Backend can link subscription to correct user
- Subscription syncs across devices for same user

### 4. Configure Webhook

The webhook is already configured to send events to:

```
https://fastflix-api.vercel.app/api/subscription/webhook
```

**Events handled:**

- `INITIAL_PURCHASE` - New subscription
- `RENEWAL` - Subscription renewed
- `CANCELLATION` - Subscription cancelled
- `EXPIRATION` - Subscription expired
- `PRODUCT_CHANGE` - Plan upgrade/downgrade
- `BILLING_ISSUE` - Payment problem
- `TEST` - Test event from RevenueCat dashboard

## Testing

**Coverage:**

- ✅ **4 tests passing**
- ✅ Authentication context tests
- ✅ Backend API service tests
- ✅ Component integration tests

**Test Files:**

- `__tests__/AuthContext.test.tsx` - Auth state management
- `__tests__/backend-api.test.ts` - API client tests
- `__tests__/SearchForm.test.tsx` - Component tests

**Run Tests:**

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## Building for Production

### iOS

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Pre-flight Checklist:**

- ✅ Apple Sign In capability enabled in Xcode
- ✅ Service ID configured in Apple Developer Portal
- ✅ RevenueCat API key configured
- ✅ Backend API URL points to production
- ✅ Privacy manifest includes required keys

### Android

```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

**Pre-flight Checklist:**

- ✅ Google Sign In configured (optional)
- ✅ RevenueCat API key configured
- ✅ Backend API URL points to production
- ✅ Play Store listing complete

## Testing Authentication

### Local Development

1. **Start backend API:**

```bash
cd ../backend && npm run dev
```

2. **Update `.env.local`:**

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

3. **Test Apple Sign In:**

- iOS Simulator will show Apple Sign In sheet
- Use your Apple ID to test
- Backend will validate token and create user

4. **Verify JWT Token:**

```bash
# Check SecureStore (iOS Simulator)
# Token should be stored at: fastflix_auth_token
# User data at: fastflix_user_data
```

### Testing Token Expiry

**Method 1: Manual Expiry**

1. Sign in successfully
2. In backend, change `JWT_SECRET` environment variable
3. Try to search - should get 401 and auto-logout

**Method 2: Time Travel**

1. Sign in successfully
2. Wait 30 days (or modify JWT expiration in backend)
3. App will auto-detect expired token on foreground

### Testing Subscriptions

**iOS Sandbox:**

1. Add sandbox tester in App Store Connect
2. Sign out of real Apple ID on device
3. Run app and sign in with Apple
4. Make purchase - sign in with sandbox account when prompted
5. Verify backend database shows subscription

**Verify Backend Sync:**

```bash
turso db shell fastflix-db "SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';"
```

Should show `status = 'active'`.

## Troubleshooting

### Authentication Errors

**"Authentication failed" when signing in:**

- Check `APPLE_CLIENT_ID` is correct in backend
- Verify Apple Service ID is configured correctly
- Check backend logs for Apple token validation errors

**"Unauthorized" when searching:**

- Token might be expired (check date)
- Backend `JWT_SECRET` might have changed
- Token might be corrupted in SecureStore
- Solution: Sign out and sign in again

**Auto-logout happening unexpectedly:**

- Check backend logs for 401 responses
- Verify JWT_SECRET hasn't changed
- Check token expiration (30 days)

### Subscription Not Working

**Purchase completes but still not Pro:**

1. Check RevenueCat dashboard for transaction
2. Verify `Purchases.logIn(userId)` was called after sign in
3. Check backend logs for webhook events
4. Send test webhook from RevenueCat dashboard
5. Verify database: `SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';`

**Webhook not reaching backend:**

- Verify webhook URL: `https://fastflix-api.vercel.app/api/subscription/webhook`
- Check webhook signature is configured (optional)
- Send test event from RevenueCat dashboard
- Check Vercel logs for errors

### Network Errors

**"Network request failed":**

- Check `EXPO_PUBLIC_API_URL` in `.env.local`
- Verify backend is running
- Check device has internet connection
- Try health check: `GET /api/health`

**Timeout errors:**

- Backend might be slow (AI processing)
- Increase timeout in `backend-api.service.ts` (default: 30s)
- Check backend logs for errors

### Build Errors

```bash
# Clear Expo cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules && npm install

# iOS: Reinstall pods
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Android: Clean build
cd android && ./gradlew clean && cd ..
```

## Security Best Practices

- ✅ **JWT tokens stored in SecureStore** (encrypted, never exposed)
- ✅ **Automatic token cleanup on 401** (prevents invalid token usage)
- ✅ **HTTPS only** (all API requests)
- ✅ **No hardcoded secrets** (environment variables)
- ✅ **Token expiration** (30 days, auto-refresh on app resume)
- ✅ **RevenueCat user linking** (prevents subscription theft)
- ✅ **Secure token validation** (backend verifies every request)

## Privacy & Data

**Data Stored Locally:**

- JWT token (encrypted in SecureStore)
- User data (email, name, auth provider)
- Language & country preferences

**Data Sent to Backend:**

- JWT token (Authorization header)
- Search queries
- Language & country preferences

**Data Never Stored:**

- Passwords (Apple Sign In only)
- Credit card info (handled by Apple/Google)
- Search history (queries not persisted)

## License

Proprietary - All rights reserved
