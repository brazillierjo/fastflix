# FastFlix Backend API

AI-powered movie and TV show recommendation API with subscription management.

## Production

**Live API:** https://fastflix-api.vercel.app

## API Endpoints

### `GET /api/health`

Health check endpoint. Returns API status, version, and service availability.

### `POST /api/search`

Search for movies/TV shows using AI recommendations.

**Request:**

```json
{
  "deviceId": "string",
  "query": "action movies with time travel",
  "includeMovies": true,
  "includeTvShows": true,
  "platform": "ios",
  "appVersion": "1.0.0",
  "language": "fr-FR",
  "country": "FR"
}
```

**Response:**

```json
{
  "recommendations": [...],
  "streamingProviders": {...},
  "conversationalResponse": "Here are some great action movies...",
  "totalResults": 5
}
```

### `POST /api/subscription/webhook`

RevenueCat webhook for subscription events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.).

**Handled Events:**

- `INITIAL_PURCHASE` - New subscription
- `RENEWAL` - Subscription renewed
- `CANCELLATION` - Subscription cancelled
- `EXPIRATION` - Subscription expired
- `PRODUCT_CHANGE` - Plan upgrade/downgrade
- `BILLING_ISSUE` - Payment problem
- `TEST` - Test event from RevenueCat dashboard

## Architecture

### How It Works

```
Mobile App (RevenueCat App User ID)
           ↓ search request (query, language, country)
Backend API (checks database)
           ↓ looks up App User ID from JWT
Database: subscriptions table
           ↓ finds status: "active"
Backend: ✅ Active subscription → allow search
         ❌ No subscription → HTTP 402 (Payment Required)
           ↓
AI Processing (Google Gemini)
           ↓ extracts platforms + generates recommendations
TMDB Enrichment
           ↓ fetch movie data + streaming providers
Smart Platform Filtering
           ↓ filter by detected platforms (if any)
Return Results ✅
```

### Smart Platform Filtering

When users mention streaming platforms in their queries (e.g., "movies on Netflix", "shows available on Disney+"), the system:

1. **AI Detection:** Gemini extracts platform names from the query
2. **Validation:** Validates detected platforms against a known list
3. **Intelligent Filtering:** Applies a 30% retention threshold
   - If filtering would remove >70% of results → keeps original results
   - If filtering retains ≥30% of results → applies the filter
4. **Always Returns Results:** Users never get empty result sets

### Subscription Flow

```
User purchases Pro in app
         ↓
RevenueCat processes payment
         ↓
RevenueCat sends webhook
         ↓ POST /api/subscription/webhook
Backend saves to database
         ↓ INSERT/UPDATE subscriptions
Database updated: status = "active"
         ↓
Next search request checks database
         ↓ hasActiveSubscription(deviceId)
Backend grants unlimited access ✅
```

### User Identity & Subscription Sync

The RevenueCat App User ID connects subscriptions across all services:

1. **Frontend** initializes RevenueCat (generates anonymous App User ID)
2. **Frontend** retrieves App User ID: `customerInfo.originalAppUserId`
3. **RevenueCat** sends webhooks with `app_user_id` on subscription events
4. **Backend** receives webhook and stores subscription with `device_id = app_user_id`
5. **Frontend** sends search requests with App User ID as `deviceId`
6. **Backend** validates subscription: `SELECT * FROM subscriptions WHERE device_id = ?`

**Result:** RevenueCat App User ID is the single source of truth for subscriptions ✅

**Note:** In the next version, this will be replaced with proper user authentication (Sign in with Apple/Google).

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Runtime:** Node.js 20+ / Vercel Serverless
- **Database:** Turso (libSQL - distributed SQLite)
- **AI:** Google Gemini 2.0 Flash (with platform detection & multilingual support)
- **Movie Data:** TMDB API v3 (with streaming provider integration)
- **Validation:** Zod schemas
- **Testing:** Jest + ts-jest (36 tests)
- **Language:** TypeScript 5 (strict mode)

## Key Features

### 🌍 Multilingual Support

