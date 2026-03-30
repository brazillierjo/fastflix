# Migration FastFlix API : Next.js → Hono

> Objectif : migrer l'API backend de Next.js (déployé sur Vercel) vers Hono (déployé sur le VPS Hostinger `217.65.144.15` aux côtés de mio-api-hono).

## Infos VPS actuel

- **IP** : `217.65.144.15`
- **Répertoire** : `/opt/mio/`
- **Reverse proxy** : Caddy (TLS auto Let's Encrypt)
- **Services existants** : `caddy`, `mio-api-hono` (port 3001)
- **Déploiement** : GitHub Actions → Docker Hub → SSH pull sur VPS
- **Pattern Mio** : `@hono/node-server`, Dockerfile multi-stage (node:20-alpine), port 3001

## Architecture cible

```
/opt/mio/
├── docker-compose.yml          # + service fastflix-api (port 3002)
├── Caddyfile                   # + route api.fastflix.fr → :3002
├── api.env                     # Mio env (inchangé)
├── fastflix-api.env             # FastFlix env (nouveau)
└── ...
```

---

## Phase 1 — Setup du projet Hono

- [ ] Créer le dossier `backend-hono/` à la racine du monorepo FastFlix
- [ ] Initialiser le `package.json` avec les dépendances :
  - `hono`, `@hono/node-server`, `@hono/zod-validator`
  - `@libsql/client` (Turso — singleton, ne PAS recréer le client à chaque requête)
  - `jsonwebtoken`, `apple-signin-auth`, `google-auth-library`
  - `@google/generative-ai` (Gemini)
  - `@sentry/node`
  - `zod`, `dotenv`
- [ ] Configurer TypeScript (`tsconfig.json`) — copier le pattern Mio
  - `"moduleResolution": "NodeNext"`, `"module": "NodeNext"` pour les `.js` extensions dans les imports
- [ ] Créer le `src/index.ts` (entry point) :
  ```ts
  import { Hono } from 'hono'
  import { serve } from '@hono/node-server'
  import { cors } from 'hono/cors'
  import { secureHeaders } from 'hono/secure-headers'
  import { logger } from 'hono/logger'
  import { HTTPException } from 'hono/http-exception'

  const app = new Hono()

  // Global middleware
  app.use('*', logger())
  app.use('*', cors())
  app.use('*', secureHeaders())
  app.use('*', sentryMiddleware())

  // Mount routes via app.route()
  app.route('/auth', authRoutes)
  app.route('/search', searchRoutes)
  // etc.

  // Global error handler — catch-all pour Sentry + réponse propre
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse()
    }
    Sentry.captureException(err)
    return c.json({ error: 'Internal server error' }, 500)
  })

  // Graceful shutdown
  const server = serve({ fetch: app.fetch, port: 3002 })
  process.on('SIGTERM', () => { server.close(); process.exit(0) })
  process.on('SIGINT', () => { server.close(); process.exit(0) })
  ```
- [ ] Configurer les scripts : `dev` (tsx watch), `build` (tsc), `start` (node dist/index.js), `test` (vitest)
- [ ] Ajouter le Dockerfile multi-stage (copier celui de Mio, changer le port → 3002)

## Phase 2 — Migrer les services core (lib/)

Les fichiers `lib/` sont framework-agnostic — peu de changements nécessaires.

- [ ] `lib/db.ts` (1459 lignes) — Copier et découper en modules :
  - `lib/db/client.ts` — Singleton `createClient()` (ne PAS recréer à chaque requête)
  - `lib/db/users.ts` — CRUD users
  - `lib/db/watchlist.ts` — CRUD watchlist
  - `lib/db/taste-profile.ts` — Ratings, favorite actors
  - `lib/db/subscriptions.ts` — Subscription CRUD + `hasAccess()`
  - `lib/db/index.ts` — Ré-export tout
  - Utiliser les args positionnels `?` pour toutes les requêtes SQL (pas de string interpolation)
  - Wrapper les erreurs `LibsqlError` dans les handlers pour retourner des 400/500 appropriés
- [ ] `lib/auth.ts` (188 lignes) — JWT generation/validation, aucun import Next.js → copier tel quel
- [ ] `lib/gemini.ts` (391 lignes) — Google Gemini, framework-agnostic → copier tel quel
- [ ] `lib/tmdb.ts` (954 lignes) — TMDB API, framework-agnostic → copier tel quel
- [ ] `lib/affinity.ts` (80 lignes) — Calculs d'affinité, pur TypeScript → copier tel quel
- [ ] `lib/types.ts` (417 lignes) — Interfaces/types → copier tel quel
- [ ] `lib/validation.ts` (66 lignes) — Zod schemas → copier tel quel, seront utilisés avec `@hono/zod-validator`
- [ ] `lib/revenuecat.ts` (131 lignes) — RevenueCat API → copier tel quel
- [ ] `lib/webhook-verification.ts` (67 lignes) — Vérification signature RevenueCat → copier tel quel
- [ ] `lib/env.ts` (115 lignes) — Supprimer les refs à `process.env.NEXT_PUBLIC_*`, garder la validation des env vars au boot

## Phase 3 — Middleware Hono

Remplacer les middlewares Next.js par des middlewares Hono natifs.

- [ ] `middleware/auth.ts` — Middleware Hono custom pour l'auth JWT :
  ```ts
  // NE PAS utiliser le JWT middleware built-in de Hono (il ne vérifie pas l'user en DB)
  // Réécrire requireAuth en middleware custom :
  import { createMiddleware } from 'hono/factory'

  type Env = { Variables: { user: User; userId: string } }

  export const requireAuth = createMiddleware<Env>(async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) throw new HTTPException(401, { message: 'Missing token' })
    const payload = verifyJWT(token)
    if (!payload) throw new HTTPException(401, { message: 'Invalid token' })
    const user = await db.getUserById(payload.userId)
    if (!user) throw new HTTPException(404, { message: 'User not found' })
    c.set('user', user)
    c.set('userId', user.id)
    await next()
  })
  ```
- [ ] `middleware/rate-limit.ts` — Garder le rate limiter in-memory existant (avantage du always-on Docker : le cache persiste) :
  ```ts
  export const rateLimit = (endpoint: string, maxReqs: number, windowMs: number) =>
    createMiddleware(async (c, next) => {
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
      const allowed = await rateLimiter.checkLimit(`${endpoint}:${ip}`, maxReqs, windowMs)
      if (!allowed) {
        throw new HTTPException(429, { message: 'Rate limit exceeded' })
      }
      await next()
    })
  ```
- [ ] `middleware/sentry.ts` — Setup `@sentry/node` :
  ```ts
  import * as Sentry from '@sentry/node'

  export function initSentry() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1, // 10% en prod (pas 1.0 !)
      environment: process.env.NODE_ENV || 'development',
    })
  }

  export const sentryMiddleware = () => createMiddleware(async (c, next) => {
    try { await next() }
    catch (err) { Sentry.captureException(err); throw err }
  })
  ```
- [ ] Security headers — Utiliser le built-in `hono/secure-headers` (X-Content-Type-Options, X-Frame-Options, etc. — déjà inclus par défaut)

## Phase 4 — Migrer les routes (35 routes)

**Pattern de conversion** : chaque groupe de routes = un fichier qui exporte une instance `Hono`, montée via `app.route()`.

Convention Hono pour les routes modulaires :
```ts
// routes/auth.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth.js'

const app = new Hono()
  .post('/apple', zValidator('json', appleSignInSchema), async (c) => {
    const body = c.req.valid('json')
    // ...
    return c.json({ user, token })
  })
  .get('/me', requireAuth, async (c) => {
    const user = c.get('user')
    return c.json({ user })
  })

export default app
```

**Checklist de conversion pour chaque route** :
- Remplacer `request.json()` → `c.req.valid('json')` (avec zValidator)
- Remplacer `NextResponse.json()` → `c.json()`
- Remplacer `request.headers.get()` → `c.req.header()`
- Remplacer `request.nextUrl.searchParams` → `c.req.query()`
- Remplacer params dynamiques `[id]` → `:id` avec `c.req.param('id')`
- Utiliser `HTTPException` au lieu de construire des `NextResponse` d'erreur
- Chaîner les routes (`.get().post()`) pour le support RPC type-safe

### Auth (3 routes) → `routes/auth.ts`
- [ ] `POST /apple` — Apple Sign In callback
- [ ] `POST /google` — Google Sign In callback
- [ ] `GET /me` — Get current user (auth required)

### Search (3 routes) → `routes/search.ts`
- [ ] `POST /` — AI search (auth required, rate limited, cached)
- [ ] `GET /history` — Search history (auth required)
- [ ] `GET /tmdb` — TMDB direct search

### Content Discovery (6 routes) → `routes/discovery.ts`
- [ ] `GET /home` — Home screen data (daily pick + trending + recent searches)
- [ ] `GET /daily-pick` — Daily pick
- [ ] `GET /trending` — Trending (auth required)
- [ ] `GET /trending/public` — Trending (public, no auth)
- [ ] `GET /for-you` — Personalized recommendations (auth required)
- [ ] `GET /new-releases` — New releases this week

### Movie/TV Details (3 routes) → `routes/details.ts`
- [ ] `GET /details` — Full movie/TV details + providers + credits
- [ ] `GET /similar/:tmdbId` — Similar content
- [ ] `GET /person/:personId` — Actor/person details

### Watchlist (7 routes) → `routes/watchlist.ts`
- [ ] `GET /` — List watchlist items (auth required)
- [ ] `POST /` — Add to watchlist (auth required)
- [ ] `DELETE /:id` — Remove from watchlist (auth required)
- [ ] `GET /check/:tmdbId/:mediaType` — Check if in watchlist
- [ ] `POST /refresh-providers` — Refresh streaming providers
- [ ] `POST /check-availability` — Check availability changes
- [ ] `PUT /:id/watched` — Toggle watched status

### User (8 routes) → `routes/user.ts`
- [ ] `GET /preferences` — Get preferences (auth required)
- [ ] `PUT /preferences` — Update preferences (auth required)
- [ ] `GET /taste-profile` — Get taste profile (auth required)
- [ ] `POST /taste-profile/rate` — Rate a movie (auth required)
- [ ] `GET /taste-profile/favorite-actors` — Favorite actors (auth required)
- [ ] `POST /taste-profile/backfill-posters` — Backfill posters
- [ ] `GET /stats` — User stats (auth required)
- [ ] `DELETE /delete` — Delete account (auth required)

### Providers (2 routes) → `routes/providers.ts`
- [ ] `GET /` — Providers by country (auth required)
- [ ] `GET /public` — Providers (public, no auth)

### Subscription (1 route) → `routes/webhook.ts`
- [ ] `POST /subscription/webhook` — RevenueCat webhook (signature verification via raw body)
  - **Attention** : pour la vérif de signature, il faut le body brut. Utiliser `await c.req.text()` et non `c.req.json()` d'abord.

### Quotas (1 route) → `routes/quotas.ts`
- [ ] `GET /` — User quotas (auth required)

### Other → `routes/health.ts`, `routes/notifications.ts`
- [ ] `GET /health` — Health check
- [ ] `POST /notifications/register` — Register push notification token

## Phase 5 — Tests

- [ ] Installer `vitest` (plus rapide que Jest, support natif ESM/TS)
- [ ] Migrer les 157 tests existants en utilisant `app.request()` de Hono :
  ```ts
  // Exemple de test Hono
  import { describe, it, expect } from 'vitest'
  import app from '../src/index.js'

  describe('GET /health', () => {
    it('should return 200', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('ok')
    })
  })
  ```
- [ ] Mocker les services externes (Turso, Gemini, TMDB, RevenueCat) via `vi.mock()`
- [ ] Tester les middlewares isolément (auth, rate-limit)
- [ ] Tester la validation Zod (requêtes invalides → 400)
- [ ] Vérifier la couverture des routes critiques : auth, search, watchlist, webhook

## Phase 6 — Infra & Déploiement

### Docker & CI/CD
- [ ] Créer `.github/workflows/deploy-fastflix-api.yml` (copier le pattern Mio) :
  ```yaml
  name: Deploy FastFlix API
  on:
    workflow_dispatch:
    push:
      branches: [main]
      paths: ['backend-hono/**', '.github/workflows/deploy-fastflix-api.yml']
  concurrency:
    group: deploy-fastflix-api
    cancel-in-progress: false
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: docker/setup-buildx-action@v3
        - uses: docker/login-action@v3
          with:
            username: ${{ secrets.DOCKER_USERNAME }}
            password: ${{ secrets.DOCKER_PASSWORD }}
        - uses: docker/build-push-action@v5
          with:
            context: ./backend-hono
            file: ./backend-hono/Dockerfile
            platforms: linux/amd64
            push: true
            tags: bzrjoh/fastflix-api-hono:latest
            cache-from: type=gha
            cache-to: type=gha,mode=max
        - uses: appleboy/ssh-action@v1.0.3
          with:
            host: ${{ secrets.VPS_HOST }}
            username: ${{ secrets.VPS_USERNAME }}
            password: ${{ secrets.VPS_PASSWORD }}
            script: |
              cd /opt/mio
              docker compose stop fastflix-api || true
              docker compose rm -f fastflix-api || true
              docker compose pull fastflix-api
              docker compose up -d fastflix-api
  ```
- [ ] Vérifier que les secrets GitHub (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `VPS_HOST`, `VPS_USERNAME`, `VPS_PASSWORD`) sont disponibles sur le repo FastFlix (sinon les ajouter — les mêmes que Mio)

### Configuration VPS
- [ ] Créer `/opt/mio/fastflix-api.env` sur le VPS :
  ```
  TURSO_DATABASE_URL=libsql://fastflix-db-brazillierjo.aws-eu-west-1.turso.io
  TURSO_AUTH_TOKEN=...
  JWT_SECRET=...
  TMDB_API_KEY=...
  GOOGLE_API_KEY=...
  APPLE_CLIENT_ID=com.fastflix.app
  GOOGLE_CLIENT_ID=...
  REVENUECAT_WEBHOOK_SECRET=...
  REVENUECAT_SECRET_API_KEY=...
  REVENUECAT_PROJECT_ID=...
  SENTRY_DSN=...
  PORT=3002
  ```
- [ ] Ajouter le service dans `/opt/mio/docker-compose.yml` :
  ```yaml
  fastflix-api:
    image: bzrjoh/fastflix-api-hono:latest
    restart: unless-stopped
    ports:
      - "3002:3002"
    env_file:
      - ./fastflix-api.env
    environment:
      - NODE_ENV=production
  ```
- [ ] Ajouter la route Caddy dans le `Caddyfile` :
  ```
  api.fastflix.fr {
    reverse_proxy 217.65.144.15:3002
  }
  ```
- [ ] Configurer le DNS : `api.fastflix.fr` → `217.65.144.15` (A record)
- [ ] Mettre à jour le webhook RevenueCat : changer l'URL vers `https://api.fastflix.fr/subscription/webhook`

## Phase 7 — Basculement

- [ ] Déployer la nouvelle API sur le VPS (`docker compose up -d fastflix-api`)
- [ ] Vérifier le TLS Caddy (`curl https://api.fastflix.fr/health`)
- [ ] Tester toutes les routes critiques en prod avec curl :
  - [ ] `GET /health`
  - [ ] `POST /auth/apple` (avec un token de test)
  - [ ] `POST /search` (avec JWT valide)
  - [ ] `GET /watchlist` (avec JWT valide)
  - [ ] `POST /subscription/webhook` (test event depuis RevenueCat)
- [ ] Modifier `EXPO_PUBLIC_API_URL` dans le frontend → `https://api.fastflix.fr`
- [ ] Publier un update OTA (`expo-updates`) pour basculer les utilisateurs
- [ ] Monitorer Sentry + Aptabase pendant 48h
- [ ] Supprimer le déploiement Vercel de l'ancien backend Next.js
- [ ] Mettre à jour le `CLAUDE.md` du projet avec la nouvelle architecture

---

## Pièges à éviter

| Piège | Solution |
|-------|----------|
| **Le JWT middleware built-in Hono** ne vérifie pas l'user en DB | Écrire un middleware custom `requireAuth` qui fait JWT + DB lookup |
| **`c.req.json()` consomme le body** — on ne peut pas le relire pour la vérif de signature webhook | Pour le webhook RevenueCat, lire d'abord avec `c.req.text()`, vérifier la signature, puis `JSON.parse()` |
| **`@libsql/client` recréé à chaque requête** = connection leak | Utiliser un singleton initialisé au boot |
| **`tracesSampleRate: 1.0` en prod** = facture Sentry qui explose | Mettre `0.1` (10%) en prod |
| **Imports sans `.js` extension** en ESM Node.js | Configurer `"moduleResolution": "NodeNext"` dans tsconfig et ajouter `.js` aux imports |
| **Rate limiter reset au restart du container** | OK car les restarts sont rares (deploy only), bien mieux que les cold starts Vercel |
| **Docker build lent** | Utiliser le cache GitHub Actions (`cache-from: type=gha`) |
| **Caddyfile reverse_proxy vers localhost** | Utiliser l'IP du host (`217.65.144.15:3002`), pas `localhost` (les containers sont en réseau séparé) |

## Résumé des gains

| | Next.js (Vercel) | Hono (VPS) |
|---|---|---|
| **Cold start** | ~1-3s (serverless) | 0ms (always-on Docker) |
| **Coût** | Vercel free tier limité | 0€ (déjà payé avec Mio) |
| **Rate limiter** | In-memory (reset à chaque cold start) | In-memory (persistant, le container tourne 24/7) |
| **Cache search** | Perdu à chaque cold start | Persistant tant que le container tourne |
| **Taille image** | ~200MB+ (Next.js) | ~50MB (Node Alpine + Hono) |
| **Déploiement** | Vercel auto | GitHub Actions → Docker → VPS |
| **Latence EU** | Variable (Vercel edge) | Constante (VPS Hostinger EU) |
| **Performance** | ~50ms/req (cold: 1-3s) | ~2-5ms/req (Hono est ultrafast) |
