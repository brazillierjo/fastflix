# Plan de Développement - FastFlix API Backend

> **Objectif**: Créer une API Next.js sécurisée pour gérer les recommandations AI et le comptage des prompts gratuits, compatible iOS & Android.

---

## 📋 Vue d'ensemble

### Problème actuel

- ✅ Clé Google AI exposée dans l'app mobile (risque de vol)
- ✅ Compteur de prompts contournable (désinstallation = reset)
- ✅ Impossible de tracer l'utilisation réelle
- ✅ Pas de rate limiting efficace

### Solution

- API Next.js hébergée sur Vercel (gratuit)
- Base de données Turso SQLite (gratuit, 9GB)
- Identification par Device ID persistant (iOS Keychain + Android)
- **Backend gère TOUTE la logique** :
  - ✅ Clé Google AI sécurisée côté serveur
  - ✅ Clé TMDB sécurisée côté serveur
  - ✅ Génération des recommandations (Gemini)
  - ✅ Recherche et enrichissement TMDB
  - ✅ Comptage des prompts
  - ✅ Gestion des abonnements
- **Frontend allégé** : affichage uniquement (reçoit données complètes)

---

## 🎯 Phase 1: Setup Initial

### 1.1 Configuration Base de Données Turso

- [x] Créer compte sur [turso.tech](https://turso.tech)
- [x] Installer Turso CLI (`brew install tursodatabase/tap/turso`)
- [x] Se connecter: `turso auth login`
- [x] Créer la database: `turso db create fastflix-db`
- [x] Récupérer l'URL: `turso db show fastflix-db`
- [x] Générer le token: `turso db tokens create fastflix-db`
- [x] Sauvegarder URL et token dans `.env.local`

### 1.2 Schéma Base de Données

```sql
-- Table principale pour le comptage des prompts
CREATE TABLE user_prompts (
  device_id TEXT PRIMARY KEY,           -- ID unique de l'appareil (iOS/Android)
  prompt_count INTEGER DEFAULT 0,       -- Nombre de prompts utilisés ce mois
  current_month TEXT NOT NULL,          -- Format: YYYY-MM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  platform TEXT,                        -- 'ios' ou 'android'
  app_version TEXT                      -- Pour analytics
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_current_month ON user_prompts(current_month);
CREATE INDEX idx_device_created ON user_prompts(device_id, created_at);

-- Table pour tracer les requêtes (analytics optionnel)
CREATE TABLE prompt_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  query TEXT,                           -- Requête de l'utilisateur (optionnel)
  results_count INTEGER,                -- Nombre de résultats retournés
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_time_ms INTEGER              -- Temps de réponse de l'API
);
```

- [x] Créer le schéma dans Turso: `turso db shell fastflix-db < schema.sql`
- [x] Vérifier les tables: `turso db shell fastflix-db "SELECT * FROM user_prompts LIMIT 1;"`

### 1.3 Configuration Next.js Backend

- [x] Installer les dépendances Turso: `npm install @libsql/client`
- [x] Installer Google AI SDK: `npm install @google/generative-ai`
- [x] Créer `/backend/.env.local` avec:

  ```env
  # Turso Database
  TURSO_DATABASE_URL=libsql://fastflix-db-xxx.turso.io
  TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

  # Google AI
  GOOGLE_API_KEY=AIzaSy...

  # TMDB API
  TMDB_API_KEY=your_tmdb_api_key_here
  TMDB_BASE_URL=https://api.themoviedb.org/3

  # App Configuration
  MAX_FREE_PROMPTS=3
  NODE_ENV=development
  ```

- [x] Ajouter `.env.local` au `.gitignore` (déjà fait normalement)

---

## 🔧 Phase 2: Services Backend

### 2.1 Service Database (`/backend/lib/db.ts`)

- [x] Créer le client Turso singleton
- [x] Fonction `getOrCreateUser(deviceId, platform, appVersion)`
- [x] Fonction `incrementPromptCount(deviceId)`
- [x] Fonction `getPromptCount(deviceId)`
- [x] Fonction `resetMonthlyCount(deviceId)` (si nouveau mois)
- [x] Gestion automatique du reset mensuel
- [x] Gestion des erreurs avec retry logic

### 2.2 Service Google AI (`/backend/lib/gemini.ts`)

- [x] Créer le client Gemini singleton
- [x] Fonction `generateRecommendations(query, contentTypes)` → retourne uniquement les titres
- [x] Fonction `generateConversationalResponse(query)`
- [x] Fonction combinée `generateRecommendationsWithResponse(query, contentTypes)`
- [x] Gestion des erreurs (quota, network, timeout)
- [x] Cache optionnel des requêtes populaires

### 2.3 Service TMDB (`/backend/lib/tmdb.ts`)

- [x] Créer le client TMDB avec API key
- [x] Fonction `searchMovieByTitle(title, language)` → métadonnées film
- [x] Fonction `searchTVByTitle(title, language)` → métadonnées série
- [x] Fonction `searchMulti(title, language)` → cherche films + séries
- [x] Fonction `getMovieDetails(tmdbId)` → détails complets
- [x] Fonction `getTVDetails(tmdbId)` → détails complets
- [x] Fonction `enrichRecommendations(titles, includeMovies, includeTvShows, language)`
  - Prend les titres de Gemini
  - Cherche chaque titre dans TMDB
  - Retourne les métadonnées complètes (poster, overview, ratings, etc.)
- [x] Gestion des erreurs TMDB (rate limit, not found, etc.)
- [x] Cache des résultats TMDB pour éviter les appels répétés

### 2.4 Service Comptage (`/backend/lib/prompt-counter.ts`)

- [x] Fonction `canMakePrompt(deviceId)` → { allowed, remaining, reason }
- [x] Fonction `checkSubscriptionStatus(deviceId)` (intégration RevenueCat future)
- [x] Logique de vérification:
  - Vérifier si user a un abonnement actif
  - Si non, vérifier le compteur mensuel
  - Reset automatique si nouveau mois
  - Retourner infos détaillées pour l'app

### 2.5 Types TypeScript Partagés (`/backend/lib/types.ts`)

```typescript
// Types de requêtes API
export interface SearchRequest {
  deviceId: string;
  query: string;
  includeMovies: boolean;
  includeTvShows: boolean;
  platform: 'ios' | 'android';
  appVersion: string;
  language?: string; // 'fr-FR', 'en-US', etc.
  country?: string; // 'FR', 'US', etc.
}

// Type pour un film/série avec métadonnées TMDB complètes
export interface MovieResult {
  tmdb_id: number;
  title: string;
  original_title?: string;
  media_type: 'movie' | 'tv';
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string; // Pour les films
  first_air_date?: string; // Pour les séries
  genre_ids: number[];
  popularity: number;
  adult?: boolean;
}

export interface SearchResponse {
  recommendations: MovieResult[]; // ⭐ Métadonnées complètes au lieu de simples titres
  conversationalResponse: string;
  promptsRemaining: number;
  isProUser: boolean;
  totalResults: number;
}

export interface CheckLimitRequest {
  deviceId: string;
  platform?: 'ios' | 'android';
}

export interface CheckLimitResponse {
  canMakePrompt: boolean;
  promptsUsed: number;
  promptsRemaining: number;
  maxFreePrompts: number;
  isProUser: boolean;
  reason?: string;
}
```

- [x] Définir tous les types de requêtes/réponses
- [x] Types pour les métadonnées TMDB
- [x] Types pour les erreurs standardisées
- [x] Types pour la base de données

---

## 🌐 Phase 3: Endpoints API ✅

### 3.1 Endpoint `/api/search` (POST) ✅

**Fonction principale**: Recherche de films/séries avec AI + TMDB

- [x] Validation du corps de la requête (Zod)
- [x] Extraire `deviceId`, `query`, `includeMovies`, `includeTvShows`, `platform`, `appVersion`, `language`, `country`
- [x] **Vérifier le quota:**
  - Appeler `canMakePrompt(deviceId)`
  - Si `allowed === false`, retourner erreur 429 (Too Many Requests)
- [x] **Générer les recommandations AI:**
  - Appeler `generateRecommendationsWithResponse(query, contentTypes)` → obtenir titres
  - Mesurer le temps de réponse Gemini
- [x] **Enrichir avec TMDB:**
  - Appeler `enrichRecommendations(titles, includeMovies, includeTvShows, language)`
  - Chercher chaque titre dans TMDB
  - Récupérer métadonnées complètes (poster, overview, ratings, etc.)
  - Mesurer le temps de réponse TMDB
- [x] **Incrémenter le compteur** (SEULEMENT si résultats > 0)
- [x] **Logger l'usage** (optionnel, pour analytics)
- [x] Retourner:
  ```json
  {
    "success": true,
    "data": {
      "recommendations": [
        {
          "tmdb_id": 293167,
          "title": "Godzilla",
          "media_type": "movie",
          "poster_path": "/xyz.jpg",
          "overview": "...",
          "vote_average": 7.2,
          ...
        }
      ],
      "conversationalResponse": "Voici mes suggestions...",
      "promptsRemaining": 2,
      "isProUser": false
    }
  }
  ```
- [x] Gestion des erreurs:
  - 400: Requête invalide
  - 429: Quota dépassé
  - 500: Erreur serveur (AI, DB)
  - 503: Service temporairement indisponible

### 3.2 Endpoint `/api/check-limit` (POST) ✅

**Fonction**: Vérifier le quota avant de faire une recherche (optionnel mais recommandé)

- [x] Validation du corps: `{ deviceId, platform? }`
- [x] Appeler `canMakePrompt(deviceId)`
- [x] Retourner:
  ```json
  {
    "success": true,
    "data": {
      "canMakePrompt": true,
      "promptsUsed": 1,
      "promptsRemaining": 2,
      "maxFreePrompts": 3,
      "isProUser": false,
      "reason": "within-monthly-limit"
    }
  }
  ```
- [x] Gestion des erreurs DB

### 3.3 Endpoint `/api/subscription/webhook` (POST) ✅

**Fonction**: Recevoir les webhooks RevenueCat pour les abonnements

- [x] Valider la signature RevenueCat (sécurité)
- [x] Parser l'événement (INITIAL_PURCHASE, RENEWAL, CANCELLATION, etc.)
- [x] Créer table `subscriptions` dans Turso:
  ```sql
  CREATE TABLE subscriptions (
    device_id TEXT PRIMARY KEY,
    revenuecat_user_id TEXT,
    status TEXT,  -- 'active', 'expired', 'cancelled'
    expires_at TIMESTAMP,
    product_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [x] Mettre à jour le statut d'abonnement dans la DB
- [x] Retourner 200 OK pour confirmer la réception
- [x] Logger tous les événements pour debug

### 3.4 Endpoint `/api/health` (GET) ✅

**Fonction**: Vérifier que l'API fonctionne (pour monitoring)

- [x] Vérifier la connexion Turso
- [x] Vérifier la connexion Google AI (optionnel)
- [x] Retourner:
  ```json
  {
    "status": "ok",
    "timestamp": "2024-11-28T20:30:00Z",
    "database": "connected",
    "ai": "connected"
  }
  ```

---

## 🔒 Phase 4: Sécurité & Rate Limiting ✅

### 4.1 Validation des Requêtes ✅

- [x] Installer Zod: `npm install zod`
- [x] Valider tous les inputs (deviceId, query, etc.)
- [x] Sanitizer les queries (éviter injection)
- [x] Limiter la taille des requêtes (max 500 caractères pour query)

### 4.2 Rate Limiting Global ✅

- [x] Implémenter rate limiter en mémoire
- [x] Limiter par IP: max 10 requêtes/minute
- [x] Limiter par deviceId: max 5 requêtes/minute
- [x] Retourner headers `X-RateLimit-*` standard

### 4.3 Protection Anti-Abus ✅

- [x] Détecter les patterns suspects:
  - Même deviceId avec multiples appVersion
  - Création massive de nouveaux deviceId depuis même IP
  - Requêtes identiques répétées
- [x] Bloquer temporairement les deviceId suspects (table `blocked_devices`)
- [x] Logger toutes les tentatives suspectes

### 4.4 CORS & Headers Sécurité ✅

- [x] Configurer CORS pour accepter les requêtes
- [x] Headers de sécurité (CSP, X-Frame-Options, etc.)
- [x] HTTPS obligatoire (automatique avec Vercel)

---

## ✅ Phase 5: Tests & Validation ✅

### 5.1 Tests Unitaires ✅

- [x] Installer Jest: `npm install -D jest @types/jest ts-jest @jest/globals`
- [x] Tests pour `prompt-counter.ts`: logique de comptage (70.21% coverage)
- [x] Tests pour `rate-limiter.ts`: rate limiting (65.85% coverage)
- [x] Tests pour `validation.ts`: schémas Zod (100% coverage)
- [x] 36 tests passent avec succès

### 5.2 Tests d'Intégration ✅

- [x] Test de l'endpoint `/api/health` (100% coverage)
- [x] Autres endpoints testés manuellement (voir Phase 3)

### 5.3 Tests Manuels ✅

- [x] Testé avec curl en Phase 3
- [x] Testé le rate limiting (fonctionnel)
- [x] Testé les erreurs (quota, validation)
- [x] Testé la performance (3-4s avec AI + TMDB, <500ms pour check-limit et health)

---

## 🚀 Phase 6: Déploiement Vercel ✅

### 6.1 Configuration Vercel ✅

- [x] Créer compte sur [vercel.com](https://vercel.com)
- [x] Installer Vercel CLI: `npm install -g vercel`
- [x] Se connecter: `vercel login`
- [x] Lier le projet: `vercel link` (depuis `/backend`)

### 6.2 Variables d'Environnement ✅

- [x] Aller sur Vercel Dashboard → Settings → Environment Variables
- [x] Ajouter toutes les variables de `.env.local`:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`
  - `GOOGLE_API_KEY`
  - `TMDB_API_KEY`
  - `MAX_FREE_PROMPTS`
- [x] Vérifier que les variables sont bien chargées

### 6.3 Déploiement ✅

- [x] Premier déploiement: `vercel --prod`
- [x] URL de production: **https://fastflix-api.vercel.app**
- [x] Tester tous les endpoints sur l'URL de prod
- [x] Domaine custom non nécessaire

### 6.4 Auto-deploy depuis GitHub ✅

- [x] Connecter le repo GitHub à Vercel
- [x] Activer auto-deploy sur push vers `main`
- [x] Chaque commit → déploiement automatique

---

## 📱 Phase 7: Intégration Frontend ✅

### 7.1 Modifications App Mobile ✅

- [x] Créer service `/frontend/services/backend-api.service.ts`
- [x] Remplacer appels directs à Gemini par appels API backend
- [x] Fonction `search(query, deviceId, ...)` avec gestion deviceId automatique
- [x] Fonction `checkLimit(deviceId)` pour vérifier le quota
- [x] Fonction `healthCheck()` pour monitoring
- [x] Gestion des erreurs réseau avec timeout (30s)
- [x] Retry logic via React Query

### 7.2 Hooks et Intégration ✅

- [x] Créer hook `useBackendMovieSearch()` pour remplacer `useMovieSearch()`
- [x] Créer hook `usePromptLimit()` pour vérifier le quota
- [x] Créer hook `useBackendHealth()` pour monitoring
- [x] Mettre à jour `app/index.tsx` pour utiliser le nouveau hook
- [x] Ajouter notices de déprécation sur anciens services
- [x] Device ID géré automatiquement via `deviceIdentityService`

### 7.3 Configuration API URL ✅

- [x] Ajouter `EXPO_PUBLIC_API_URL` dans `.env`:

  ```env
  # Development (local)
  # EXPO_PUBLIC_API_URL=http://localhost:3000

  # Production (Vercel)
  EXPO_PUBLIC_API_URL=https://fastflix-api.vercel.app
  ```

- [x] Utiliser `Constants.expoConfig?.extra?.API_URL` dans le code
- [x] Mettre à jour `app.config.js` pour exposer la variable

### 7.4 Services Dépréciés (Conservés pour compatibilité) ✅

- [x] Ajouter `@deprecated` notice sur `/frontend/services/ai.service.ts`
- [x] Ajouter `@deprecated` notice sur `/frontend/services/tmdb.service.ts`
- [x] Les clés API Google et TMDB ne sont plus nécessaires côté frontend
- [x] Migration guide ajouté dans les fichiers de service

### 7.5 Tests à Effectuer

- [ ] Tester la recherche de films/séries sur iOS
- [ ] Tester la recherche de films/séries sur Android
- [ ] Vérifier le comptage des prompts (quota gratuit)
- [ ] Tester le message d'erreur quand quota dépassé
- [ ] Tester en mode développement (localhost)
- [ ] Tester en mode production (Vercel)
- [ ] Vérifier que le deviceId est correctement généré et persisté

---

## 📊 Phase 8: Monitoring & Analytics (Optionnel)

### 8.1 Logging

- [ ] Intégrer Axiom, Datadog, ou Vercel Analytics
- [ ] Logger toutes les requêtes avec timestamps
- [ ] Tracker les erreurs avec stack traces
- [ ] Alertes email si erreur critique

### 8.2 Métriques

- [ ] Dashboard Vercel: voir usage, latence, erreurs
- [ ] Métriques custom:
  - Requêtes par jour
  - Utilisateurs actifs (deviceId uniques)
  - Taux de conversion gratuit → Pro
  - Requêtes les plus populaires

### 8.3 Optimisations

- [ ] Cache Redis/Upstash pour requêtes populaires
- [ ] Edge Functions pour latence minimale
- [ ] Compression des réponses (gzip)
- [ ] CDN pour assets statiques

---

## 🎯 Récapitulatif des Coûts

| Service       | Plan Gratuit            | Utilisation FastFlix | Coût Mensuel    |
| ------------- | ----------------------- | -------------------- | --------------- |
| **Vercel**    | 100 GB-heures compute   | ~30k requêtes/mois   | **Gratuit** ✅  |
| **Turso**     | 9 GB stockage, 1B reads | <1 MB, ~90k reads    | **Gratuit** ✅  |
| **Google AI** | Gemini Flash gratuit    | ~30k appels/mois     | **Gratuit** ✅  |
| **Total**     | -                       | -                    | **0€ /mois** 🎉 |

---

## 🔑 Points Critiques à Retenir

1. **Sécurité PRIMORDIALE**
   - ✅ Jamais exposer les clés API
   - ✅ Valider TOUS les inputs
   - ✅ Rate limiting agressif

2. **Performance**
   - ✅ Réponse < 500ms idéalement
   - ✅ Cache si possible
   - ✅ Edge Functions Vercel

3. **Scalabilité**
   - ✅ Turso scale automatiquement
   - ✅ Vercel scale automatiquement
   - ✅ Architecture stateless

4. **Compatibilité**
   - ✅ iOS & Android avec même API
   - ✅ Device ID générique
   - ✅ Versions d'app différentes supportées

---

## 🚀 Ordre d'Exécution Recommandé

1. ✅ Phase 1: Setup (Turso + Next.js) - **TERMINÉE**
2. ✅ Phase 2: Services Backend - **TERMINÉE**
3. ⏳ Phase 3: Endpoints API
4. ⏳ Phase 4: Sécurité
5. ⏳ Phase 5: Tests
6. ⏳ Phase 6: Déploiement
7. ⏳ Phase 7: Frontend (APRÈS API fonctionnelle)
8. ⏳ Phase 8: Monitoring (APRÈS mise en prod)

---

**Date de début**: 28 novembre 2024
**Dernière mise à jour**: 28 novembre 2024
**Status global**: 🟢 Phase 2 terminée - Prêt pour Phase 3 (Endpoints API)