- Supports French, English, Italian, Japanese
- Language-aware AI responses (matches user's app language)
- Localized content from TMDB

### 🎯 Smart Platform Filtering

- AI-powered platform detection from natural language queries
- Intelligent filtering with 30% retention threshold
- Validates against known streaming platforms
- Never returns empty results

### 🔒 Privacy & Security

- Rate limiting (IP + device-based)
- Anti-abuse detection system
- Input validation with Zod
- No personal data storage beyond device ID

## Local Development

### Prerequisites

- Node.js 20+
- npm/pnpm
- Turso CLI (optional, for database management)

### Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Create `.env.local`:**

```env
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_token

# AI & Data
GOOGLE_API_KEY=your_google_ai_key
TMDB_API_KEY=your_tmdb_key
TMDB_BASE_URL=https://api.themoviedb.org/3

# Configuration
NODE_ENV=development
```

3. **Run development server:**

```bash
npm run dev
```

Open http://localhost:3000 to access the API.

## Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Testing
npm test                 # Run all tests
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch mode

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint errors
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# All Checks
npm run check-all        # Run type-check + lint + format + test
```

## Database Schema

### `subscriptions`

Stores Pro subscription status (updated by RevenueCat webhook).

```sql
device_id TEXT PRIMARY KEY
revenuecat_user_id TEXT
status TEXT (active|expired|cancelled|billing_issue)
expires_at TEXT (ISO date)
product_id TEXT
created_at TEXT
last_updated TEXT
```

### `prompt_logs`

Analytics and usage tracking.

```sql
id INTEGER PRIMARY KEY
device_id TEXT
query TEXT
results_count INTEGER
created_at TEXT
response_time_ms INTEGER
```

### `blocked_devices`

Anti-abuse system for blocking malicious devices.

```sql
device_id TEXT PRIMARY KEY
reason TEXT
blocked_at TEXT
blocked_until TEXT
```

## Security Features

- ✅ **Rate Limiting:** IP-based (60 req/min) + device-based (20 req/min)
- ✅ **Anti-Abuse Detection:** Automatic blocking of suspicious patterns
- ✅ **Input Validation:** Zod schemas on all endpoints
- ✅ **CORS:** Configured for mobile app only
- ✅ **Secrets:** Environment variables (never exposed to frontend)
- ✅ **Database Security:** Turso with authentication tokens

## Testing

**Coverage:**

- ✅ 36 tests passing
- ✅ 65-100% coverage for core services
- ✅ Unit tests for all services (db, gemini, tmdb, prompt-counter, anti-abuse)
- ✅ API endpoint tests

**Test Files:**

- `__tests__/db.test.ts` - Database operations
- `__tests__/gemini.test.ts` - AI service
- `__tests__/tmdb.test.ts` - TMDB integration
- `__tests__/prompt-counter.test.ts` - Quota management
- `__tests__/anti-abuse.test.ts` - Abuse detection

## Deployment

**Vercel (Automatic):**

- Push to `main` branch → auto-deploy to production
- Pull requests → preview deployments

**Manual Deploy:**

```bash
vercel --prod
```

## Environment Variables (Production)

Set these in Vercel dashboard:

| Variable                    | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `TURSO_DATABASE_URL`        | Turso database connection URL                                    |
| `TURSO_AUTH_TOKEN`          | Turso authentication token                                       |
| `GOOGLE_API_KEY`            | Google AI API key (Gemini)                                       |
| `TMDB_API_KEY`              | TMDB API key                                                     |
| `TMDB_BASE_URL`             | `https://api.themoviedb.org/3`                                   |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat webhook secret (optional, for signature verification) |

## Troubleshooting

**Database connection errors:**

```bash
# Test Turso connection
turso db shell your-database "SELECT 1;"
```

**Webhook not working:**

1. Check RevenueCat webhook configuration
2. Verify webhook URL: `https://fastflix-api.vercel.app/api/subscription/webhook`
3. Check Vercel logs for errors
4. Send test event from RevenueCat dashboard

**Tests failing:**

```bash
# Clear cache and re-run
rm -rf .next coverage
npm test
```

## License

Proprietary - All rights reserved
