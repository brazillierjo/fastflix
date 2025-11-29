# FastFlix Backend API

AI-powered movie and TV show recommendations backend service for FastFlix mobile app.

## 🚀 Production

**Live API:** https://fastflix-api.vercel.app

## 📋 API Endpoints

### Health Check
```
GET /api/health
```
Returns API status and version.

### Check Prompt Limit
```
POST /api/check-limit
Content-Type: application/json

{
  "deviceId": "string"
}
```
Check if a device can make a prompt (quota verification).

### Search Movies/TV Shows
```
POST /api/search
Content-Type: application/json

{
  "deviceId": "string",
  "query": "string",
  "includeMovies": boolean,
  "includeTvShows": boolean,
  "platform": "ios" | "android",
  "appVersion": "string",
  "language": "string (optional)",
  "country": "string (optional)"
}
```
Search for movies and TV shows using AI + TMDB enrichment.

### RevenueCat Webhook
```
POST /api/subscription/webhook
```
Handles subscription events from RevenueCat.

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Runtime:** Node.js / Vercel Serverless
- **Database:** Turso (libSQL)
- **AI:** Google Gemini 2.0 Flash
- **Movie Data:** TMDB API
- **Validation:** Zod
- **Testing:** Jest + ts-jest
- **Language:** TypeScript (strict mode)

## 🔧 Local Development

### Prerequisites

- Node.js 20+
- npm or pnpm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```env
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
GOOGLE_API_KEY=your_google_ai_key
TMDB_API_KEY=your_tmdb_key
TMDB_BASE_URL=https://api.themoviedb.org/3
MAX_FREE_PROMPTS=3
NODE_ENV=development
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the API landing page.

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode:
```bash
npm run test:watch
```

**Test Results:**
- ✅ 36 tests passing
- ✅ Coverage: 65-100% for tested files

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - TypeScript type checking
- `npm run check-all` - Run all checks (type-check + lint + format + test)

## 🔒 Security Features

- **Rate Limiting:** IP and device-based rate limiting
- **Anti-Abuse:** Automatic detection and blocking of suspicious behavior
- **Input Validation:** Zod schemas for all endpoints
- **CORS:** Configured for mobile app access
- **Environment Variables:** Secure configuration via Vercel

## 📊 Database Schema

### Tables

- `user_prompts` - Track monthly prompt usage per device
- `subscriptions` - Store subscription status (RevenueCat sync)
- `prompt_logs` - Analytics and usage tracking
- `blocked_devices` - Anti-abuse blocking system

## 🚢 Deployment

The backend is automatically deployed to Vercel on every push to `main` branch.

### Manual Deployment

```bash
vercel --prod
```

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. For issues or questions, please contact the maintainer.
