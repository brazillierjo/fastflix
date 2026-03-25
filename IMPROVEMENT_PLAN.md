# FastFlix v3.0 - Plan d'amelioration complet

> **Objectif principal** : Convertir les utilisateurs en essai gratuit en abonnes payants
> **Date** : 25 mars 2026
> **Basé sur** : Audit complet du code, comparaison avec Mio Tutor, skills de retention/monetisation/ASO/UX

---

## Table des matieres

1. [Diagnostic du probleme](#1-diagnostic-du-probleme)
2. [Onboarding et premiere experience](#2-onboarding-et-premiere-experience)
3. [Paywall et monetisation](#3-paywall-et-monetisation)
4. [Fonctionnalites d'engagement et retention](#4-fonctionnalites-dengagement-et-retention)
5. [Amelioration du systeme IA](#5-amelioration-du-systeme-ia)
6. [UI/UX Premium iOS-native](#6-uiux-premium-ios-native)
7. [Compatibilite Android](#7-compatibilite-android)
8. [Backend et robustesse](#8-backend-et-robustesse)
9. [ASO et marketing](#9-aso-et-marketing)
10. [Analytics et mesure](#10-analytics-et-mesure)
11. [Priorites et roadmap](#11-priorites-et-roadmap)

---

## 1. Diagnostic du probleme

### Pourquoi personne ne convertit

L'analyse du code revele plusieurs problemes fondamentaux :

**Pas de "Aha Moment" clair** : L'app demande de s'inscrire avant de montrer la moindre valeur. Auth -> Search -> Resultats. L'utilisateur n'a aucune idee de ce qu'il obtient avant de s'engager.

**Valeur percue insuffisante pour un abonnement** : L'app fait UNE chose (recommander des films via IA) mais ne cree pas de valeur recurrente. Pourquoi payer chaque mois pour un service qu'on utilise 2-3 fois quand on cherche quoi regarder ?

**Pas de boucle d'engagement** : Contrairement a Mio qui a des streaks, XP, daily challenges, leaderboard, badges - FastFlix n'a aucun mecanisme de retour quotidien. Pas de push notifications, pas de contenu frais, pas de raison de revenir.

**Paywall basique** : Le `SubscriptionModal` est fonctionnel mais ne communique qu'une seule feature ("Unlimited Recommendations"). Pas de social proof, pas d'urgence, pas de demonstration de valeur.

**Pas d'onboarding** : L'ecran d'auth montre juste "AI-powered movie & TV show recommendations" et deux boutons. Aucune demonstration de la valeur, pas de walkthrough, pas de personalisation.

---

## 2. Onboarding et premiere experience

### 2.1 Onboarding flow avant auth

- [x] **Ecrans d'onboarding swipeable (4 ecrans)** avant l'auth ✅
  - Ecran 1 : "Find what to watch tonight" + film icon avec glow animé
  - Ecran 2 : "AI learns your taste" + sparkles icon
  - Ecran 3 : "Filter by your platforms" + grille 6 plateformes avec animations
  - Ecran 4 : "Your smart watchlist" + bookmark icon + CTA "Get Started"
  - Dot indicators, Skip, Next/Get Started, stockage AsyncStorage

- [x] **Permettre un essai SANS inscription** (value-first) ✅
  - Guest mode : home + search accessibles sans auth
  - AuthGate component pour les actions premium (watchlist, etc.)
  - Le home montre trending + daily pick sans authentification

### 2.2 Personalisation au premier lancement

- [x] **Ecran de selection des plateformes** au premier lancement ✅
  - setup.tsx step 1 : grille 3 colonnes avec 12 plateformes (Netflix, Prime, Disney+, HBO, Apple TV+, Hulu, Paramount+, Peacock, Crunchyroll, Canal+, OCS, Salto)
  - Brand colors, checkmark overlay, haptic feedback
  - Stockage AsyncStorage @fastflix/setup_platforms

- [x] **Selection du pays/region** automatique ✅
  - Detection auto via expo-localization
  - Stockage @fastflix/setup_country

- [x] **Selection des genres preferes** ✅
  - setup.tsx step 2 : grille 3 colonnes avec 12 genres + icones Ionicons
  - Minimum 3 genres requis, haptic feedback
  - Stockage AsyncStorage @fastflix/setup_genres

### 2.3 Premier "Quick Win" (temps < 60 secondes)

- [x] **Recommandation instantanee** basee sur les preferences ✅
  - Home screen affiche "Recommended for you" basé sur les genres sélectionnés
  - Trending filtré par genres de l'utilisateur
  - Valeur visible dès le premier lancement, sans auth

---

## 3. Paywall et monetisation

### 3.1 Refonte du paywall (SubscriptionModal)

- [x] **Paywall "feature-rich"** au lieu du paywall minimaliste actuel ✅
  - Hero section avec gradient + diamond icon animé
  - 5 benefices avec icones et checkmarks (sparkles, funnel, bookmark, star, time)
  - Social proof : "Join 10,000+ movie lovers" + 5 etoiles dorées + "Rated 4.9 stars"
  - Animations séquentielles MotiView (0-1000ms stagger)

- [x] **Ameliorer la presentation des prix** ✅
  - Plan annuel EN PREMIER avec badge "BEST VALUE" (trophy icon, vert plein) + prix/semaine
  - Plan trimestriel avec badge "POPULAR" (outline)
  - Plan mensuel en dernier comme ancre de prix
  - Prix barré sur les plans avec réduction

- [x] **Paywall contextuel** (montrer au bon moment) ✅
  - Apres 3 recherches gratuites (quota backend), pas au premier blocage
  - HTTP 429 avec message clair quand quota dépassé
  - Paywall affiché après avoir montré de la valeur

- [x] **Soft paywall vs hard paywall** ✅
  - Free tier : 3 recherches/jour + 5 ajouts watchlist/jour (backend quotas)
  - Premium : Illimité
  - L'utilisateur continue d'utiliser l'app même sans payer

### 3.2 Strategie de trial

- [x] **Communication pendant le trial** ✅
  - TrialBanner.tsx : bandeau adaptatif sur le home (jour 1-7, couleur verte→orange→rouge)
  - TrialEndingModal.tsx : modal d'urgence jours 5/6/7 (affiché une fois par milestone)
  - Messages personnalisés par jour avec features à perdre
  - Dismiss par jour (AsyncStorage), CTA "Subscribe Now"
  - 6 langues traduites

- [x] **Compteur de trial visible dans l'app** ✅
  - Barre de progression Netflix red dans le profil
  - "X days remaining in your free trial" avec calcul depuis RevenueCat
  - TrialBanner sur le home screen avec messages adaptes par jour (1-7)

### 3.3 Free tier (au lieu du tout-ou-rien)

- [x] **Implementer un vrai free tier avec limitations** ✅
  - 3 recherches IA par jour (backend enforced, HTTP 429)
  - 5 ajouts watchlist par jour
  - Quota info retournée dans la réponse search (remainingSearches, isPremium)

- [x] **Backend : gestion des quotas** ✅
  - Table `user_quotas` avec comptage journalier
  - Endpoint `GET /api/quotas` pour vérifier usage + limites
  - Search route intègre le check quota + incrément + sauvegarde historique
  - Table `search_history` + endpoint `GET /api/search/history`
  - Table `user_taste_profile` + endpoints GET/PUT + POST rate

---

## 4. Fonctionnalites d'engagement et retention

### 4.1 Recommandation du jour (Daily Pick)

- [x] **Feature "Film du Jour" sur l'ecran d'accueil** ✅
  - Endpoint `GET /api/daily-pick` avec seed deterministe (userId + date)
  - Enrichi avec streaming providers via TMDB
  - Affiche sur le home screen avec poster, note, overview, plateformes

- [x] **"Trending this week"** section ✅
  - Endpoint `GET /api/trending` (TMDB trending/all/week)
  - Filtre par plateformes de l'utilisateur
  - Cache-Control: max-age=3600
  - Affiche en scroll horizontal sur le home screen

### 4.3 Watchlist amelioree

- [x] **Marquage "Vu" avec note personnelle** ✅
  - Endpoint `POST /api/watchlist/:id/watched` (watched, rating 1-5, note)
  - Colonnes watchlist: watched, watched_at, user_rating, user_note
  - Migration 007 executee sur Turso
  - Sections "To Watch" / "Watched" / "All" dans la watchlist frontend

- [x] **Watchlist partageable** ✅
  - Bouton Share dans le header watchlist (share-outline)
  - Share.share() avec texte formaté (titre + liste numérotée des films à voir)
  - 6 langues (shareTitle, shareFooter)

- [x] **Notifications de disponibilite** ✅
  - Endpoint GET /api/watchlist/check-availability (compare providers TMDB vs stockés)
  - useAvailabilityCheck hook (React Query, 1h stale time)
  - Bannières vertes "Now on Netflix!" dismissables sur la watchlist
  - Badge "NEW" vert sur les logos de providers récemment ajoutés dans WatchlistItem

- [x] **Sections dans la watchlist** ✅ (partiel)
  - Sections "To Watch" / "Watched" / "All" avec toggle en haut
  - Filtrage par type (Movies / TV Shows / All)
  - Drag & drop pour réorganiser : non implémenté (nécessite react-native-draggable-flatlist)

### 4.4 Push notifications

- [x] **Implementer expo-notifications** ✅
  - notifications.ts service (register, schedule, daily pick reminder a 18h)
  - NotificationPrompt.tsx : modal in-app avant le prompt systeme (apres 3e recherche)
  - Explique les benefices (daily pick, new on platforms, watchlist reminders)
  - Permission demandee au bon moment, pas au lancement

- [x] **Backend notification service** ✅
  - Migration 008_push_tokens.sql (table push_tokens)
  - Endpoint POST /api/notifications/register (save token)
  - savePushToken() dans db.ts

### 4.5 Decouverte de contenu enrichie

- [x] **Categories/Collections curatees** ✅
  - CollectionsSection.tsx avec 8 collections (Cozy Night In, Edge of Your Seat, Timeless Classics, Binge-Worthy, Family Fun, Hidden Gems, LOL Comedies, Sci-Fi Trips)
  - Cards horizontales tappables → lancent la recherche IA avec la query de la collection
  - 6 langues traduites

- [x] **"Pour vous" feed personalise** ✅
  - Endpoint GET /api/for-you (TMDB discover filtre par genres favoris, exclut watchlist)
  - ForYouSection.tsx sur le home screen (cards larges avec poster + info)
  - Teaser flou + "Sign in to unlock" pour les guests
  - React Query 30min stale time

---

## 5. Amelioration du systeme IA

### 5.1 Contexte et memoire

- [x] **Historique de recherches pour l'IA** ✅
  - Table search_history en base, endpoint GET /api/search/history
  - 5 dernieres recherches passees au prompt Gemini comme contexte
  - "Recent searches: [liste]" dans le prompt pour diversifier les recommandations

- [x] **Prise en compte des notes utilisateur** ✅
  - Prompt enrichi avec les films notes 4-5 etoiles (a recommander du similaire)
  - Films notes 1-2 etoiles dans la section "genres to avoid"
  - Section USER PROFILE dans le prompt Gemini

- [x] **Profil de gouts persistant** ✅
  - Table user_taste_profile (favorite_genres, disliked_genres, favorite_decades, rated_movies)
  - Endpoints GET/PUT /api/user/taste-profile + POST rate
  - Transmis automatiquement a chaque appel IA via userContext

### 5.2 Amelioration du prompt

- [x] **Enrichir le prompt Gemini avec des donnees utilisateur** ✅
  - Profil de goûts (genres, decades, films notés) passé au prompt
  - 5 dernières recherches passées au prompt pour diversifier
  - Section USER PROFILE dans le prompt Gemini
  - Fallback TMDB trending si l'IA échoue

- [x] **Multi-turn conversations** ✅
  - conversationHistory dans le body search (array {role, content})
  - Gemini reçoit le contexte des échanges précédents
  - Input "Refine your results..." sous les résultats frontend

- [x] **Recommandations par similarite** ✅
  - Endpoint `GET /api/similar/:tmdbId?type=movie|tv`
  - Proxy TMDB `/movie/{id}/similar` enrichi avec streaming providers
  - Section "You might also like" dans l'ecran de detail film

### 5.3 Performance et fiabilite

- [x] **Caching des resultats IA** ✅
  - Cache in-memory (Map) dans search/route.ts avec clé MD5(query+types+filters)
  - TTL 24h, cache stats logging
  - Réduit les coûts Gemini API sur les recherches identiques

- [x] **Fallback si l'IA echoue** ✅
  - gemini.ts retourne isFallback: true au lieu de throw
  - search route recupere TMDB trending comme backup
  - Message: "Our AI is temporarily unavailable" + trending results

- [x] **Optimisation enrichment TMDB** ✅
  - Enrichment parallélisé avec Promise.all par batch de 5
  - Poster, providers, credits, details tous en parallèle par film
  - Skeleton screens pendant le chargement (LoadingState.tsx)

---

## 6. UI/UX Premium iOS-native

### 6.1 Design system iOS-natif

- [x] **Adopter le material system iOS** ✅
  - Tab bar avec blur subtil (intensity 40), pill active style
  - getSubtleCardStyle, getSystemBackground, getSecondaryBackground dans designHelpers
  - Haptics centralisés (haptics.ts)

- [x] **Typographie SF Pro** ✅
  - typography object dans designHelpers (largeTitle→caption2, 11 niveaux)
  - Appliquée sur home.tsx (title1 greeting, title3 sections) et profile.tsx (largeTitle header)

- [x] **Palette de couleurs raffinee** ✅
  - iosColors dans designHelpers (system colors + grays + backgrounds light/dark)
  - Backgrounds iOS: #F2F2F7 (light grouped), #000000/#1C1C1E (dark)
  - Separators, system grays conformes HIG

### 6.2 Navigation et structure

- [x] **Tab bar a 4 onglets** (au lieu de 2 + pages cachees) ✅
  - Home (home/home-outline) - Feed + daily pick + trending
  - Search (search/search-outline) - Recherche IA
  - Watchlist (bookmark/bookmark-outline) - Accès direct
  - Profile (person/person-outline)
  - Labels uniquement sur l'onglet actif, icônes seules pour les inactifs

- [x] **Navigation stack propre** ✅
  - movie-detail.tsx avec Animated.ScrollView + parallax hero + BlurView back button
  - Transitions fluides via Expo Router
  - Geste swipe-back natif (géré par React Navigation)

### 6.3 Ecran d'accueil repense

- [x] **Home screen riche** (remplacer l'ecran de recherche actuel) ✅
  - Header : "Hello!" + nom utilisateur + date
  - Quick search bar → navigue vers l'onglet Search
  - Daily pick card (placeholder, prêt pour l'API)
  - Section "Trending" avec skeleton cards horizontales
  - Section "Recent searches" avec chips
  - Section "Continue exploring"
  - Animations MotiView stagger, dark mode support

### 6.4 Loading states premium

- [x] **Skeleton screens** pour tous les chargements ✅
  - Skeleton.tsx custom avec shimmer Reanimated (SkeletonCard, SkeletonRow, SkeletonCircle)
  - LoadingState.tsx refait : skeletons au lieu d'ActivityIndicator

- [x] **Animations significatives** ✅
  - AnimatedCheckmark.tsx pour l'ajout watchlist (cercle vert + checkmark animé)
  - Haptics centralisés (haptics.ts) intégrés dans AddToWatchlistButton
  - Movie-detail parallax hero avec Animated.ScrollView
  - MotiView stagger animations sur toutes les listes

### 6.5 Detail d'un film (ecran dedie)

- [x] **Ecran de detail full-screen** au lieu de l'expansion in-place ✅
  - movie-detail.tsx avec hero image plein ecran + LinearGradient
  - Synopsis complet, genres en chips, info (duree/saisons/annee)
  - Casting en scroll horizontal avec photos
  - Section "You might also like" (films similaires)
  - Boutons: Add to Watchlist + Mark as Watched + Share
  - Lien TMDB, back button flottant sur le hero
  - MovieResults.tsx simplifie: tap navigue vers le detail

## 8. Backend et robustesse

### 8.1 Nouvelles tables et endpoints

- [x] **Table `user_taste_profile`** ✅ (migration 006)
- [x] **Table `user_quotas`** ✅ (migration 006)
- [x] **Table `daily_picks`** ✅ (fonctionne sans table dédiée, via seed deterministe)
- [x] **Table `user_activity`** ✅ (migration 009, recordActivity dans db.ts)
- [x] **Table `search_history`** ✅ (migration 006)

### 8.2 Nouveaux endpoints

- [x] `GET /api/home` ✅ - Feed agrégé (daily pick + trending + recent searches + quota)
- [x] `GET /api/daily-pick` ✅ - Recommandation du jour (seed userId + date)
- [x] `GET /api/trending` ✅ - TMDB trending/all/week avec filtrage plateformes
- [x] `GET /api/similar/:tmdbId` ✅ - Films similaires enrichis providers
- [x] `GET /api/user/taste-profile` ✅ - GET/PUT profil de goûts
- [x] `POST /api/user/taste-profile/rate` ✅ - Noter un film (1-5)
- [x] `GET /api/user/stats` ✅ - Stats (searches, watchlist, streak, memberSince)
- [x] `POST /api/watchlist/:id/watched` ✅ - Marquer vu + rating + note
- [x] `GET /api/search/history` ✅ - 20 dernières recherches

### 8.3 Performance et infrastructure

- [x] **Caching in-memory** ✅
  - Cache Map dans search/route.ts (clé MD5, TTL 24h)
  - Cache-Control headers sur trending (1h), for-you (30min)
  - Redis/Vercel KV pour plus tard si besoin de cache distribué

- [x] **Rate limiting ameliore** ✅
  - Rate limit par tier (free vs premium) dans rate-limiter.ts
  - Free : 10 req/min standard, 3 recherches/semaine
  - Premium : 60 req/min, recherches illimitées
  - Appliqué sur trending, daily-pick, home, for-you, similar

- [x] **Monitoring et alertes** ✅
  - Logging structuré avec timing par étape (gemini call, TMDB enrichment, total)
  - Cache hit/miss logging
  - Quota check logging
  - AI fallback event logging

### 8.4 Securite

- [x] **Validation Zod sur tous les nouveaux endpoints** ✅
  - notifications/register, watchlist/:id/watched, taste-profile/rate, taste-profile PUT, similar/:tmdbId
- [ ] **Protection CSRF** pour les endpoints sensibles
- [x] **Sanitisation des inputs** avant passage au prompt IA ✅
  - sanitizeInput() dans gemini.ts : supprime prompt injection patterns, JSON, limite 1000 chars

---

## 9. ASO et marketing

### 9.1 Optimisation App Store (iOS)

- [ ] **Titre optimise**
  - Actuel (probablement) : "FastFlix"
  - Propose : "FastFlix - AI Movie Finder" (inclut keyword dans le titre)

- [ ] **Sous-titre (30 chars)**
  - "What to Watch Tonight? Ask AI"
  - Inclut les termes "watch", "AI" - recherches populaires

- [ ] **Keywords (100 chars)**
  - Mots-cles cibles : movie,recommendations,what to watch,streaming,netflix,films,tv shows,ai,tonight,suggestions
  - Pas de duplication avec le titre/sous-titre
  - Pas de termes interdits ("best", "free", "#1")

- [ ] **Description App Store**
  - Premiere phrase accrocheuse (visible avant "Lire plus")
  - Benefices avant features
  - Social proof si disponible
  - Mots-cles integres naturellement

- [ ] **Screenshots optimises**
  - 5-6 screenshots avec captions accrocheuses
  - Premier screenshot = proposition de valeur principale
  - Montrer l'app en action (pas des mockups vides)
  - Captions lisibles et orientees benefice

- [ ] **Video preview App Store**
  - 15-30 secondes montrant le flow : recherche -> resultats -> watchlist
  - Debut accrocheur dans les 3 premieres secondes


### 9.3 Localisation ASO

- [ ] **Metadata localisees** pour les 6 langues supportees
  - Pas de simple traduction -> adaptation par marche
  - Keywords specifiques par pays/langue
  - FR, EN, DE, ES, IT, JA

### 9.4 Marketing et acquisition

- [ ] **Landing page / website ameliore**
  - Le website existe mais verifier qu'il est optimise pour la conversion
  - CTA clair vers l'App Store
  - SEO pour "what to watch" / "movie recommendations"

- [x] **In-app review prompt** ✅
  - useInAppReview hook avec expo-store-review
  - Prompt apres 5e recherche, 7 jours d'utilisation, ou 10 ajouts watchlist

---

## 11. Priorites et roadmap

### Phase 1 - Quick Wins (Semaines 1-2)
*Impact maximum, effort minimum. Objectif : commencer a voir des conversions.*

- [x] Refonte du paywall (design + features list + social proof) ✅
- [x] Free tier avec 3 recherches/semaine (au lieu du mur direct) ✅
- [x] Compteur de trial visible dans l'app ✅ (barre de progression dans profile)
- [x] In-app review prompt apres moments positifs ✅ (useInAppReview hook)
- [x] Fix : l'ecran d'accueil ne devrait pas etre JUSTE un champ de recherche ✅

### Phase 2 - Onboarding et valeur (Semaines 3-4)
*Montrer la valeur avant de demander quoi que ce soit.*

- [x] Ecrans d'onboarding swipeable (4 ecrans) ✅
- [x] Selection des plateformes au premier lancement ✅
- [x] Selection des genres preferes ✅
- [x] "Recommandation du jour" sur l'ecran d'accueil (placeholder prêt) ✅
- [x] Section "Trending sur vos plateformes" (placeholder prêt) ✅
- [x] Communication trial ✅ (TrialBanner + TrialEndingModal in-app, push daily pick schedulé)

### Phase 3 - Engagement (Semaines 5-8)
*Creer des raisons de revenir chaque jour.*

- [x] Push notifications (expo-notifications) ✅
- [ ] Systeme de streak
- [x] Marquage "Vu" avec note dans la watchlist ✅
- [x] Historique de recherches pour context IA ✅
- [x] Profil de gouts et amelioration du prompt IA ✅
- [x] Ecran de detail film full-screen ✅ (movie-detail.tsx)
- [x] Films similaires via TMDB ✅ (GET /api/similar/:tmdbId)

### Phase 4 - Premium feel (Semaines 9-12)
*Rendre l'app digne d'un abonnement.*

- [x] Refonte UI iOS-native ✅ (tab bar raffinée, design helpers, haptics.ts)
- [x] Navigation a 4 onglets (Accueil, Recherche, Watchlist, Profil) ✅
- [x] Home screen riche avec feed personalise ✅
- [x] Skeleton screens et animations premium ✅ (Skeleton.tsx avec shimmer reanimated)
- [x] Categories/Collections curatees ✅ (8 collections sur le home: cozy, thriller, classic, binge, family, hidden gems, comedies, sci-fi)
- [x] Watchlist partageable ✅ (bouton Share avec texte formaté)
- [x] Notifications de disponibilite ✅ (check-availability endpoint + useAvailabilityCheck hook + bannière alertes)

### Phase 5 - Android et expansion (Semaines 13-16)
*Doubler l'audience potentielle.*

- [ ] Authentication Android (Google Sign-In)
- [ ] RevenueCat Google Play Billing
- [ ] Adaptations UI Android
- [ ] Build et tests Android
- [ ] Google Play Store listing
- [ ] ASO optimise pour les deux stores

### Phase 6 - Optimisation continue (Ongoing)
*Mesurer, iterer, ameliorer.*

- [ ] A/B test du paywall (timing, design, prix)
- [ ] A/B test de l'onboarding flow
- [ ] Optimisation des push notifications (timing, frequence)
- [ ] Ajout de badges et achievements
- [ ] XP system complet
- [ ] Leaderboard entre amis (optionnel)
- [x] Multi-turn conversations IA ✅ (conversationHistory dans search)
- [x] Caching in-memory pour performance ✅ (Map + TTL 24h)
- [ ] ASO localise pour les 6 langues

---

## Metriques de succes

| Metrique | Actuel | Objectif Phase 1 | Objectif Phase 3 | Objectif Phase 6 |
|----------|--------|-------------------|-------------------|-------------------|
| Trial-to-paid | ~0% | 5-10% | 15-25% | 30-40% |
| Day 1 retention | Inconnu | 40% | 50% | 60% |
| Day 7 retention | Inconnu | 20% | 30% | 40% |
| Day 30 retention | Inconnu | 8% | 15% | 25% |
| Recherches/user/jour | ~1 | 2-3 | 3-5 | 5+ |
| Watchlist avg size | Inconnu | 5+ | 10+ | 20+ |
| DAU/MAU | Inconnu | 15% | 25% | 35% |

---

## Notes techniques

### Dependances a ajouter
- `expo-notifications` - Push notifications
- `expo-store-review` - In-app review prompt
- `react-native-skeleton-placeholder` - Skeleton screens
- `lottie-react-native` - Animations premium
- `@gorhom/bottom-sheet` - Bottom sheets natifs (remplacer les modals)

### Patterns Mio a reprendre
- **Zustand** au lieu de React Context pour le state management (plus performant)
- **MMKV** au lieu de SecureStore pour le cache local (10x plus rapide)
- **Pre-fetching** du contenu en background (exercices pre-fetches chez Mio)
- **Quota system** avec shared pools et reset journalier
- **Daily challenge** pattern adapte au cinema

### Migration progressive
- Toutes les nouvelles features doivent etre backward-compatible
- Feature flags pour le rollout progressif
- Tests unitaires pour chaque nouveau endpoint backend
- La migration de Context vers Zustand peut se faire incrementalement
