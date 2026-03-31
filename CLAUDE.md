# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastFlix is an AI-powered movie and TV show recommendation app with subscription management. It's a monorepo with three active packages:
- **frontend/**: React Native mobile app (Expo SDK 54)
- **backend/**: Hono API (Node.js) — deployed on VPS `217.65.144.15` via Docker (port 3002)
- **website/**: Next.js marketing site — deployed on Vercel

Legacy:
- **backend-next/**: Legacy Next.js API (Vercel) — replaced by backend/, kept for reference

## Common Commands

### Installation
```bash
npm run install:all      # Install all dependencies across monorepo
```

### Development
```bash
npm run dev:frontend     # Start Expo dev server (mobile app)
npm run dev:backend      # Start Hono API server (port 3002)
npm run dev:website      # Start marketing site (with Turbopack)
```

### Backend Commands (Hono)
```bash
cd backend
npm run dev              # Start dev server with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled app (node dist/index.js)
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm test                 # Run Jest tests (ESM)
npm run check-all        # Run typecheck, lint, format:check, and tests
```

### Frontend Commands
```bash
cd frontend
npm run lint             # ESLint with zero warnings allowed
npm run typecheck        # TypeScript check
npm test                 # Run Jest tests
npm run format           # Prettier formatting
npm run pre-commit       # Run all checks (lint, format, typecheck, test)
npm run ios              # Run on iOS simulator
```

### Website Commands
```bash
cd website
npm run lint             # Next.js lint
npm run format:check     # Prettier check
```

## Architecture

### Backend (Hono on VPS)
- **Runtime**: Node.js 20 + Hono framework
- **Server**: `@hono/node-server` on port 3002
- **Database**: Turso (libSQL) — remote SQLite
- **Deployment**: Docker (multi-stage node:20-alpine) → Docker Hub → VPS
- **Reverse Proxy**: Caddy (TLS auto) at `fastflix.miotutor.app`
- **VPS**: Hostinger `217.65.144.15`, shared with Mio API (port 3001)

### Backend Structure
```
backend/src/
├── index.ts                 # Entry point (Hono + middleware + routes)
├── middleware/
│   ├── auth.ts              # JWT auth middleware (requireAuth, optionalAuth)
│   └── rate-limit.ts        # In-memory rate limiter (IP + user based)
├── lib/
│   ├── db.ts                # Turso SQLite client (singleton)
│   ├── auth.ts              # JWT, Apple/Google token verification
│   ├── gemini.ts            # Google Gemini 2.0 Flash AI
│   ├── tmdb.ts              # TMDB API (search, details, providers, trending)
│   ├── revenuecat.ts        # RevenueCat subscription check
│   ├── sentry.ts            # Sentry error monitoring
│   ├── types.ts             # Shared TypeScript types
│   ├── validation.ts        # Zod schemas
│   └── webhook-verification.ts
└── routes/
    ├── health.ts            # GET /api/health
    ├── auth.ts              # POST /api/auth/apple, /google, GET /me
    ├── search.ts            # POST /api/search (AI-powered)
    ├── search-history.ts    # GET /api/search/history
    ├── discovery.ts         # GET /api/home, /daily-pick, /trending, /for-you, /new-releases
    ├── details.ts           # GET /api/details, /similar/:id, /person/:id, /tmdb-search
    ├── watchlist.ts         # CRUD /api/watchlist + check + refresh-providers
    ├── user.ts              # /api/user/preferences, taste-profile, stats, delete
    ├── providers.ts         # GET /api/providers, /providers/public
    ├── webhook.ts           # POST /api/subscription/webhook (RevenueCat)
    ├── quotas.ts            # GET /api/quotas
    └── notifications.ts     # POST /api/notifications/register
```

### Authentication Flow
1. User authenticates via Apple Sign In or Google Sign In
2. Backend validates token with Apple/Google servers and creates/finds user in Turso DB
3. JWT issued with 30-day expiration
4. Frontend stores JWT in Expo SecureStore (encrypted)
5. All API requests include JWT in Authorization header
6. Backend validates JWT and checks subscription status per request

### Frontend Structure
- **`/frontend/app/`**: Expo Router file-based navigation
- **`/frontend/services/`**: API communication (`backend-api.service.ts`)
- **`/frontend/contexts/`**: React Context providers (Auth, RevenueCat, Language)
- **`/frontend/hooks/`**: Custom hooks (search, watchlist, ratings, preferences)
- **`/frontend/components/`**: UI components with sub-component organization:
  - `movie-detail/`: HeroSection, CastSection, StreamingSection, etc.
  - `subscription/`: PlanCard, FeaturesList
  - `settings/`: SettingsRow, AccountModal, etc.

### Key Integrations
- **Google Gemini 2.0 Flash**: AI recommendations
- **TMDB API**: Movie/TV enrichment and streaming providers
- **RevenueCat**: Subscription management (webhooks + frontend SDK)
- **Aptabase**: Privacy-first analytics (app key: A-EU-9072861721)
- **Sentry**: Error monitoring (frontend + backend)
- **Apple/Google Sign In**: Authentication

### VPS Infrastructure
```
VPS 217.65.144.15 (/opt/mio/)
├── docker-compose.yml
│   ├── caddy (ports 80, 443) — reverse proxy
│   ├── mio-api-hono (port 3001) — Mio API
│   └── fastflix-api (port 3002) — FastFlix API
├── Caddyfile
│   ├── api.miotutor.app → :3001
│   └── fastflix.miotutor.app → :3002
├── api.env (Mio secrets)
└── fastflix-api.env (FastFlix secrets)
```

## Environment Variables

- **Backend** (`.env.local`): `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `TMDB_API_KEY`, `GOOGLE_API_KEY`, `APPLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `REVENUECAT_*`, `SENTRY_DSN`, `PORT`
- **Frontend**: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

## API Testing with curl

```bash
# Health check
curl http://localhost:3002/api/health

# Search with filters (requires JWT)
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"query": "action movies", "includeMovies": true, "platforms": [8], "includeFlatrate": true, "includeBuy": false}'
```

## Deployment

### Backend (VPS)
- **Auto**: GitHub Actions (`.github/workflows/deploy-fastflix-api.yml`) on push to `main` modifying `backend/`
- **Manual**: `docker compose pull fastflix-api && docker compose up -d fastflix-api` on VPS
- **Pipeline**: Build Docker → Push to Docker Hub → SSH to VPS (via SSH key) → pull + restart

### Website (Vercel)
- Auto-deploy on push to `main`

### Frontend (OTA)
- `expo-updates` for over-the-air updates
- EAS Build for native builds

### GitHub Actions Secrets Required

| Secret | Description | Where to find |
|--------|-------------|---------------|
| `DOCKER_USERNAME` | `bzrjoh` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub PAT | Docker Hub → Account Settings → Security → Access Tokens |
| `VPS_HOST` | `217.65.144.15` | Hostinger VPS IP |
| `VPS_USERNAME` | `root` | VPS SSH user |
| `VPS_SSH_KEY` | SSH private key (ed25519) | `cat ~/.ssh/id_ed25519_macbook_pro_m4` on Mac |

**Note**: VPS has `PasswordAuthentication no` — only SSH key auth works. The same key is used for both FastFlix and Mio Tutor deploys.
