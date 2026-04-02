# FastFlix

AI-powered movie and TV show recommendation app with subscription management.

## Project Structure

```
fastflix/
├── frontend/      # React Native mobile app (Expo SDK 54)
├── backend/       # Hono API (Node.js) — deployed on VPS via Docker
├── website/       # Marketing website (Next.js) — deployed on Vercel
└── backend-next/  # Legacy Next.js API (Vercel) — replaced by backend/, kept for reference
```

## Quick Start

### Installation

```bash
npm run install:all
```

### Development

```bash
npm run dev:frontend    # Expo dev server (mobile app)
npm run dev:backend     # Hono API server (port 3002)
npm run dev:website     # Marketing site (Turbopack)
```

## Architecture

### Frontend → Backend Flow

1. **User authenticates** with Apple Sign In or Google Sign In (login is mandatory)
2. **Backend** validates token with Apple/Google servers, issues JWT (30-day expiration)
3. **User opens For You tab** → frontend calls `/api/feed`
4. **Backend** determines user tier:
   - **Premium + taste profile**: Gemini AI recommendations → TMDB enrichment → streaming providers
   - **Free / no profile / AI failure**: TMDB trending → streaming providers
5. **Backend** always returns complete data (items + providers) — never returns 500

### Authentication & Subscription Flow

```
User Sign In (Apple / Google)
       ↓
Backend validates & creates user
       ↓
JWT token issued (30 days)
       ↓
User purchases subscription → RevenueCat
       ↓ webhook (with userId)
Backend Database (Turso)
       ↓ validates on each request
Backend allows premium access
```

On 401, the frontend only clears the token if it matches the currently stored token (prevents cascade from concurrent requests).

## Tech Stack

- **Frontend**: React Native, Expo SDK 54, TypeScript, React Query
- **Backend**: Hono, Node.js 20, TypeScript, Turso (SQLite), Zod
- **Website**: Next.js, TypeScript, TailwindCSS
- **AI**: Google Gemini 2.0 Flash
- **Data**: TMDB API
- **Subscriptions**: RevenueCat
- **Analytics**: Aptabase (privacy-first)
- **Monitoring**: Sentry (frontend + backend)
- **Infrastructure**: VPS (Hostinger, Docker + Caddy), Turso (database), Vercel (website)

## Key Features

- AI-powered movie/TV recommendations (For You feed)
- Swipe discovery (TikTok-style vertical card browsing)
- Apple Sign In + Google Sign In authentication
- JWT-based secure authentication (30-day tokens)
- RevenueCat subscription management (webhooks + frontend SDK)
- Watchlist with streaming provider tracking
- Taste profile (ratings, favorite genres, favorite actors)
- Rate limiting and anti-abuse protection
- OTA updates via expo-updates

## Deployment

- **Backend**: Auto-deploy via GitHub Actions → Docker Hub → VPS (`fastflix.miotutor.app`)
- **Website**: Auto-deploy on Vercel
- **Frontend**: EAS Build for native builds, expo-updates for OTA

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Full technical documentation (architecture, commands, env vars, deployment)

## License

Proprietary - All rights reserved
