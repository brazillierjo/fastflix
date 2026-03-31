# FastFlix — Feature Roadmap & Implementation Guide

> Analyse complète de l'existant + plan d'implémentation détaillé pour chaque feature du TODO.
> Dernière mise à jour : 2026-03-30

---

## Table des matières

1. [Features existantes (inventaire complet)](#1-features-existantes)
2. [WOW Effect — Clarifier la valeur IA](#2-wow-effect)
3. [Réduire la friction — Suggestions & Surprise-moi](#3-réduire-la-friction)
4. [Apprentissage automatique — Affiner les goûts](#4-apprentissage-automatique)
5. [Disponibilité réelle — Où regarder](#5-disponibilité-réelle)
6. [Home intelligente — Sections personnalisées](#6-home-intelligente)
7. [Justifier le prix — Free vs Premium](#7-justifier-le-prix)
8. [Features addictives — Rétention](#8-features-addictives)
9. [UI/UX Optimisations](#9-uiux-optimisations)
10. [Mode humeur](#10-mode-humeur)
11. [Notifications de sorties](#11-notifications-de-sorties)
12. [Swipe Discovery (mode TikTok)](#12-swipe-discovery-mode-tiktok)

---

## 1. Features existantes

### Onboarding & Setup

| Feature | Statut | Free/Premium | Fichiers clés |
|---------|--------|--------------|----------------|
| Onboarding swipeable (4 écrans) | **EXISTE** | Free | `frontend/app/onboarding.tsx` |
| Setup 3 étapes (pays, plateformes, genres) | **EXISTE** | Free | `frontend/app/setup.tsx` |
| Authentification Apple Sign In | **EXISTE** | Free | `frontend/app/auth.tsx`, `backend/src/routes/auth.ts` |
| Authentification Google Sign In | **EXISTE** | Free | `frontend/app/auth.tsx`, `backend/src/routes/auth.ts` |
| Mode invité (accès limité sans compte) | **EXISTE** | Free | Tout le frontend gère `isAuthenticated` |

### Home Screen (`frontend/app/(tabs)/home.tsx`)

| Feature | Statut | Free/Premium | Détails |
|---------|--------|--------------|---------|
| Greeting personnalisé + date | **EXISTE** | Free | Prénom extrait du profil utilisateur |
| Daily Pick (reco du jour déterministe) | **EXISTE** | Free | Basé sur trending + affinité utilisateur, `backend/src/routes/discovery.ts` |
| Trending Top 10 avec badges de classement | **EXISTE** | Free | Carousel horizontal, icônes providers, tri par affinité |
| Quick Search (autocomplete TMDB) | **EXISTE** | Free | `frontend/components/QuickSearch.tsx` — films, séries, acteurs |
| New Releases This Week | **EXISTE** | Premium (auth requis) | `frontend/components/NewReleasesSection.tsx`, filtré par plateformes user |
| For You (recos IA personnalisées) | **EXISTE** | Premium (auth requis) | `frontend/components/ForYouSection.tsx`, Gemini AI, toggle Films/Séries |
| Watchlist section (aperçu home) | **EXISTE** | Premium (auth requis) | `frontend/components/WatchlistSection.tsx` |
| Favorite Actors section | **EXISTE** | Premium (auth requis) | `frontend/components/FavoriteActorsSection.tsx` |
| My Ratings section | **EXISTE** | Premium (auth requis) | `frontend/components/MyRatingsSection.tsx` |
| CTA recherche IA animé (typewriter) | **EXISTE** | Free | Shimmer + typewriter sur le bouton |
| Quota restant affiché | **EXISTE** | Free | "X recherches restantes" ou "Illimité" |
| Upgrade prompt (quand quota bas) | **EXISTE** | Free | Affiche si <= 2 recherches restantes |
| Pull-to-refresh | **EXISTE** | Free | Rafraîchit toutes les données |
| Trial Banner | **EXISTE** | Free | `frontend/components/TrialBanner.tsx` |
| Trial Ending Modal (J5, J6, J7) | **EXISTE** | Free | `frontend/components/TrialEndingModal.tsx` |
| Skeleton loaders | **EXISTE** | Free | `frontend/components/Skeleton.tsx` — utilisé partout |
| Spring animations (MotiView) | **EXISTE** | Free | Toutes les sections avec `from/animate/transition` |
| Badge PRO/FREE sur l'icône app | **EXISTE** | Free | Header top-right avec ring dorée pour PRO |

### Search Screen (`frontend/app/(tabs)/search.tsx`)

| Feature | Statut | Free/Premium | Détails |
|---------|--------|--------------|---------|
| Recherche IA (Gemini 2.0 Flash) | **EXISTE** | Limité (3/semaine free, illimité premium) | `backend/src/routes/search.ts` |
| Input multiline avec placeholder animé | **EXISTE** | Free | `frontend/components/SearchForm.tsx` — typewriter cyclique |
| Bouton "No idea?" (suggestion aléatoire) | **EXISTE** | Free | Typewriter + haptics + glow animation |
| Filtres (pays, plateformes, type contenu) | **EXISTE** | Free | `frontend/components/FiltersBottomSheet.tsx` |
| Affinage conversationnel (refine) | **EXISTE** | Premium | Envoie `conversationHistory` au backend |
| Résultats enrichis (poster, note, genres, cast) | **EXISTE** | Free | `frontend/components/MovieResults.tsx` |
| Historique de recherche | **EXISTE** | Premium (auth requis) | `frontend/app/search-history.tsx` — copie clipboard |
| Icône historique en haut à droite | **EXISTE** | Premium (auth requis) | Sur l'écran search, accès rapide |
| AuthGate pour guests après résultats | **EXISTE** | Free | Popup sign-in après 1.5s |
| Notification prompt (après 3 recherches) | **EXISTE** | Free | `frontend/components/NotificationPrompt.tsx` |
| Cache des résultats IA (24h) | **EXISTE** | N/A (backend) | `searchCache` dans `search.ts` |
| Fallback trending si IA échoue | **EXISTE** | Free | Affiche trending items |
| Smart platform filtering | **EXISTE** | Free | Filtre par plateforme + fallback si trop peu de résultats |

### Movie Detail (`frontend/app/movie-detail.tsx`)

| Feature | Statut | Free/Premium | Détails |
|---------|--------|--------------|---------|
| Hero Section (poster plein écran + parallax) | **EXISTE** | Free | `frontend/components/movie-detail/HeroSection.tsx` |
| Synopsis | **EXISTE** | Free | Avec skeleton loading |
| Genres (pills) | **EXISTE** | Free | Tags cliquables |
| Runtime / Seasons / Episodes / Year / Status | **EXISTE** | Free | Info détaillée TV + films |
| Streaming Section (où regarder) | **EXISTE** | Free | `frontend/components/movie-detail/StreamingSection.tsx` |
| Cast & Crew Section | **EXISTE** | Free | `frontend/components/movie-detail/CastSection.tsx` |
| Episodes Section (TV) | **EXISTE** | Free | `frontend/components/movie-detail/EpisodesSection.tsx` |
| Similar Movies Section | **EXISTE** | Free | `frontend/components/movie-detail/SimilarSection.tsx` |
| Details & External Links (TMDB, IMDb) | **EXISTE** | Free | `frontend/components/movie-detail/DetailsSection.tsx` |
| Add to Watchlist button | **EXISTE** | Premium (auth requis) | `frontend/components/AddToWatchlistButton.tsx` |
| Mark as Watched | **EXISTE** | Premium (auth requis) | Toggle vu/pas vu |
| Star Rating (1-5) | **EXISTE** | Premium (auth requis) | Apparaît après "Mark Watched" |
| Share button | **EXISTE** | Free | Partage lien TMDB |
| Tagline | **EXISTE** | Free | Citation du film |
| Auto-fetch full details | **EXISTE** | Free | Si données manquantes à l'arrivée |

### Actor Detail (`frontend/app/actor-detail.tsx`)

| Feature | Statut | Free/Premium | Détails |
|---------|--------|--------------|---------|
| Photo hero + parallax scroll | **EXISTE** | Free | Avec gradient overlay |
| Biographie (expand/collapse) | **EXISTE** | Free | Troncature intelligente par phrase |
| Personal Info (birthday, age, birthplace) | **EXISTE** | Free | Card avec icônes |
| Filmographie horizontale | **EXISTE** | Free | Films + TV, tri par date, max 30 |
| IMDb link | **EXISTE** | Free | Bouton jaune IMDb |
| Favorite Actor toggle | **EXISTE** | Premium (auth requis) | Ajouter/retirer des favoris |
| Also known as | **EXISTE** | Free | Noms alternatifs |

### Watchlist (`frontend/app/(tabs)/watchlist.tsx`)

| Feature | Statut | Free/Premium | Détails |
|---------|--------|--------------|---------|
| Liste avec filtres (All / Movies / TV) | **EXISTE** | Premium (auth requis) | Tabs en haut |
| View mode (To Watch / Watched / All) | **EXISTE** | Premium (auth requis) | Toggle 3 modes |
| Swipe to remove | **EXISTE** | Premium (auth requis) | Suppression avec animation |
| Share watchlist (texte) | **EXISTE** | Premium (auth requis) | Partage liste numérotée |
| Refresh providers | **EXISTE** | Premium (auth requis) | Met à jour la dispo streaming |
| Availability change banners | **EXISTE** | Premium (auth requis) | "Now on Netflix!" notifications inline |
| Pull-to-refresh | **EXISTE** | Premium (auth requis) | Rafraîchit liste + providers |
| Watchlist full screen | **EXISTE** | Premium (auth requis) | `frontend/app/watchlist-full.tsx` |

### Profile / Settings (`frontend/app/(tabs)/profile.tsx`)

| Feature | Statut | Free/Premium | Détails |
|---------|--------|--------------|---------|
| Account management | **EXISTE** | Premium (auth requis) | `frontend/components/settings/AccountModal.tsx` |
| Subscription management | **EXISTE** | Premium | `frontend/components/settings/SubscriptionDetailsModal.tsx` |
| Subscription plans | **EXISTE** | Free | `frontend/components/SubscriptionModal.tsx` |
| Default Filters | **EXISTE** | Premium (auth requis) | Pays, plateformes, type de contenu |
| Language selector (multi-langue) | **EXISTE** | Free | ActionSheet avec drapeaux |
| Trial progress bar | **EXISTE** | Free | Barre de progression J1-J7 |
| Bug report (email) | **EXISTE** | Free | Ouvre mailto: |
| Feedback (email) | **EXISTE** | Free | Ouvre mailto: |
| About modal | **EXISTE** | Free | `frontend/components/settings/AboutModal.tsx` |
| Delete account | **EXISTE** | Premium (auth requis) | Soft delete |

### Backend Features

| Feature | Statut | Détails |
|---------|--------|---------|
| Quotas (3 recherches/semaine free) | **EXISTE** | `backend/src/routes/quotas.ts` |
| Rate limiting (IP + user) | **EXISTE** | `backend/src/middleware/rate-limit.ts` |
| RevenueCat webhooks | **EXISTE** | `backend/src/routes/webhook.ts` |
| Push token registration | **EXISTE** | `backend/src/routes/notifications.ts` (enregistrement seulement) |
| Taste profile system | **EXISTE** | `backend/src/routes/user.ts` — genres favoris, films notés, décennies |
| Affinity scoring | **EXISTE** | `backend/src/lib/affinity.ts` — score par genre |
| Sentry error monitoring | **EXISTE** | Frontend + Backend |
| Aptabase analytics | **EXISTE** | Privacy-first, `frontend/services/analytics.ts` |

### Autres

| Feature | Statut | Détails |
|---------|--------|---------|
| Dark/Light mode automatique | **EXISTE** | NativeWind, suit le système |
| Haptic feedback | **EXISTE** | Sur les interactions principales |
| Offline banner | **EXISTE** | `frontend/components/OfflineBanner.tsx` |
| Error boundary | **EXISTE** | `frontend/components/ErrorBoundary.tsx` |
| Expo OTA updates | **EXISTE** | `expo-updates` |
| i18n complet | **EXISTE** | LanguageContext, clés de traduction |
| Website marketing | **EXISTE** | `website/` — Next.js sur Vercel |

---

## 2. WOW Effect

> **Objectif** : que l'utilisateur dise "ok, ça me comprend vraiment"

### 2.1 — "Pourquoi ce film ?" (Explication personnalisée par reco)

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Haute

- [ ] **Backend — Modifier le prompt Gemini pour inclure des raisons**
  - Fichier : `backend/src/lib/gemini.ts`
  - Modifier `generateRecommendationsWithResponse()` pour que le JSON de sortie inclue un champ `reason` par recommandation
  - Exemple de format : `{ title: "Inception", reason: "Parce que tu as adoré Interstellar et les thrillers psychologiques" }`
  - Adapter le prompt pour dire : "Pour chaque recommandation, explique en 1 phrase courte et personnalisée pourquoi cet utilisateur aimerait ce film, en te basant sur son profil de goûts"
  - Le `UserContext` est déjà envoyé à Gemini (genres favoris, films notés, recherches récentes) — on exploite ce contexte

- [ ] **Backend — Mettre à jour les types**
  - Fichier : `backend/src/lib/types.ts`
  - Ajouter `reason?: string` à l'interface `MovieResult`
  - Propager dans `AIRecommendationResult`

- [ ] **Frontend — Afficher la raison dans MovieResults**
  - Fichier : `frontend/components/MovieResults.tsx`
  - Sous le titre de chaque film, ajouter un texte en italique avec icône sparkle : `"Parce que tu as aimé Inception et les thrillers psychologiques"`
  - Style : texte `text-xs italic text-light-muted` avec icône `sparkles` 14px en `#E50914`

- [ ] **Frontend — Afficher la raison dans ForYouSection**
  - Fichier : `frontend/components/ForYouSection.tsx`
  - Même traitement que MovieResults

- [ ] **Traductions** : Ajouter les clés i18n pour "Recommended because..." dans toutes les langues

### 2.2 — Score de pertinence personnalisé

**Statut** : PARTIELLEMENT EXISTE (affinityScore backend, pas affiché)
**Catégorie** : Premium
**Priorité** : Moyenne

- [ ] **Backend — Exposer le score d'affinité dans les réponses**
  - Fichier : `backend/src/routes/discovery.ts`
  - Le `computeAffinityScore()` existe déjà dans `backend/src/lib/affinity.ts`
  - Ajouter `matchScore: number` (0-100%) dans les réponses `/for-you` et `/home`
  - Normaliser le score brut en pourcentage : `Math.min(100, Math.round((score / maxPossibleScore) * 100))`

- [ ] **Frontend — Badge "Match XX%"**
  - Fichiers : `ForYouSection.tsx`, `MovieResults.tsx`, `NewReleasesSection.tsx`
  - Afficher un badge coloré : vert >80%, orange 50-80%, gris <50%
  - Style : pill `bg-green-500/15 text-green-600` avec `text-[11px] font-bold`

### 2.3 — Tags dynamiques ("Mind-blowing", "Twist final", "Feel good")

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Moyenne

- [ ] **Backend — Demander des tags au prompt Gemini**
  - Fichier : `backend/src/lib/gemini.ts`
  - Ajouter au prompt : "Pour chaque film, génère 1 à 3 tags courts (max 15 caractères) décrivant l'ambiance ou le style, ex: 'Mind-blowing', 'Twist final', 'Feel good', 'Visuellement fou', 'Sombre'"
  - Ajouter `tags?: string[]` au format de sortie JSON

- [ ] **Backend — Types**
  - Fichier : `backend/src/lib/types.ts`
  - Ajouter `tags?: string[]` à `MovieResult`

- [ ] **Frontend — Afficher les tags comme pills**
  - Fichiers : `MovieResults.tsx`, `ForYouSection.tsx`, movie-detail
  - Tags en pills colorées sous le titre : fond semi-transparent, texte `text-[10px] font-semibold uppercase`
  - Palette de couleurs par catégorie de tag (mood, genre, style)

---

## 3. Réduire la friction

> **Objectif** : éliminer le syndrome de la page blanche

### 3.1 — Suggestions cliquables sur l'écran de recherche

**Statut** : PARTIELLEMENT EXISTE ("No idea?" existe, mais pas de pills cliquables)
**Catégorie** : Free
**Priorité** : Haute

- [ ] **Frontend — Ajouter des chips de suggestions dans SearchForm**
  - Fichier : `frontend/components/SearchForm.tsx`
  - Sous l'input, ajouter une section "Essayez :" avec des pills cliquables
  - Exemples : `"Un film comme Interstellar"`, `"Une série courte et addictive"`, `"Un truc drôle ce soir"`, `"Thriller psychologique récent"`, `"Animation pour adultes"`
  - Au tap : pré-remplir l'input avec le texte de la pill
  - Stocker les suggestions dans les fichiers de traduction (`frontend/constants/` ou `translations`)
  - Style : `ScrollView horizontal`, pills avec `getSquircle(20)`, `bg-light-surface dark:bg-dark-surface`, `border border-light-border`
  - Animation d'entrée `MotiView` avec stagger delay

- [ ] **Traductions** : Ajouter 5-8 suggestions par langue (fr, en, es, de, it, pt)

### 3.2 — Bouton "Surprends-moi" (mode aléatoire)

**Statut** : N'EXISTE PAS (le "No idea?" est un autofill, pas une recherche directe)
**Catégorie** : Free (1 par jour) / Premium (illimité)
**Priorité** : Haute

- [ ] **Backend — Nouveau endpoint `GET /api/surprise`**
  - Fichier : créer `backend/src/routes/surprise.ts`
  - Logique : combiner trending + genres favoris de l'utilisateur + random seed
  - Utiliser Gemini avec un prompt court : "Recommande 1 film/série aléatoire mais excellent, que l'utilisateur ne s'attend pas à voir, basé sur son profil"
  - Retourner 1 seul résultat enrichi (poster, providers, overview, raison)
  - Rate limit : 1/jour free, illimité premium

- [ ] **Backend — Monter la route**
  - Fichier : `backend/src/index.ts`
  - Ajouter `app.route("/api/surprise", surpriseRoutes)`

- [ ] **Frontend — Bouton "Surprends-moi" sur Home**
  - Fichier : `frontend/app/(tabs)/home.tsx`
  - Bouton plein width sous le CTA de recherche ou à côté
  - Style : outline rouge avec icône `dice-outline` ou `sparkles`
  - Au tap : appel API → navigation directe vers `movie-detail` avec le résultat
  - Animation de chargement : spinner + texte "L'IA cherche..." avec shimmer

- [ ] **Frontend — Service API**
  - Fichier : `frontend/services/backend-api.service.ts`
  - Ajouter méthode `getSurprise()`

- [ ] **Traductions** : clé `home.surpriseMe`

### 3.3 — Améliorer l'historique de recherche (re-lancer une recherche)

**Statut** : EXISTE mais limité (copie clipboard seulement)
**Catégorie** : Premium (auth requis)
**Priorité** : Moyenne

- [ ] **Frontend — Tap sur un historique = lance la recherche**
  - Fichier : `frontend/app/search-history.tsx`
  - Au tap sur un item : naviguer vers `/(tabs)/search` avec `query` et `ts` params (déjà supporté)
  - Garder le bouton copie comme action secondaire (swipe ou long press)
  - Ajouter un bouton "Effacer l'historique" en bas

- [ ] **Backend — Endpoint `DELETE /api/search/history`**
  - Fichier : `backend/src/routes/search-history.ts`
  - Ajouter route pour vider l'historique

---

## 4. Apprentissage automatique

> **Objectif** : battre les plateformes sur la personnalisation

### 4.1 — Thumbs up/down sur chaque recommandation

**Statut** : N'EXISTE PAS (le rating 1-5 existe mais uniquement dans movie-detail après "Mark Watched")
**Catégorie** : Premium
**Priorité** : Haute

- [ ] **Frontend — Boutons 👍/👎 dans MovieResults**
  - Fichier : `frontend/components/MovieResults.tsx`
  - Sous chaque card de résultat, ajouter 2 icônes : `thumbs-up-outline` et `thumbs-down-outline`
  - Au tap : haptic + animation de remplissage + appel API
  - Si 👎 : masquer le film de la liste avec animation de slide-out
  - Si 👍 : ajouter à un signal positif

- [ ] **Backend — Endpoint `POST /api/user/taste-profile/feedback`**
  - Fichier : `backend/src/routes/user.ts`
  - Body : `{ tmdb_id: number, feedback: 'positive' | 'negative', title: string, media_type: string }`
  - Stocker en DB pour enrichir le profil de goûts
  - Un 👎 doit influer sur les genres (si plusieurs 👎 sur le même genre → ajouter aux `disliked_genres`)
  - Un 👍 doit influer positivement (ajouter aux `favorite_genres` si pattern détecté)

- [ ] **Backend — Intégrer le feedback dans le prompt Gemini**
  - Fichier : `backend/src/lib/gemini.ts`
  - Ajouter au `UserContext` : `recentFeedback: { liked: string[], disliked: string[] }`
  - Ajouter au prompt : "L'utilisateur a récemment aimé: X, Y et n'a pas aimé: Z"

- [ ] **Frontend — Boutons 👍/👎 dans ForYouSection**
  - Fichier : `frontend/components/ForYouSection.tsx`
  - Même logique que MovieResults

### 4.2 — Bouton "Déjà vu"

**Statut** : PARTIELLEMENT EXISTE ("Mark as Watched" existe dans movie-detail, mais pas dans les listes)
**Catégorie** : Premium
**Priorité** : Moyenne

- [ ] **Frontend — Ajouter "Déjà vu" dans MovieResults**
  - Fichier : `frontend/components/MovieResults.tsx`
  - Bouton icône `eye` à côté de 👍/👎
  - Au tap : appel `rateMovie` avec `rating: 0` (marque comme vu sans note)
  - Masquer le film de la liste avec animation

- [ ] **Frontend — Ajouter "Déjà vu" dans ForYouSection**
  - Fichier : `frontend/components/ForYouSection.tsx`
  - Même logique

- [ ] **Backend — Exclure les films "déjà vus" des recommandations**
  - Fichier : `backend/src/routes/discovery.ts`
  - C'est DÉJÀ FAIT via `watchedIds = getWatchedTmdbIds(tasteProfile)` et `excludeIds`
  - Vérifier que le `rateMovie` avec `rating: 0` ajoute bien le film à `watchedIds`

### 4.3 — "On affine tes goûts en temps réel" (indicateur visuel)

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Basse

- [ ] **Frontend — Toast/banner après feedback**
  - Créer un composant `TasteUpdatedToast.tsx`
  - Après chaque 👍/👎/rating : afficher brièvement "Goûts mis à jour" avec animation de pulsation
  - Style : toast en bas avec icône `brain` + texte `text-xs`

---

## 5. Disponibilité réelle

> **Objectif** : répondre à "où regarder ?" — le pain point #1

### 5.1 — Affichage des plateformes sur les cards (partout)

**Statut** : PARTIELLEMENT EXISTE (trending a les logos, movie-detail a StreamingSection, mais pas les résultats de recherche ni ForYou)
**Catégorie** : Free
**Priorité** : Haute

- [ ] **Frontend — Ajouter les logos providers dans MovieResults**
  - Fichier : `frontend/components/MovieResults.tsx`
  - Sous chaque card : row de logos providers (max 4, 16x16px, `borderRadius: 4`)
  - Les données `streamingProviders` sont DÉJÀ passées en props

- [ ] **Frontend — Ajouter les logos providers dans ForYouSection**
  - Fichier : `frontend/components/ForYouSection.tsx`
  - Même traitement — les données `streamingProviders` sont DÉJÀ dans le state

### 5.2 — "Disponible en ce moment" label

**Statut** : N'EXISTE PAS
**Catégorie** : Free
**Priorité** : Moyenne

- [ ] **Frontend — Badge "Disponible" vs "Location/Achat"**
  - Fichiers : `MovieResults.tsx`, `ForYouSection.tsx`
  - Si le film a des providers `flatrate` → badge vert "Inclus dans votre abo"
  - Si seulement `rent/buy` → badge jaune "Location / Achat"
  - Si aucun provider → badge gris "Non disponible dans votre région"

### 5.3 — "Quitte la plateforme dans X jours"

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Basse (TMDB ne fournit pas cette info nativement)

- [ ] **Recherche** : Vérifier si l'API JustWatch ou TMDB expose les dates d'expiration
  - TMDB ne fournit PAS les dates d'expiration des licences
  - JustWatch (via TMDB) ne fournit que la disponibilité actuelle
  - **Option A** : Scraper JustWatch pour les dates (risqué, TOS)
  - **Option B** : Ajouter un monitoring : sauvegarder l'état des providers et détecter les changements (le système `useAvailabilityCheck` fait DÉJÀ ça pour la watchlist)
  - **Option C** : Intégrer une API tierce (ex: Streaming Availability API)
  - **Décision** : Reporter cette feature car aucune API fiable ne fournit cette donnée

---

## 6. Home intelligente

> **Objectif** : rendre la home addictive

### 6.1 — "Parce que tu as regardé X" (section contextuelle)

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Haute

- [ ] **Backend — Endpoint `GET /api/because-you-watched`**
  - Fichier : créer dans `backend/src/routes/discovery.ts` (ou nouveau fichier)
  - Logique :
    1. Récupérer le dernier film noté/vu par l'utilisateur (`rated_movies[-1]`)
    2. Appeler `tmdb.getSimilar()` pour ce film
    3. Filtrer par plateformes utilisateur et exclure les déjà vus
    4. Retourner max 10 items avec le titre du film source
  - Auth required, rate limit standard

- [ ] **Frontend — Section "Parce que tu as regardé [Film]"**
  - Fichier : `frontend/app/(tabs)/home.tsx`
  - Nouveau composant `BecauseYouWatchedSection.tsx`
  - Carousel horizontal identique au trending
  - Titre dynamique : "Parce que tu as regardé {titre}"
  - Placer entre Daily Pick et Trending

### 6.2 — "Tendances dans ton style" (trending filtré par goûts)

**Statut** : EXISTE DÉJÀ (le trending est trié par affinité score dans discovery.ts)
**Catégorie** : Premium
**Priorité** : Basse — déjà implémenté

> Le backend trie déjà les trending par `computeAffinityScore()` qui priorise les genres favoris de l'utilisateur. La section trending actuelle EST "Tendances dans ton style".

- [ ] **Frontend — Renommer la section trending**
  - Fichier : `frontend/app/(tabs)/home.tsx` + traductions
  - Changer le titre de "Trending" à "Tendances pour toi" quand l'utilisateur est authentifié et a un profil de goûts
  - Garder "Trending" pour les guests

### 6.3 — "Top du moment pour TOI" (pas global)

**Statut** : EXISTE DÉJÀ (c'est ForYouSection)
**Catégorie** : Premium
**Priorité** : Basse — déjà implémenté

> La section "For You" sur la home utilise déjà Gemini AI + taste profile pour générer des recommandations personnalisées. C'est exactement "Top du moment pour TOI".

---

## 7. Justifier le prix

> **Objectif** : rendre la valeur du premium évidente

### 7.1 — Mur clair Free vs Premium

**Statut** : PARTIELLEMENT EXISTE (quota + subscription modal, mais pas de tableau comparatif clair)
**Catégorie** : Free
**Priorité** : Haute

Limites actuelles Free :
- 3 recherches IA / semaine
- 5 ajouts watchlist / jour

| Feature | Free | Premium |
|---------|------|---------|
| Recherches IA | 3/semaine | Illimité |
| Ajouts watchlist | 5/jour | Illimité |
| For You (recos perso) | Non | Oui |
| New Releases filtrées | Non | Oui |
| Historique de recherche | Non | Oui |
| Affinage conversationnel | Non | Oui |
| Quick Search (TMDB) | Oui | Oui |
| Trending | Oui | Oui |
| Daily Pick | Oui | Oui |
| Movie Detail complet | Oui | Oui |

- [ ] **Frontend — Tableau comparatif dans SubscriptionModal**
  - Fichier : `frontend/components/SubscriptionModal.tsx`
  - Ajouter une section "Free vs Pro" avec un tableau visuel
  - Icônes check/cross par feature
  - Animer l'apparition avec MotiView stagger

- [ ] **Frontend — Compteur "Temps gagné"**
  - Afficher sur la home pour les utilisateurs premium : "FastFlix vous a fait gagner ~{minutes} minutes cette semaine"
  - Calcul : nombre de recherches × 15 min (temps moyen pour choisir un film manuellement)
  - Stocker en local (pas besoin de backend)

### 7.2 — Afficher combien de temps on leur fait gagner

**Statut** : N'EXISTE PAS
**Catégorie** : Free (visible pour tous, incitatif)
**Priorité** : Moyenne

- [ ] **Frontend — Widget "Temps gagné" sur Home**
  - Fichier : `frontend/app/(tabs)/home.tsx`
  - Petit banner animé sous le greeting : "Vous avez trouvé votre film en ~10 secondes. Sans FastFlix : ~15 minutes"
  - Basé sur le nombre de recherches (stocké en AsyncStorage ou via `/api/user/stats`)
  - Style : card subtile avec icône `timer-outline` et animation de compteur

---

## 8. Features addictives

> **Objectif** : augmenter la rétention

### 8.1 — Watchlist intelligente (notifications de disponibilité)

**Statut** : PARTIELLEMENT EXISTE (availability check inline existe, mais pas de push notifications)
**Catégorie** : Premium
**Priorité** : Haute

- [ ] **Backend — Cron job de vérification des providers**
  - Créer `backend/src/jobs/availability-check.ts`
  - Logique : pour chaque item de watchlist de chaque user, vérifier si les providers ont changé
  - Utiliser `tmdb.getWatchProviders()` en batch
  - Si nouveau provider détecté → enregistrer le changement et envoyer une push notification
  - Fréquence : 1 fois par jour (cron ou trigger externe)

- [ ] **Backend — Service d'envoi de push notifications**
  - Créer `backend/src/lib/push-notifications.ts`
  - Utiliser Expo Push API (`https://exp.host/--/api/v2/push/send`)
  - Les tokens sont DÉJÀ enregistrés via `POST /api/notifications/register`
  - Format : `{ to: pushToken, title: "Bonne nouvelle!", body: "Inception est maintenant sur Netflix!" }`

- [ ] **Backend — Monter le cron**
  - Option A : GitHub Actions scheduled workflow
  - Option B : Node cron dans le container Docker
  - Option C : Endpoint protégé appelé par un cron externe

### 8.2 — Notifications "Un film que tu vas aimer vient de sortir"

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Moyenne

- [ ] **Backend — Cron job "new releases matching taste"**
  - Créer dans `backend/src/jobs/new-release-notifications.ts`
  - Logique :
    1. Récupérer les sorties de la semaine (TMDB discover)
    2. Pour chaque user premium, calculer l'affinité avec les sorties
    3. Si score > seuil → envoyer push notification
  - Fréquence : 1 fois par semaine (lundi)

- [ ] **Frontend — Gestion des préférences de notifications**
  - Fichier : ajouter dans `frontend/app/(tabs)/profile.tsx`
  - Nouveau SettingsRow : "Notifications" avec toggle pour :
    - Nouvelles sorties correspondant à tes goûts
    - Disponibilité sur tes plateformes
    - Daily Pick du jour

### 8.3 — Match entre amis ("Film parfait pour vous 2")

**Statut** : N'EXISTE PAS
**Catégorie** : Premium
**Priorité** : Basse (complexe)

- [ ] **Conception** : Définir le mécanisme de partage
  - Option A : Lien de partage avec profil de goûts encodé (simple, pas de compte ami)
  - Option B : Système d'amis avec codes d'invitation (complexe)
  - **Recommandation** : Option A — "Partage ton profil de goûts et on trouve un film pour vous deux"

- [ ] **Backend — Endpoint `POST /api/match`**
  - Body : `{ myTasteProfile: {...}, friendTasteProfile: {...} }`
  - Logique : fusionner les genres favoris, exclure les genres détestés de chacun, appeler Gemini
  - Retourner des recos qui plaisent aux deux

- [ ] **Frontend — Écran "Match"**
  - Nouveau fichier : `frontend/app/match.tsx`
  - Flow : 1) Générer un lien de partage → 2) L'ami ouvre le lien → 3) Résultat de match
  - Deep linking avec expo-router

### 8.4 — Mode soirée ("2h max, fun, à plusieurs")

**Statut** : N'EXISTE PAS (mais peut être implémenté comme une suggestion cliquable)
**Catégorie** : Free / Premium
**Priorité** : Moyenne

- [ ] **Implémentation simple** : Ajouter comme chip de suggestion
  - Fichier : `frontend/components/SearchForm.tsx`
  - Ajouter les chips : "Soirée entre amis", "Film court (<1h30)", "Soirée en couple", "Film à voir en famille"
  - Au tap : pré-remplir l'input avec le texte optimisé pour Gemini
  - Gemini comprend DÉJÀ ce type de requêtes naturelles

- [ ] **Implémentation avancée** (optionnel) : Écran dédié "Mode soirée"
  - Nouveau fichier : `frontend/app/party-mode.tsx`
  - Interface : sliders (durée max, nombre de personnes, ambiance)
  - Génère une requête optimisée pour Gemini automatiquement

---

## 9. UI/UX Optimisations

> **Objectif** : polish premium

### 9.1 — Plus de contraste sur les CTA

**Statut** : PARTIELLEMENT FAIT (le rouge Netflix est déjà bien visible)
**Catégorie** : Free
**Priorité** : Basse

- [ ] **Audit des CTA secondaires**
  - Vérifier les boutons outline qui manquent de contraste en dark mode
  - Fichiers : tous les composants avec `border-light-border dark:border-dark-border`
  - Augmenter l'opacité des borders en dark mode si nécessaire

### 9.2 — Micro-animations (loading IA, génération)

**Statut** : PARTIELLEMENT EXISTE (shimmer, typewriter, MotiView existent)
**Catégorie** : Free
**Priorité** : Moyenne

- [ ] **Frontend — Animation de chargement IA améliorée**
  - Fichier : `frontend/components/LoadingState.tsx`
  - Ajouter des messages rotatifs pendant le chargement : "Analyse de tes goûts...", "Recherche dans 500 000 films...", "Affinage des résultats..."
  - Chaque message apparaît avec une transition fade-in/fade-out
  - Ajouter une barre de progression estimée (fausse mais rassurante)

- [ ] **Frontend — Animation d'apparition des résultats**
  - Fichier : `frontend/components/MovieResults.tsx`
  - Stagger animation : chaque card apparaît avec 100ms de delay
  - Utiliser `MotiView` avec `delay: index * 100`

### 9.3 — Skeleton loaders optimisés

**Statut** : EXISTE DÉJÀ
**Catégorie** : Free
**Priorité** : Basse — déjà implémenté

> Les skeleton loaders sont déjà utilisés partout : Home (Daily Pick, Trending), ForYou, NewReleases, Movie Detail, Actor Detail. `frontend/components/Skeleton.tsx` est un composant shimmer réutilisable.

### 9.4 — Afficher note + nombre d'avis

**Statut** : PARTIELLEMENT EXISTE (note affichée, pas le nombre d'avis)
**Catégorie** : Free
**Priorité** : Basse

- [ ] **Backend — Inclure `vote_count` dans les réponses enrichies**
  - Fichier : `backend/src/lib/tmdb.ts`
  - Le `vote_count` est DÉJÀ dans le type `MovieResult` mais n'est pas toujours rempli
  - Vérifier que `enrichRecommendations()` et `getBatchDetailsAndCredits()` propagent `vote_count`

- [ ] **Frontend — Afficher le nombre d'avis**
  - Fichiers : `MovieResults.tsx`, `ForYouSection.tsx`, `movie-detail.tsx`
  - Format : `"8.2 ★ (12.4K avis)"` — formater avec K/M pour les grands nombres
  - Ajouter une fonction utilitaire `formatVoteCount(count: number): string`

---

## 10. Mode humeur

> **Objectif** : engagement émotionnel ultra puissant

**Statut** : N'EXISTE PAS
**Catégorie** : Free (limité) / Premium (illimité)
**Priorité** : Haute

### 10.1 — Écran "Mode humeur"

- [ ] **Frontend — Nouveau composant `MoodSelector.tsx`**
  - Grille de moods avec emojis et labels :
    | Emoji | Label FR | Label EN | Query Gemini |
    |-------|----------|----------|--------------|
    | 😴 | Fatigué | Tired | "Film léger et réconfortant, pas prise de tête" |
    | 😂 | Envie de rire | Want to laugh | "Comédie hilarante, feel good" |
    | 🤯 | Film marquant | Mind-blowing | "Film qui marque, twist ou visuellement époustouflant" |
    | 😢 | Envie de pleurer | Want to cry | "Film émouvant, drame qui fait pleurer" |
    | 😰 | Stressé | Stressed | "Film d'évasion, aventure ou fantaisie" |
    | 🥰 | Romantique | Romantic | "Film romantique ou comédie romantique" |
    | 🔥 | Adrénaline | Adrenaline | "Action intense, thriller haletant" |
    | 👨‍👩‍👧‍👦 | En famille | Family | "Film familial, tout public, animation" |
  - Chaque mood card : `60x60`, emoji centré, label dessous
  - Animation : pulsation au tap, haptic feedback

- [ ] **Frontend — Intégration dans SearchForm ou Home**
  - Option A : Section sur la Home (entre le CTA et le Daily Pick)
  - Option B : Sous l'input de recherche dans SearchForm
  - **Recommandation** : Option A sur la Home — plus visible et réduit la friction
  - Au tap sur un mood : naviguer vers `/(tabs)/search` avec le query pré-rempli

- [ ] **Traductions** : Ajouter toutes les clés mood dans chaque langue

---

## 11. Notifications de sorties

> **Objectif** : "être notifié quand un film sort"

**Statut** : N'EXISTE PAS (push token registration existe, mais pas de logique d'envoi)
**Catégorie** : Premium
**Priorité** : Moyenne

### 11.1 — Bouton "Notifier à la sortie" sur movie-detail

- [ ] **Backend — Nouveau endpoint `POST /api/watchlist/notify`**
  - Body : `{ tmdb_id: number, media_type: string, title: string }`
  - Stocker en DB : table `release_notifications` (user_id, tmdb_id, media_type, title, release_date, notified)
  - Pour les films : `release_date` depuis TMDB
  - Pour les séries : `next_episode_to_air` depuis TMDB

- [ ] **Backend — Cron job de vérification des sorties**
  - Créer `backend/src/jobs/release-notifications.ts`
  - Logique quotidienne :
    1. Récupérer toutes les notifications non envoyées dont `release_date <= today`
    2. Envoyer push notification : "🎬 {titre} est sorti aujourd'hui !"
    3. Marquer comme notifié

- [ ] **Frontend — Bouton "Me notifier" dans movie-detail**
  - Fichier : `frontend/app/movie-detail.tsx`
  - Condition : le film n'est pas encore sorti (vérifier `release_date > today` ou `status === 'In Production' | 'Planned'`)
  - Bouton : icône `notifications-outline`, texte "Notifier à la sortie"
  - Style : outline, à côté de "Add to Watchlist" et "Share"

- [ ] **Frontend — Service API**
  - Fichier : `frontend/services/backend-api.service.ts`
  - Ajouter `registerReleaseNotification(tmdbId, mediaType, title)`

---

## 12. Swipe Discovery (mode TikTok)

> **Objectif** : expérience de découverte immersive, plein écran, swipe vertical — comme TikTok/Reels mais pour les films

**Statut** : N'EXISTE PAS
**Catégorie** : Free (limité à 5 swipes) / Premium (illimité)
**Priorité** : Haute (différenciateur UX majeur)

### 12.0 — Installation de la dépendance

- [ ] **Installer `react-native-pager-view`**
  ```bash
  cd frontend && npx expo install react-native-pager-view
  ```
  - Librairie native : `PagerView` (iOS: `UIPageViewController`, Android: `ViewPager2`)
  - Supporte `orientation="vertical"` nativement (performant, pas de JS scroll)
  - Compatible Expo SDK 54, supporte `react-native-reanimated` pour les animations scroll-driven
  - **IMPORTANT** : la prop `orientation` ne peut PAS être changée dynamiquement après le mount

### 12.1 — Architecture des fichiers

```
frontend/
├── app/
│   └── swipe-discovery.tsx              ← Écran plein écran (modal ou push)
├── components/
│   └── swipe-discovery/
│       ├── SwipeDiscoveryView.tsx        ← PagerView vertical + logique de pagination
│       ├── SwipeCard.tsx                 ← 1 page = 1 film (poster full + overlay)
│       ├── SwipeActions.tsx              ← Boutons latéraux (👍👎 watchlist share)
│       └── SwipeHeader.tsx              ← Barre du haut (back, compteur, fermer)
```

### 12.2 — Composant principal `SwipeDiscoveryView.tsx`

- [ ] **Créer le composant PagerView vertical**
  ```tsx
  import PagerView from 'react-native-pager-view';

  <PagerView
    style={{ flex: 1 }}
    initialPage={0}
    orientation="vertical"
    onPageSelected={(e) => {
      const page = e.nativeEvent.position;
      // Track analytics
      // Prefetch next batch si page >= items.length - 2
    }}
  >
    {items.map((item, index) => (
      <SwipeCard key={item.tmdb_id} item={item} index={index} />
    ))}
  </PagerView>
  ```
  - Props d'entrée : `items: MovieResult[]`, `providers: Record<number, StreamingProvider[]>`, `source: 'search' | 'forYou' | 'surprise'`
  - Gérer le prefetch : quand `currentPage >= items.length - 2`, charger le batch suivant
  - Free : limiter à 5 swipes puis afficher un CTA "Passer à Premium pour continuer"

### 12.3 — Composant `SwipeCard.tsx` (1 page = 1 film)

- [ ] **Layout plein écran immersif**
  - **Background** : poster en plein écran avec `Image` + `blurRadius={20}` (fond flou)
  - **Poster net** : centré, ratio 2:3, `width: 65%`, coins arrondis, shadow
  - **Gradient overlay bas** : `LinearGradient` du transparent au noir (60% bas)
  - **Zone d'info** (overlay bas) :
    - Titre (text-2xl bold white, shadow)
    - Année + note ★ + type badge (Movie/TV)
    - Genres en pills
    - Logos providers (row, max 4, 20x20px)
    - "Pourquoi ce film ?" en italique (si disponible)
    - Synopsis (2 lignes max, expandable au tap)

  ```tsx
  <View style={{ flex: 1 }}>
    {/* Background blur */}
    <Image source={{ uri: posterUri }} style={StyleSheet.absoluteFill} blurRadius={25} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

    {/* Poster net centré */}
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image source={{ uri: posterUri }} style={{ width: '65%', aspectRatio: 2/3, borderRadius: 16 }} />
    </View>

    {/* Gradient + infos en bas */}
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.bottomGradient}>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.year}>{releaseYear}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#fbbf24" />
          <Text>{item.vote_average.toFixed(1)}</Text>
        </View>
      </View>
      {/* Providers logos */}
      <View style={styles.providersRow}>
        {providers.slice(0, 4).map(p => (
          <Image key={p.provider_id} source={{ uri: logoUri }} style={styles.providerLogo} />
        ))}
      </View>
    </LinearGradient>
  </View>
  ```

### 12.4 — Composant `SwipeActions.tsx` (boutons latéraux style TikTok)

- [ ] **Colonne de boutons sur le côté droit**
  - Position : `absolute right-4 bottom-[30%]`
  - Boutons (de haut en bas) :
    | Icône | Action | Détail |
    |-------|--------|--------|
    | `heart-outline` / `heart` | Like (👍) | Appel `POST /user/taste-profile/feedback` positive |
    | `close-circle-outline` | Dislike (👎) | Appel feedback negative + auto-swipe au suivant |
    | `bookmark-outline` / `bookmark` | Watchlist | Toggle add/remove watchlist |
    | `eye-outline` / `eye` | Déjà vu | Mark as watched |
    | `share-outline` | Share | Partage lien TMDB |
    | `information-circle-outline` | Détails | Navigation vers `movie-detail` |
  - Chaque bouton : `48x48`, fond `rgba(0,0,0,0.3)`, `borderRadius: 24`, `backdropFilter blur`
  - Animations : scale bounce au tap + haptic
  - Compteur sous le like (nombre de likes simulé ou réel)

### 12.5 — Points d'entrée (où déclencher le mode swipe)

- [ ] **Entrée 1 : Résultats de recherche — bouton toggle "Vue swipe"**
  - Fichier : `frontend/components/MovieResults.tsx`
  - Ajouter un bouton icône dans le header des résultats : `grid-outline` (liste) / `phone-portrait-outline` (swipe)
  - Au tap : naviguer vers `swipe-discovery` avec les résultats en params (ou via un store/context)
  - Passer les `movies`, `streamingProviders`, `credits` déjà chargés

- [ ] **Entrée 2 : Bouton "Explorer" sur la Home**
  - Fichier : `frontend/app/(tabs)/home.tsx`
  - Nouveau bouton sous le CTA de recherche : "Explorer en swipant" avec icône `swap-vertical`
  - Au tap : appeler `GET /api/for-you` ou `GET /api/surprise` → naviguer vers `swipe-discovery`

- [ ] **Entrée 3 : Onglet dédié (optionnel, Phase 2)**
  - Fichier : `frontend/app/(tabs)/_layout.tsx`
  - Ajouter un 5ème onglet "Explore" entre Home et Search
  - Icône : `compass-outline`
  - Feed infini de recos personnalisées

### 12.6 — Backend — Feed infini paginé

- [ ] **Nouveau endpoint `GET /api/feed?page=1&size=5`**
  - Fichier : créer `backend/src/routes/feed.ts`
  - Logique :
    1. Récupérer le taste profile + watchlist + historique
    2. Page 1 : appeler Gemini avec le profil (cache 1h)
    3. Pages suivantes : appeler Gemini avec contexte "donne-moi 5 recos DIFFÉRENTES des précédentes" + passer les IDs déjà vus
    4. Enrichir avec TMDB (poster, providers, credits)
    5. Exclure les films déjà vus / déjà dans la watchlist / déjà swipés
  - Réponse : `{ items: MovieResult[], providers: Record<number, StreamingProvider[]>, hasMore: boolean, page: number }`
  - Auth required, rate limit AI

- [ ] **Monter la route**
  - Fichier : `backend/src/index.ts`
  - `app.route("/api/feed", feedRoutes)`

### 12.7 — Écran `swipe-discovery.tsx`

- [ ] **Créer l'écran comme modal plein écran**
  - Fichier : `frontend/app/swipe-discovery.tsx`
  - Récupérer les données via params (résultats de recherche) ou via API (feed)
  - Gérer 2 modes :
    - **Mode fini** (résultats de recherche) : X items, message "Fin des résultats" à la dernière page
    - **Mode infini** (feed/explore) : prefetch page N+1 quand on atteint item N-2
  - StatusBar masquée pour l'immersion totale
  - Geste swipe-down depuis la première page = fermer (retour)

  ```tsx
  // frontend/app/swipe-discovery.tsx
  export default function SwipeDiscoveryScreen() {
    const params = useLocalSearchParams<{ source: string; itemsJson?: string }>();
    const [items, setItems] = useState<MovieResult[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Mode fini : items passés en params
    // Mode infini : fetch depuis /api/feed
    useEffect(() => {
      if (params.itemsJson) {
        setItems(JSON.parse(params.itemsJson));
      } else {
        fetchFeed(1);
      }
    }, []);

    const fetchFeed = async (p: number) => {
      const res = await backendAPIService.getFeed(p);
      if (res.success && res.data) {
        setItems(prev => [...prev, ...res.data.items]);
        setHasMore(res.data.hasMore);
        setPage(p);
      }
    };

    const handlePageSelected = (position: number) => {
      // Prefetch
      if (hasMore && position >= items.length - 2) {
        fetchFeed(page + 1);
      }
      // Analytics
      trackSwipe(items[position]?.tmdb_id, position);
    };

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <SwipeDiscoveryView
          items={items}
          onPageSelected={handlePageSelected}
          hasMore={hasMore}
        />
      </View>
    );
  }
  ```

### 12.8 — Analytics & Tracking

- [ ] **Nouveaux events analytics**
  - Fichier : `frontend/services/analytics.ts`
  - `trackSwipeView(tmdbId, position, source)` — chaque film vu
  - `trackSwipeLike(tmdbId)` — like dans le mode swipe
  - `trackSwipeDislike(tmdbId)` — dislike
  - `trackSwipeWatchlist(tmdbId)` — ajout watchlist depuis swipe
  - `trackSwipeShare(tmdbId)` — partage depuis swipe
  - `trackSwipeToDetail(tmdbId)` — navigation vers movie-detail
  - `trackSwipeSessionDuration(seconds, itemsViewed)` — durée de session swipe

### 12.9 — Animations & Polish

- [ ] **Transition entre pages**
  - `PagerView` gère nativement les transitions (pas besoin de custom)
  - Ajouter une animation d'entrée pour les infos (MotiView fade-in bottom quand la page devient active)

- [ ] **Parallax sur le poster**
  - Utiliser `onPageScroll` de PagerView + `Animated.event` pour créer un léger parallax vertical sur le poster pendant le swipe

- [ ] **Auto-play trailer (optionnel, Phase 3)**
  - Si TMDB fournit un trailer YouTube, l'afficher en background après 3 secondes sur la page
  - Utiliser `expo-video` ou un WebView YouTube embed
  - Mute par défaut, tap pour unmute

### 12.10 — Gestion Free vs Premium

- [ ] **Free : 5 swipes par session**
  - Compteur local (pas besoin de backend)
  - Au 6ème swipe : afficher une page spéciale "Passer à Premium" à la place du film
  - Design : fond gradient rouge/noir, icône `sparkles`, CTA "Débloquer l'exploration illimitée"

- [ ] **Premium : illimité**
  - Feed infini via `/api/feed` paginé

---

## Résumé des priorités

### Phase 1 — Quick Wins (1-2 semaines)
- [ ] 3.1 — Suggestions cliquables sur SearchForm
- [ ] 5.1 — Logos providers dans MovieResults et ForYouSection
- [ ] 5.2 — Badge "Disponible" / "Location/Achat"
- [ ] 10.1 — Mode humeur (grille sur la Home)
- [ ] 6.2 — Renommer Trending → "Tendances pour toi"
- [ ] 9.2 — Micro-animations loading IA améliorées

### Phase 2 — Valeur Premium (2-4 semaines)
- [ ] 12 — **Swipe Discovery (mode TikTok)** — SwipeCard + PagerView vertical + toggle dans résultats
- [ ] 2.1 — "Pourquoi ce film ?" (raison personnalisée)
- [ ] 2.3 — Tags dynamiques
- [ ] 4.1 — Thumbs up/down
- [ ] 4.2 — Bouton "Déjà vu" dans les listes
- [ ] 3.2 — Bouton "Surprends-moi"
- [ ] 7.1 — Tableau comparatif Free vs Premium
- [ ] 9.4 — Note + nombre d'avis

### Phase 3 — Rétention (4-6 semaines)
- [ ] 8.1 — Push notifications (disponibilité watchlist)
- [ ] 8.2 — Notifications "nouveau film pour toi"
- [ ] 11.1 — Notifier à la sortie
- [ ] 6.1 — "Parce que tu as regardé X"
- [ ] 2.2 — Score de pertinence %
- [ ] 7.2 — Widget "Temps gagné"
- [ ] 12.6 — Feed infini paginé (`/api/feed`) pour le mode swipe

### Phase 4 — Différenciation (6+ semaines)
- [ ] 12.5 (entrée 3) — Onglet "Explore" dédié avec feed infini TikTok
- [ ] 12.9 — Auto-play trailer en background
- [ ] 8.3 — Match entre amis
- [ ] 8.4 — Mode soirée (écran dédié)
- [ ] 4.3 — Toast "Goûts mis à jour"
- [ ] 3.3 — Historique: re-lancer une recherche + effacer

### Phase finale — Mise à jour du site web
- [ ] **Mettre à jour le site web FastFlix** pour refléter toutes les nouvelles features implémentées (screenshots, descriptions, pricing, changelog, etc.)
