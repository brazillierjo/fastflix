# FastFlix Backend API

AI-powered movie and TV show recommendation API with JWT authentication and subscription management.

## Production

**Live API:** https://fastflix-api.vercel.app

## API Endpoints

### Authentication

#### `POST /api/auth/apple`

Authenticate with Apple Sign In and receive a JWT token.

**Request:**

```json
{
  "identityToken": "apple_identity_token_here",
  "user": {
    "email": "user@example.com",
    "name": "John Doe" // optional
  }
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "auth_provider": "apple"
  },
  "token": "jwt_token_here"
}
```

#### `POST /api/auth/google`

Authenticate with Google Sign In and receive a JWT token.

**Request:**

```json
{
  "idToken": "google_id_token_here"
}
```

**Response:** Same as Apple Sign In

#### `GET /api/auth/me`

Get current authenticated user information.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "auth_provider": "apple",
    "created_at": "2025-11-29T23:17:23Z"
  }
}
```

### Search

#### `POST /api/search`

Search for movies/TV shows using AI recommendations. **Requires authentication.**

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "query": "action movies with time travel",
  "includeMovies": true,
  "includeTvShows": true,
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

**Error Responses:**

- `401 Unauthorized` - Missing or invalid JWT token
- `402 Payment Required` - No active subscription
- `429 Too Many Requests` - Rate limit exceeded

### Webhooks

#### `POST /api/subscription/webhook`

RevenueCat webhook for subscription events. Automatically syncs subscription status with user accounts.

**Handled Events:**

- `INITIAL_PURCHASE` - New subscription
- `RENEWAL` - Subscription renewed
- `CANCELLATION` - Subscription cancelled
- `EXPIRATION` - Subscription expired
- `PRODUCT_CHANGE` - Plan upgrade/downgrade
- `BILLING_ISSUE` - Payment problem
- `TEST` - Test event from RevenueCat dashboard

### Health Check

#### `GET /api/health`

Health check endpoint. Returns API status and version.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-30T00:02:46.739Z",
  "service": "FastFlix Backend API",
  "version": "1.0.0"
}
```

## Architecture

### Authentication Flow

```
User opens app
      ↓
User taps "Sign in with Apple"
      ↓ iOS handles Apple Sign In
Frontend receives identityToken
      ↓ POST /api/auth/apple
Backend validates with Apple
      ↓ verifies identity token
Backend creates/updates user
      ↓ generates JWT (30-day expiration)
Frontend receives JWT + user data
      ↓ stores in SecureStore
User authenticated ✅
```

### Search Flow (Authenticated)

```
User searches "sci-fi movies on Netflix"
      ↓ query + JWT token
Backend validates JWT
      ↓ extracts userId from token
Backend checks subscription status
      ↓ queries subscriptions table
✅ Active subscription → continue
❌ No subscription → 402 Payment Required
      ↓
AI Processing (Google Gemini)
      ↓ extracts platforms + generates recommendations
TMDB Enrichment
      ↓ fetch movie data + streaming providers
Smart Platform Filtering
      ↓ filter by detected platforms (if any)
Return Results ✅
```

### Subscription Flow

```
User purchases Pro in app
      ↓
RevenueCat processes payment
      ↓
RevenueCat links purchase to userId
      ↓ (via Purchases.logIn(userId))
RevenueCat sends webhook
      ↓ POST /api/subscription/webhook
Backend extracts userId from webhook
      ↓ event.app_user_id
Backend saves to database
      ↓ INSERT/UPDATE subscriptions (user_id)
Database updated: status = "active"
      ↓
Next search request validates JWT
      ↓ middleware extracts userId
Backend checks subscription
      ↓ hasActiveSubscriptionByUserId(userId)
Backend grants unlimited access ✅
```

### JWT Token Management

- **Expiration:** 30 days
- **Payload:** `{ userId, email, iat, exp }`
- **Algorithm:** HS256
- **Auto-refresh:** Frontend refreshes user data on app foreground
- **Expiry handling:** Frontend auto-logout on 401 responses

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Runtime:** Node.js 20+ / Vercel Serverless
- **Database:** Turso (libSQL - distributed SQLite)
- **Authentication:** JWT (jsonwebtoken), Apple Sign In, Google Sign In
- **AI:** Google Gemini 2.0 Flash (multilingual support)
- **Movie Data:** TMDB API v3
- **Subscriptions:** RevenueCat webhooks
- **Validation:** Zod schemas
- **Testing:** Jest + ts-jest (39 tests)
- **Language:** TypeScript 5 (strict mode)

## Key Features

### 🔐 Secure Authentication

- Apple Sign In integration
- Google Sign In ready
- JWT tokens with 30-day expiration
- Automatic token validation on all protected endpoints
- Secure token storage (never logged)

### 🌍 Multilingual Support

- Supports French, English, Italian, Japanese
- Language-aware AI responses
- Localized content from TMDB

### 🎯 Smart Platform Filtering

- AI-powered platform detection from natural language
- Intelligent filtering with 30% retention threshold
- Validates against known streaming platforms
- Never returns empty results

### 🔒 Privacy & Security

- JWT-based authentication (no passwords stored)
- Rate limiting (IP + user-based)
- Anti-abuse detection system
- Input validation with Zod
- Webhook signature verification (RevenueCat)
- HTTPS only

## Local Development

### Prerequisites

