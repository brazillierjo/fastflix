# FastFlix

AI-powered movie and TV show recommendation app with subscription management.

## Project Structure

```
fastflix/
├── frontend/    # React Native mobile app (Expo)
├── backend/     # Next.js API (Vercel)
└── website/     # Marketing website (Next.js)
```

## Quick Start

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

```bash
# Run frontend (mobile app)
npm run dev:frontend

# Run backend (API)
npm run dev:backend

# Run website (marketing site)
npm run dev:website
```

## Architecture

### Frontend → Backend Flow

1. **User authenticates** with Apple Sign In
2. **Backend** issues JWT token (30-day expiration)
3. **User searches** for movies/TV shows
4. **Frontend** sends authenticated request with JWT + query
5. **Backend** validates JWT and checks Pro subscription status
6. **Backend** processes with AI (Google Gemini) + TMDB enrichment
7. **Backend** returns results (respecting subscription limits)

### Authentication & Subscription Flow

```
User Sign In (Apple)
       ↓
Backend validates & creates user
       ↓
JWT token issued (30 days)
       ↓
User purchases Pro → RevenueCat
       ↓ webhook (with userId)
Backend Database (Turso)
       ↓ validates on each search
Backend allows unlimited access
```

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript, React Query
- **Backend**: Next.js 15, TypeScript, Turso (SQLite), Zod
- **Website**: Next.js 15, TypeScript, TailwindCSS
- **AI**: Google Gemini 2.0 Flash Thinking
- **Data**: TMDB API
- **Subscriptions**: RevenueCat
- **Infrastructure**: Vercel (backend), Turso (database)

## Key Features

- ✅ AI-powered movie/TV recommendations
- ✅ Apple Sign In authentication (Google Sign In ready)
- ✅ JWT-based secure authentication (30-day tokens)
- ✅ RevenueCat integration for subscription management
- ✅ Real-time webhook sync for subscription status
- ✅ Automatic token refresh and session management
- ✅ Rate limiting and anti-abuse protection
- ✅ Unlimited searches for Pro subscribers

## Documentation

- [Frontend README](./frontend/README.md) - Mobile app documentation
- [Backend README](./backend/README.md) - API documentation
- [Website README](./website/README.md) - Marketing site documentation
- [Development Guide](./frontend/DEVELOPMENT.md) - Development workflow (French)

## Environment Variables

Each project requires its own `.env.local` file. See individual README files for details.

## Deployment

- **Backend**: Deployed on Vercel at `https://fastflix-api.vercel.app`
- **Website**: Deployed on Vercel
- **Frontend**: iOS App Store / Google Play Store

## License

Proprietary - All rights reserved
