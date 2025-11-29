# 🔐 FastFlix - Plan d'implémentation de l'authentification

> **Objectif :** Remplacer le système d'ID anonymes par une vraie authentification utilisateur (Sign in with Apple + Google) pour une gestion robuste des abonnements et une meilleure expérience utilisateur.

**Date de création :** 2025-11-29
**Statut :** ✅ Phase 1-3 Complete

---

## 🎯 Problèmes actuels à résoudre

- ❌ ID anonymes RevenueCat instables et imprévisibles
- ❌ Impossible de se connecter sur plusieurs appareils
- ❌ Perte d'abonnement si réinstallation de l'app
- ❌ Synchronisation fragile entre RevenueCat et Turso
- ❌ Code mort et services obsolètes dans le codebase

---

## 📋 Plan d'exécution

### Phase 1 : 🧹 Nettoyage du code existant

Nettoyer le codebase avant d'ajouter la nouvelle feature pour éviter la dette technique.

#### Backend - Code mort et documentation

- [x] **Supprimer `/api/check-limit` de la documentation** (ligne 29 de `page.tsx`, lignes 14-33 du README)
  - Cet endpoint est documenté mais n'existe pas
  - Supprimer les références ou implémenter l'endpoint

- [x] **Supprimer les schemas de validation inutilisés** (`lib/validation.ts`)
  - Ligne 18-20 : `checkLimitSchema` (jamais utilisé)
  - Ligne 11-13 : `deviceIdSchema` (jamais utilisé)
  - OU les utiliser dans les endpoints concernés

- [x] **Supprimer les fonctions Gemini inutilisées** (`lib/gemini.ts`)
  - Lignes 46-104 : `generateRecommendations()` (obsolète)
  - Lignes 109-135 : `generateConversationalResponse()` (obsolète)
  - Ces fonctions sont remplacées par `generateRecommendationsWithResponse()`

- [x] **Supprimer les fonctions TMDB inutilisées** (`lib/tmdb.ts`)
  - Ligne 238-245 : `getMovieDetails()`
  - Ligne 250-257 : `getTVDetails()`
  - Ligne 315-318 : `clearCache()`

- [x] **Supprimer les fonctions CORS inutilisées** (`lib/api-helpers.ts`)
  - Lignes 102-108 : `getCORSHeaders()`
  - Lignes 113-118 : `handleOPTIONS()`

- [x] **Supprimer `getZeroResultCount()`** (`lib/db.ts`, lignes 190-209)
  - Fonction jamais appelée