- Node.js 20+
- npm/pnpm
- Turso CLI (for database management)

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

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
APPLE_CLIENT_ID=com.yourapp.service
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# AI & Data
GOOGLE_API_KEY=your_google_ai_key
TMDB_API_KEY=your_tmdb_key
TMDB_BASE_URL=https://api.themoviedb.org/3

# RevenueCat (optional for webhook signature verification)
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret

# Configuration
NODE_ENV=development
```

3. **Initialize database:**

```bash
# Run database migration (if needed)
turso db shell your-database < migrations/schema.sql
```

4. **Run development server:**

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
npm test                 # Run all tests (39 tests)
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch mode

# Code Quality
npm run typecheck        # TypeScript type checking
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint errors
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# All Checks
npm run check-all        # Run typecheck + lint + format + test
```

## Database Schema

### `users`

Stores authenticated user information.

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL, -- 'apple' or 'google'
    provider_user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### `subscriptions`

Stores Pro subscription status (updated by RevenueCat webhook).

```sql
CREATE TABLE subscriptions (
    device_id TEXT,                    -- Legacy, nullable
    user_id TEXT,                      -- New auth system
    revenuecat_user_id TEXT NOT NULL,
    status TEXT NOT NULL,              -- 'active', 'expired', 'cancelled', 'billing_issue'
    expires_at TEXT,
    product_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (device_id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### `blocked_devices`

Anti-abuse system for blocking malicious devices.

```sql
CREATE TABLE blocked_devices (
    device_id TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    blocked_until TEXT
);
```

## Security Features

- ✅ **JWT Authentication:** Secure token-based auth (30-day expiration)
- ✅ **Token Validation:** All protected endpoints validate JWT
- ✅ **Auto-logout:** Frontend clears auth on 401 responses
- ✅ **Rate Limiting:** IP-based (60 req/min) + user-based (20 req/min)
- ✅ **Anti-Abuse Detection:** Automatic blocking of suspicious patterns
- ✅ **Input Validation:** Zod schemas on all endpoints
- ✅ **Webhook Verification:** RevenueCat signature validation
- ✅ **CORS:** Configured for mobile app only
- ✅ **Secrets:** Environment variables (never exposed)
- ✅ **Database Security:** Turso with authentication tokens

## Testing

**Coverage:**

- ✅ **39 tests passing** (22 core + 17 auth tests)
- ✅ JWT generation & verification tests
- ✅ JWT expiration & token validation tests
- ✅ GET /api/auth/me endpoint tests
- ✅ Authentication middleware tests
- ✅ Database operations tests
- ✅ API endpoint integration tests

**Test Files:**

- `__tests__/auth-endpoints.test.ts` - JWT auth tests (17 tests)
- `__tests__/auth-me-endpoint.test.ts` - /api/auth/me tests
- `__tests__/validation.test.ts` - Request validation
- `__tests__/rate-limiter.test.ts` - Rate limiting
- `__tests__/api-health.test.ts` - Health endpoint

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

| Variable                    | Description                                            | Required |
| --------------------------- | ------------------------------------------------------ | -------- |
| `TURSO_DATABASE_URL`        | Turso database connection URL                          | Yes      |
| `TURSO_AUTH_TOKEN`          | Turso authentication token                             | Yes      |
| `JWT_SECRET`                | Secret key for JWT signing (use strong random string)  | Yes      |
| `APPLE_CLIENT_ID`           | Apple Sign In client ID (Service ID)                   | Yes      |
| `GOOGLE_CLIENT_ID`          | Google Sign In client ID                               | No       |
| `GOOGLE_API_KEY`            | Google AI API key (Gemini)                             | Yes      |
| `TMDB_API_KEY`              | TMDB API key                                           | Yes      |
| `TMDB_BASE_URL`             | `https://api.themoviedb.org/3`                         | Yes      |
| `REVENUECAT_WEBHOOK_SECRET` | RevenueCat webhook secret (for signature verification) | No       |
| `NODE_ENV`                  | `production`                                           | Yes      |

## Troubleshooting

**Authentication errors:**

```bash
# Test JWT generation locally
npm run dev
curl -X POST http://localhost:3000/api/auth/apple \
  -H "Content-Type: application/json" \
  -d '{"identityToken": "test_token"}'
```

**Database connection errors:**

```bash
# Test Turso connection
turso db shell your-database "SELECT * FROM users LIMIT 5;"
```

**Webhook not working:**

1. Check RevenueCat webhook configuration
2. Verify webhook URL: `https://fastflix-api.vercel.app/api/subscription/webhook`
3. Check Vercel logs for errors
4. Send test event from RevenueCat dashboard
5. Verify `app_user_id` matches user ID from authentication

**JWT token issues:**

- Check JWT_SECRET is set correctly in environment
- Verify token hasn't expired (30-day limit)
- Check Authorization header format: `Bearer <token>`

**Tests failing:**

```bash
# Clear cache and re-run
rm -rf .next coverage
npm test
```

## API Testing with curl

**Authenticate:**

```bash
# Note: This requires a real Apple/Google identity token
curl -X POST https://fastflix-api.vercel.app/api/auth/apple \
  -H "Content-Type: application/json" \
  -d '{"identityToken": "YOUR_APPLE_TOKEN", "user": {"email": "test@example.com"}}'
```

**Get current user:**

```bash
curl https://fastflix-api.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Search (requires JWT):**

```bash
curl -X POST https://fastflix-api.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "action movies", "includeMovies": true, "includeTvShows": false}'
```

## License

Proprietary - All rights reserved
