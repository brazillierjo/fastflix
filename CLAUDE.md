# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastFlix is an AI-powered movie and TV show recommendation app with subscription management. It's a monorepo with three packages:
- **frontend/**: React Native mobile app (Expo)
- **backend/**: Next.js API deployed on Vercel
- **website/**: Next.js marketing site

## Common Commands

### Installation
```bash
npm run install:all      # Install all dependencies across monorepo
```

### Development
```bash
npm run dev:frontend     # Start Expo dev server (mobile app)
npm run dev:backend      # Start Next.js API server
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
npm test                 # Run Jest tests
npm run check-all        # Run typecheck, lint, format:check, and tests
```

### Website Commands
```bash
cd website
npm run lint             # Next.js lint
npm run format:check     # Prettier check
```

## Architecture

### Authentication Flow
1. User authenticates via Apple Sign In (Google ready but unused)
2. Backend validates token and creates/finds user in Turso DB
3. JWT issued with 30-day expiration
4. Frontend stores JWT in Expo SecureStore
5. All API requests include JWT in Authorization header
6. Backend validates JWT and checks subscription status per request

### Backend Structure
- **`/backend/app/api/`**: Next.js API routes
  - `auth/apple/route.ts`: Apple Sign In callback
  - `auth/me/route.ts`: Get current user
  - `search/route.ts`: Main AI recommendation endpoint
  - `trial/route.ts`: Free trial management
  - `subscription/webhook/route.ts`: RevenueCat webhook handler
- **`/backend/lib/`**: Core services
  - `db.ts`: Turso SQLite client and queries
  - `auth.ts`: JWT generation/validation
  - `gemini.ts`: Google Gemini 2.0 Flash integration
  - `tmdb.ts`: TMDB API enrichment
  - `middleware.ts`: Auth middleware wrapper
  - `rate-limiter.ts`: Per-device rate limiting
  - `validation.ts`: Zod schemas
- **`/backend/migrations/`**: SQL migration files

### Frontend Structure
- **`/frontend/app/`**: Expo Router file-based navigation
- **`/frontend/services/`**: API communication
  - `auth.service.ts`: Apple Sign In, JWT handling
  - `backend-api.service.ts`: HTTP client for backend
- **`/frontend/contexts/`**: React Context providers
  - `AuthContext.tsx`: User authentication state
  - `RevenueCatContext.tsx`: Subscription management
  - `LanguageContext.tsx`: i18n support
- **`/frontend/hooks/`**: Custom hooks including `useBackendMovieSearch()`
- **`/frontend/locales/`**: Translation files

### State Management
- **React Context**: Primary state management (AuthContext, RevenueCatContext, LanguageContext)
- **TanStack React Query**: Data fetching and caching
- Zustand and Redux are installed but not actively used

### Database Schema (Turso SQLite)
Key tables:
- `users`: User accounts with auth provider info and trial tracking
- `subscriptions`: RevenueCat subscription status per device
- `prompt_logs`: Analytics for search queries
- `blocked_devices`: Anti-abuse device blocking

### Key Integrations
- **Google Gemini 2.0 Flash**: AI recommendations in `/backend/lib/gemini.ts`
- **TMDB API**: Movie/TV enrichment in `/backend/lib/tmdb.ts`
- **RevenueCat**: Subscription management via webhooks and frontend SDK
- **Apple Sign In**: Authentication via `expo-apple-authentication`

## Environment Variables

Each package requires its own `.env.local`:
- **Backend**: Turso DB credentials, TMDB API key, Gemini API key, JWT secret, RevenueCat webhook secret
- **Frontend**: Backend API URL, RevenueCat public key

## Testing

- Frontend uses Jest with React Testing Library
- Backend uses Jest with ts-jest
- Run `npm run test:ci` in frontend for CI-style execution with coverage