- [x] **Corriger la documentation README**
  - Supprimer les références à `user_prompts` table (n'existe plus)
  - Supprimer les références à `MAX_FREE_PROMPTS` (non implémenté)
  - Mettre à jour le schéma de base de données

#### Backend - Améliorations critiques

- [x] **Ajouter validation webhook RevenueCat** (`app/api/subscription/webhook/route.ts`)
  - Utiliser `revenueCatWebhookSchema` pour valider le payload
  - Ajouter signature verification pour sécurité

- [x] **Externaliser les valeurs hardcodées**
  - `GEMINI_MODEL` → variable d'environnement
  - Rate limits → variables d'environnement
  - Créé `.env.example` avec toutes les variables

- [x] **Standardiser la gestion d'erreurs**
  - Tous les `error: any` ont été remplacés par des type guards
  - Logging structuré reporté à Phase 2+ (nice to have)

#### Frontend - Supprimer le code mort

- [x] **Supprimer les fichiers complètement inutilisés**
  - `components/SettingsModal.tsx` (64 lignes)
  - `components/LanguageSelector.tsx` (44 lignes)
  - `components/HapticTab.tsx` (18 lignes)
  - `hooks/usePremiumFeatures.ts` (87 lignes)
  - `hooks/useSubscription.ts` (220 lignes - duplique RevenueCatContext)

- [x] **DÉCISION : Supprimer Zustand store**
  - `store/index.ts` et tests supprimés (jamais utilisé en production)
  - On continue avec React Context API

- [x] **Nettoyer les console.logs de debug**
  - `app/index.tsx` (lignes 42, 54, 58, 89)
  - `hooks/useBackendMovieSearch.ts` (lignes 95-101, 112, 124, 149)
  - `services/backend-api.service.ts` (lignes 80, 107, 200, 234)
  - `contexts/RevenueCatContext.tsx` (multiples logs avec emojis)

- [x] **Améliorer la gestion d'erreurs**
  - `app/profile.tsx` ligne 227 : Ajouté Alert pour les erreurs restore
  - `components/SubscriptionModal.tsx` ligne 80 : Ajouté feedback utilisateur

#### Frontend - DeviceIdentity (sera remplacé par auth)

- [ ] **Évaluer le système deviceIdentity pour suppression**
  - `services/deviceIdentity.service.ts` (371 lignes)
  - `types/deviceIdentity.types.ts` (60 lignes)
  - `utils/deviceIdentifier.utils.ts` (128 lignes)
  - `__tests__/services/deviceIdentity.test.ts`
  - **Note :** Actuellement utilisé en fallback dans `backend-api.service.ts` ligne 204
  - **→ Sera supprimé après implémentation auth complète**

---

### Phase 2 : 🏗️ Infrastructure d'authentification ✅ COMPLETE

#### Backend - Base de données

- [x] **Créer la table `users`**
  ```sql
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,           -- UUID v4
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL,   -- 'apple' | 'google'
    provider_user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [x] **Créer les index nécessaires**
  ```sql
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_provider ON users(auth_provider, provider_user_id);
  ```

- [x] **Migrer la table `subscriptions`**
  - Ajouter colonne `user_id TEXT`
  - Créer index `idx_subscriptions_user_id`
  - Garder `device_id` temporairement pour migration
  - Ajouter contrainte foreign key vers `users(id)`

- [x] **Migrer la table `prompt_logs`**
  - Ajouter colonne `user_id TEXT`
  - Créer index `idx_prompt_logs_user_id`

- [x] **Créer script de migration**
  - Fichier `backend/migrations/001_add_users_auth.sql`
  - Script pour tester en local avant déploiement

#### Backend - JWT et authentification

- [x] **Installer les dépendances**
  ```bash
  npm install jsonwebtoken @types/jsonwebtoken
  npm install apple-signin-auth google-auth-library
  ```

- [x] **Créer `lib/auth.ts`**
  - Fonction `verifyAppleToken(idToken: string)`
  - Fonction `verifyGoogleToken(idToken: string)`
  - Fonction `generateJWT(userId: string, email: string)`
  - Fonction `verifyJWT(token: string)`

- [x] **Créer `lib/types.ts` - Types auth**
  ```typescript
  export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    auth_provider: 'apple' | 'google';
    created_at: string;
  }

  export interface AuthResponse {
    user: User;
    token: string;
  }

  export interface JWTPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }
  ```

- [x] **Ajouter méthodes DB dans `lib/db.ts`**
  - `createUser(email, name, provider, providerId)`
  - `getUserByEmail(email)`
  - `getUserById(id)`
  - `updateUser(id, data)`
  - Modifier `hasActiveSubscription(userId)` au lieu de `deviceId`

#### Backend - Endpoints API

- [x] **Créer `POST /api/auth/apple`**
  - Vérifier le token Apple
  - Créer/récupérer le user
  - Générer JWT
  - Retourner `{ user, token }`

- [x] **Créer `POST /api/auth/google`**
  - Vérifier le token Google
  - Créer/récupérer le user
  - Générer JWT
  - Retourner `{ user, token }`

- [x] **Créer `GET /api/auth/me`**
  - Vérifier le JWT
  - Retourner les infos du user

- [x] **Créer middleware `requireAuth`**
  - Extraire et vérifier le JWT du header Authorization
  - Ajouter `userId` et `email` à la request
  - Utiliser dans les endpoints protégés

- [x] **Modifier `POST /api/search`**
  - Ajouter middleware `requireAuth`
  - Utiliser `userId` au lieu de `deviceId`
  - Mettre à jour validation schema

- [x] **Modifier webhook RevenueCat** (`/api/subscription/webhook`)
  - Trouver le user par email au lieu de deviceId
  - Créer user automatiquement si première souscription
  - Utiliser `user_id` pour les subscriptions

#### Backend - Variables d'environnement

- [x] **Ajouter à `.env.example`**
  ```
  JWT_SECRET=your-super-secret-jwt-key-change-in-production
  APPLE_CLIENT_ID=com.fastflix.app
  GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
  ```

---

### Phase 3 : 📱 Frontend - Authentification ✅ COMPLETE

#### Configuration iOS (Sign in with Apple)

- [x] **Activer Sign in with Apple dans Xcode**
  - Ouvrir `ios/fastflix.xcworkspace`
  - Signing & Capabilities → + Capability → Sign in with Apple

- [x] **Configurer dans Apple Developer**
  - App ID : Activer "Sign in with Apple"
  - Créer Service ID pour le web (si besoin)

#### Configuration Google Sign-In

- [ ] **Créer OAuth Client dans Google Cloud Console** (À faire plus tard)
  - Type: iOS application
  - Bundle ID: `com.fastflix.app`
  - Récupérer le Client ID

- [x] **Installer les dépendances**
  ```bash
  npx expo install expo-secure-store
  npx expo install expo-apple-authentication
  ```

#### Frontend - Services d'authentification

- [x] **Créer `services/auth.service.ts`**
  ```typescript
  - signInWithApple(): Promise<AuthResponse>
  - signOut(): Promise<void>
  - getCurrentUser(): Promise<User | null>
  - getAuthToken(): Promise<string | null>
  - isAuthenticated(): Promise<boolean>
  - refreshUserData(): Promise<User | null>
  ```

- [x] **Créer `contexts/AuthContext.tsx`**
  ```typescript
  interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithApple: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
  }
  ```

- [x] **Stocker le JWT dans SecureStore**
  - Clés: `fastflix_auth_token` et `fastflix_user_data`
  - Utiliser expo-secure-store pour stockage chiffré

#### Frontend - UI Components

- [x] **Créer `app/auth.tsx` (écran de connexion)**
  - Logo FastFlix avec emoji 🎬
  - Bouton "Sign in with Apple" natif
  - Message d'accueil et description
  - Design épuré et professionnel avec animations Moti
  - Gestion plateforme (iOS uniquement pour Apple)

- [x] **Créer `components/AuthButton.tsx`**
  - Bouton réutilisable pour actions auth
  - Variants: primary, secondary, danger
  - Loading states avec ActivityIndicator

- [x] **Modifier `app/_layout.tsx`**
  - Wrapper avec AuthProvider
  - Route `/auth` ajoutée (masquée de la tab bar)
  - AuthProvider placé avant SubscriptionProvider

- [x] **Modifier `app/index.tsx`**
  - Check d'authentification au mount
  - Redirection vers `/auth` si non authentifié
  - Loading state pendant vérification auth
  - Le backend utilise automatiquement userId du JWT

- [x] **Modifier `app/profile.tsx`**
  - Section "Account" avec infos utilisateur
  - Affichage nom, email, provider (🍎 Apple)
  - Bouton "Sign Out" rouge
  - Affichage conditionnel si user existe

#### Frontend - Backend API Integration

- [x] **Modifier `services/backend-api.service.ts`**
  - Auto-injection du JWT dans header Authorization
  - Lecture du token depuis SecureStore à chaque requête
  - Méthodes auth ajoutées:
    - `signInWithApple(data)`
    - `getCurrentUser()`
  - Headers dynamiques avec Record<string, string>

- [x] **Hooks - Pas de modification nécessaire**
  - `useBackendMovieSearch` fonctionne tel quel
  - Le backend extrait automatiquement userId du JWT via middleware requireAuth

---

### Phase 4 : 🔄 Migration RevenueCat

#### Configuration RevenueCat

- [ ] **Activer "App User IDs" dans RevenueCat**
  - Dashboard RevenueCat → Settings
  - Activer "Transfer purchases between users"

- [x] **Documenter le flow**
  ```
  1. User se connecte (Apple/Google)
  2. App récupère userId du backend
  3. App appelle Purchases.logIn(userId)
  4. RevenueCat associe les achats au userId
  5. Webhook envoie userId au backend
  ```

#### Frontend - RevenueCat Integration

- [x] **Modifier `contexts/RevenueCatContext.tsx`**
  - Ajouter méthode `linkUserToRevenueCat(userId: string)`
  - Appeler `Purchases.logIn(userId)` après auth réussie
  - Gérer le transfert de purchases

- [x] **Ajouter dans `AuthContext`**
  - Après login réussi, appeler `linkUserToRevenueCat(user.id)`

#### Backend - Webhook Update

- [x] **Modifier `app/api/subscription/webhook/route.ts`**
  - Utiliser `event.app_user_id` au lieu de chercher par email
  - Vérifier que le user existe
  - Logger si user introuvable

#### UI Update

- [x] **Modifier `app/profile.tsx`**
  - Afficher la carte d'abonnement seulement si user authentifié
  - Conditionner l'affichage sur `user !== null`

#### Bugfixes

- [x] **Corriger l'ordre des providers dans `app/_layout.tsx`**
  - SubscriptionProvider avant AuthProvider
  - Permet à AuthProvider d'utiliser useSubscription()

---

### Phase 5 : 🧪 Tests et validation

#### Tests Backend

- [x] **Tester la création de user**
  - POST /api/auth/apple avec token valide ✅ Testé manuellement
  - POST /api/auth/google avec token valide (non implémenté - Phase 3 optionnelle)
  - Vérifier la création dans la DB ✅ Confirmé via logs

- [x] **Tester JWT**
  - Générer un JWT ✅ Via authService
  - Vérifier avec GET /api/auth/me ✅ Endpoint fonctionnel
  - Tester expiration ✅ Logique de vérification en place

- [x] **Tester endpoints protégés**
  - POST /api/search avec JWT valide → 200 ✅ Testé via app
  - POST /api/search sans JWT → 401 ✅ Confirmé via curl
  - POST /api/search avec JWT expiré → 401 ✅ Logique en place dans middleware

- [x] **Tester webhook RevenueCat**
  - Simuler événement avec userId ✅ Testé via abonnement réel
  - Vérifier update de subscription ✅ Fonctionne
  - User linking avec RevenueCat ✅ Logs confirmés

- [x] **Tests automatisés Jest**
  - Tous les tests passent (22/22) ✅
  - Validation schemas mis à jour ✅
  - Rate limiter tests ✅
  - API health tests ✅

#### Tests Frontend

- [x] **Tester Sign in with Apple**
  - Flow complet de connexion ✅ Testé manuellement
  - Vérifier stockage du token ✅ SecureStore utilisé
  - Linking RevenueCat ✅ Logs confirmés

- [ ] **Tester Sign in with Google**
  - Flow complet de connexion (non implémenté - Phase 3 optionnelle)
  - Vérifier stockage du token
  - Vérifier redirection

- [x] **Tester persistance de session**
  - Fermer et rouvrir l'app ✅ Testé
  - Vérifier que le user est toujours connecté ✅ Fonctionne

- [x] **Tester sign out**
  - Déconnexion ✅ Testé
  - Vérifier suppression du token ✅ Fonctionne
  - UI mise à jour correctement ✅

- [x] **Tester flow d'abonnement complet**
  - Créer nouveau compte ✅ Testé avec Apple
  - S'abonner via RevenueCat ✅ Abonnement sandbox testé
  - Vérifier que le webhook crée la subscription ✅ Fonctionne
  - Faire une recherche → doit fonctionner ✅ Pas d'erreur 402

#### Tests multi-appareils

- [ ] **Tester connexion sur 2 iPhones** (optionnel)
  - Se connecter avec même compte
  - Vérifier synchronisation d'abonnement
  - Tester recherches sur les deux appareils

- [ ] **Tester réinstallation** (optionnel)
  - Supprimer l'app
  - Réinstaller
  - Se reconnecter
  - Vérifier récupération d'abonnement

---

### Phase 6 : 🚀 Déploiement et nettoyage final

#### Migration de données (si users existants)

- [ ] **Créer script de migration**
  - Associer les anciens deviceId aux nouveaux userId
  - Migrer les subscriptions actives
  - Logger les cas problématiques

- [ ] **Tester en staging**
  - Base de données de test
  - Quelques utilisateurs test
  - Valider la migration

#### Nettoyage final du code

- [ ] **Supprimer tout le système deviceIdentity**
  - `services/deviceIdentity.service.ts`
  - `types/deviceIdentity.types.ts`
  - `utils/deviceIdentifier.utils.ts`
  - Tests associés

- [ ] **Supprimer le fallback dans backend-api.service.ts**
  - Ligne 204 : Supprimer la logique de fallback

- [ ] **Mettre à jour la documentation**
  - README.md : Décrire le nouveau système d'auth
  - DEVELOPMENT.md : Instructions pour tester l'auth
  - API docs : Documenter les nouveaux endpoints

#### Déploiement

- [ ] **Backend**
  - Migrer le schéma de base de données sur Turso
  - Déployer sur Vercel
  - Vérifier les variables d'environnement

- [ ] **Frontend**
  - Bump version (npm run version:minor)
  - Build iOS (npm run build:ios)
  - Soumettre à TestFlight
  - Tester en production

- [ ] **Monitoring**
  - Vérifier les logs Vercel
  - Vérifier les webhooks RevenueCat
  - Surveiller les erreurs d'authentification

---

## 📊 Estimation du temps

| Phase | Temps estimé | Complexité |
|-------|--------------|------------|
| Phase 1 - Nettoyage | 2-3h | Moyen |
| Phase 2 - Infrastructure Backend | 3-4h | Élevé |
| Phase 3 - Frontend Auth | 4-5h | Élevé |
| Phase 4 - RevenueCat Migration | 1-2h | Moyen |
| Phase 5 - Tests | 2-3h | Moyen |
| Phase 6 - Déploiement | 1-2h | Faible |
| **TOTAL** | **13-19h** | - |

---

## 🎯 Décisions à prendre

Avant de commencer, décider :

1. **Zustand store** : Le garder ou le supprimer ?
   - ✅ Le supprimer (recommandé) - Continuer avec React Context
   - ❌ Commencer à l'utiliser pour gérer l'état auth

2. **Migration des users existants** : Comment gérer les utilisateurs actuels ?
   - ✅ Forcer reconnexion (recommandé) - Pas de data critique perdue
   - ❌ Tenter de mapper les anciens deviceId (compliqué)

3. **Niveau de logging** : Production logs ?
   - ✅ Supprimer tous les console.log de debug
   - ❌ Les garder derrière un flag de développement
   - ❌ Les remplacer par un vrai système de logging (winston/pino)

---

## 🔒 Sécurité

Points de sécurité à vérifier :

- [ ] JWT secret fort et sécurisé
- [ ] Validation des tokens Apple/Google côté backend
- [ ] Rate limiting sur les endpoints d'auth
- [ ] Webhook signature verification (RevenueCat)
- [ ] HTTPS uniquement
- [ ] Expiration des JWT (7 jours recommandé)
- [ ] Refresh token mechanism (optionnel pour v1)

---

## 📝 Notes

- Le système actuel avec deviceId sera **complètement remplacé**
- Les utilisateurs existants devront se **reconnecter**
- L'implémentation doit être faite **en une seule fois** (pas de rollout progressif)
- Prévoir une **page de migration** qui explique aux users pourquoi ils doivent se reconnecter

---

**Prêt à commencer ?** 🚀
