# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastFlix is an AI-powered movie and TV show recommendation app with subscription management. It's a monorepo with three packages:
- **frontend/**: React Native mobile app (Expo SDK 52)
- **backend/**: Next.js 16 API deployed on Vercel
- **website/**: Next.js marketing site

## Common Commands

### Installation
```bash
npm run install:all      # Install all dependencies across monorepo
```

### Development
```bash
npm run dev:frontend     # Start Expo dev server (mobile app)
npm run dev:backend      # Start Next.js API server (port 3000)
npm run dev:website      # Start marketing site (with Turbopack)
```

### Frontend Commands
```bash
cd frontend
npm run lint             # ESLint with zero warnings allowed
npm run typecheck        # TypeScript check
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run format           # Prettier formatting
npm run pre-commit       # Run all checks (lint, format, typecheck, test)
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
```

### Backend Commands
```bash
cd backend
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm test                 # Run Jest tests (39 tests)
npm run check-all        # Run typecheck, lint, format:check, and tests
```

### Running a Single Test
```bash
# Backend
cd backend && npm test -- --testPathPattern="auth-endpoints"

# Frontend
cd frontend && npm test -- --testPathPattern="cn.test"
```

### Website Commands
```bash
cd website
npm run lint             # Next.js lint
npm run format:check     # Prettier check
```

## Architecture

### Authentication Flow
1. User authenticates via Apple Sign In or Google Sign In
2. Backend validates token with Apple/Google servers and creates/finds user in Turso DB
3. JWT issued with 30-day expiration
4. Frontend stores JWT in Expo SecureStore (encrypted)
5. All API requests include JWT in Authorization header
6. Backend validates JWT and checks subscription/trial status per request

### Search Flow with User Preferences
1. User configures default filters in profile (country, platforms, availability types)
2. Preferences are stored in backend database (`user_preferences` table)
3. When searching, `useBackendMovieSearch` hook merges user preferences with search params
4. Backend filters results by: platforms (Netflix, Prime, etc.), availability types (subscription/rent/buy)
5. Only matching content is returned

### Backend Structure
- **`/backend/app/api/`**: Next.js API routes
  - `auth/apple/route.ts`: Apple Sign In callback
  - `auth/google/route.ts`: Google Sign In callback
  - `auth/me/route.ts`: Get current user
  - `search/route.ts`: Main AI recommendation endpoint (with platform/availability filtering)
  - `trial/route.ts`: Free trial management
  - `user/preferences/route.ts`: User search preferences CRUD
  - `providers/route.ts`: Available streaming providers by country
  - `subscription/webhook/route.ts`: RevenueCat webhook handler
- **`/backend/lib/`**: Core services
  - `db.ts`: Turso SQLite client and queries
  - `auth.ts`: JWT generation/validation
  - `gemini.ts`: Google Gemini 2.0 Flash integration
  - `tmdb.ts`: TMDB API enrichment
  - `middleware.ts`: Auth middleware wrapper
  - `rate-limiter.ts`: IP-based rate limiting
  - `validation.ts`: Zod schemas
- **`/backend/migrations/`**: SQL migration files

### Frontend Structure
- **`/frontend/app/`**: Expo Router file-based navigation
- **`/frontend/services/`**: API communication
  - `auth.service.ts`: Apple/Google Sign In, JWT handling
  - `backend-api.service.ts`: HTTP client for backend
- **`/frontend/contexts/`**: React Context providers
  - `AuthContext.tsx`: User authentication state
  - `RevenueCatContext.tsx`: Subscription management
  - `LanguageContext.tsx`: i18n support (6 languages)
- **`/frontend/hooks/`**: Custom hooks
  - `useBackendMovieSearch.ts`: Search with auto-applied user preferences
  - `useUserPreferences.ts`: Fetch/update user's default filters
  - `useAppState.ts`: App state management
- **`/frontend/components/`**: Key components
  - `FiltersBottomSheet.tsx`: Configure default filters (country, platforms, availability)
  - `FilterModal.tsx`: Refine search results with filters
- **`/frontend/locales/`**: Translation files (en, fr, de, es, it, ja)

### State Management
- **React Context**: Primary state management (AuthContext, RevenueCatContext, LanguageContext)
- **TanStack React Query**: Data fetching and caching (preferences, providers)

### Database Schema (Turso SQLite)
Key tables:
- `users`: User accounts with auth provider info and trial tracking
- `user_preferences`: User's default search filters (country, platforms, availability types)
- `subscriptions`: RevenueCat subscription status per user
- `prompt_logs`: Analytics for search queries
- `blocked_devices`: Anti-abuse device blocking

### Key Integrations
- **Google Gemini 2.0 Flash**: AI recommendations in `/backend/lib/gemini.ts`
- **TMDB API**: Movie/TV enrichment and streaming providers in `/backend/lib/tmdb.ts`
- **RevenueCat**: Subscription management via webhooks and frontend SDK
- **Apple Sign In**: Authentication via `expo-apple-authentication`
- **Google Sign In**: Authentication via `expo-auth-session`

## Environment Variables

Each package requires its own `.env.local`:
- **Backend**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `TMDB_API_KEY`, `GOOGLE_API_KEY`, `APPLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`
- **Frontend**: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

## Testing

- Frontend uses Jest with React Testing Library
- Backend uses Jest with ts-jest (39 tests)
- Run `npm run test:ci` in frontend for CI-style execution with coverage

## API Testing with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Search with filters (requires JWT)
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"query": "action movies", "includeMovies": true, "platforms": [8], "includeFlatrate": true, "includeBuy": false}'
```
