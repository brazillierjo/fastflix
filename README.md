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

1. **User searches** for movies/TV shows
2. **Frontend** sends request with `deviceId` and `query`
3. **Backend** checks database for Pro subscription status
4. **Backend** processes with AI (Google Gemini) + TMDB enrichment
5. **Backend** returns results (respecting free/Pro limits)

### Subscription Management

```
User purchases Pro
       ↓
RevenueCat (Apple/Google)
       ↓ webhook
Backend Database (Turso)
       ↓ checks on each request
Backend validates Pro status
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
- ✅ Persistent device identity (survives reinstalls)
- ✅ RevenueCat webhook integration for real-time subscription updates
- ✅ Rate limiting and anti-abuse protection
- ✅ Monthly prompt quota for free users
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
