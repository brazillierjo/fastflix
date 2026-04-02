# FastFlix — Feature Roadmap & Implementation Guide

> Analyse complète de l'existant + plan d'implémentation détaillé pour chaque feature du TODO.
> Dernière mise à jour : 2026-04-02

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
10. [Notifications de sorties](#11-notifications-de-sorties)
12. [Swipe Discovery (mode TikTok)](#12-swipe-discovery-mode-tiktok) ✅

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

### IA & Personnalisation (implémenté)

| Feature | Statut | Détails |
|---------|--------|---------|
| "Pourquoi ce film ?" (2.1) | **EXISTE** | Raison IA personnalisée par reco, affichée en bas de chaque card (search + ForYou) |
| Score de pertinence % (2.2) | **EXISTE** | Badge Match coloré (vert/orange/gris) via `computeMatchScore()` |
| Cache ForYou en DB | **EXISTE** | Recommandations cachées 7 jours en Turso, invalidées au changement de profil |
| Gating premium | **EXISTE** | Raisons IA, matchScore, ForYou réservés aux premium ; free = pas d'appel Gemini inutile |
| Animation loading IA | **EXISTE** | Sparkle pulsant + texte "L'IA analyse vos goûts..." au lieu de skeleton |
| Badge watchlist sur cards | **EXISTE** | Icône bookmark rouge sur poster si film dans la watchlist (search + ForYou) |
| Icônes sections Home | **EXISTE** | Bookmark (À voir), Checkmark (Déjà vus), Heart (Acteurs favoris) |
| Gemini 2.5 Flash Lite | **EXISTE** | Modèle IA le moins cher ($0.10/$0.40 par 1M tokens), rapide, pas de sunset |

---

## 2. WOW Effect

> **Objectif** : que l'utilisateur dise "ok, ça me comprend vraiment"
> 
> 2.1 et 2.2 sont **FAITS** — voir section "IA & Personnalisation" dans les features existantes.

### 3.3 — Améliorer l'historique de recherche (re-lancer une recherche)

**Statut** : EXISTE mais limité (copie clipboard seulement)
**Catégorie** : Premium (auth requis)
**Priorité** : Moyenne

- [ ] **Frontend — Tap sur un historique = lance la recherche** (on a déjà essayé, l'input ne se remplissait jamais. utiliser un skill peut-etre ?)
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

- [x] **Implémenté via Swipe Discovery** — Boutons Like/Dislike toggleables dans SwipeActions, `POST /api/feed/feedback` (like→rating 5, dislike→rating 1), toggle via `DELETE /api/user/taste-profile/rate`. Le taste profile est injecté dans le prompt Gemini via `UserContext.ratedMovies`.

### 4.2 — Bouton "Déjà vu"

- [x] **Implémenté via Swipe Discovery** — Bouton eye toggle dans SwipeActions, `rateMovie` rating 0 pour marquer vu, `deleteRating` pour démarquer. Films déjà vus exclus des recos via `getWatchedTmdbIds()`.

### 4.3 — "On affine tes goûts en temps réel" (indicateur visuel)

- [x] **Implémenté via Swipe Discovery** — Toast bottom-center "Goûts mis à jour !" après chaque like/dislike, fond solide, auto-dismiss 1.8s.

---

## 5. Disponibilité réelle

> **Objectif** : répondre à "où regarder ?" — le pain point #1

### 5.1 — Affichage des plateformes sur les cards (partout)

- [x] **Implémenté sur SwipeCard** — Logos providers (max 4) affichés à côté du badge type. Données déjà disponibles dans les props.
- [ ] **Ajouter les logos providers dans MovieResults** (vue liste des résultats de recherche)

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

- [x] **Implémenté via l'onglet "Pour vous"** — Premier tab de l'app, feed swipe avec recos IA personnalisées (premium) ou trending (free). Remplace l'ancienne ForYouSection.

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

**Statut** : ✅ IMPLÉMENTÉ (v3.2)
**Catégorie** : Free (limité à 5 swipes) / Premium (illimité)

### Ce qui a été fait

- [x] **Onglet "Pour vous"** — premier tab de l'app (comme TikTok), feed trending pour free, IA pour premium, toujours dark mode
- [x] **Restructuration des tabs** — 4 onglets : Pour vous (sparkles) > Explorer (compass) > Recherche > Profil. Home renommée "Explorer", ForYouSection supprimée
- [x] **`react-native-pager-view`** — PagerView vertical natif, `orientation="vertical"`
- [x] **SwipeCard full-bleed** — poster plein écran + gradient 5 stops, titre 22px, meta inline (année·note·genres), badge type + providers, chip IA doré (2 lignes max), synopsis expandable avec "voir plus"
- [x] **SwipeActions (6 boutons)** — Like/Dislike (toggle, mutually exclusive), Déjà vu (toggle watched), À voir (watchlist toggle optimistic UI), Partager, Détails. Icônes sans cercle, filled quand actif, text-shadow
- [x] **Backend `POST /api/feed/feedback`** — like→rating 5, dislike→rating 1, toggle via DELETE
- [x] **Swipe gauche → détail** — preview movie-detail (hero + titre + synopsis) derrière la card pendant le swipe, puis navigation seamless. `fullScreenGestureEnabled` pour retour
- [x] **Entry point recherche** — bouton toggle dans MovieResults header pour passer en mode swipe
- [x] **Gate premium** — 5 swipes/session (compteur local), puis CTA upgrade
- [x] **Analytics** — 7 events swipe (view, like, dislike, watchlist, share, detail, session)
- [x] **i18n** — 6 langues (fr, en, es, de, it, ja) pour tous les labels swipe
- [x] **Prompt Gemini raccourci** — raisons max 10 mots, direct et punchy
- [x] **Bouton recherche** en haut à droite du tab Pour vous
- [x] **Toast** — bottom-center, fond solide, largeur auto
- [x] **Tab bar dark** quand on est sur Pour vous, adaptatif ailleurs

### Architecture actuelle

```
frontend/
├── app/
│   ├── (tabs)/for-you.tsx               ← Onglet "Pour vous" (feed swipe)
│   ├── (tabs)/_layout.tsx               ← 4 tabs, tab bar dark sur Pour vous
│   └── swipe-discovery.tsx              ← Mode swipe depuis résultats de recherche (modal)
├── components/
│   └── swipe-discovery/
│       ├── SwipeDiscoveryView.tsx        ← PagerView vertical + swipe-left-to-detail + gate premium
│       ├── SwipeCard.tsx                 ← Full-bleed poster + gradient + info overlay
│       ├── SwipeActions.tsx              ← 6 boutons (like, dislike, watched, watchlist, share, details)
│       └── SwipeHeader.tsx              ← Header flottant (compteur, back, close) — mode modal uniquement
├── contexts/
│   └── SwipeDataContext.tsx             ← Bridge données search → swipe modal
backend/
└── src/routes/feed.ts                   ← POST /feedback
```

### Ce qui reste à faire

- [ ] **Feed infini paginé** — `GET /api/feed?page=1&size=5` dans `backend/src/routes/feed.ts`, hook `useSwipeFeed` avec `useInfiniteQuery`, prefetch page N+1 quand on atteint item N-2
- [ ] **Parallax poster** — `onPageScroll` de PagerView + `Animated.event` pour léger parallax vertical
- [ ] **Auto-play trailer** (Phase 3) — Si TMDB fournit un trailer YouTube, l'afficher en background après 3s, mute par défaut

---

## Résumé des priorités

> L'onglet "Pour vous" (Swipe Discovery TikTok-like) est implémenté. Il consolide les features 4.1 (like/dislike), 4.2 (déjà vu), 4.3 (toast goûts), 5.1 (providers), 2.1/2.2 (raison IA + match %), 2.3 (genres).

### Phase 1 — Quick Wins
- [x] 6.2 — Trending renommé "Tendances pour vous" (authentifié) / "Tendances" (guest)
- [x] 7.1 — Tableau comparatif Free vs Pro dans SubscriptionModal (6 features, check/cross)
- [x] Audit premium — All gates verified: swipe 5/session, like/dislike/watchlist/watched disabled for guests, trending public pour guests
- [ ] 3.2 — Bouton "Surprends-moi"

### Phase 2 — Feed infini + Rétention
- [ ] Feed infini paginé via `/api/feed` (recos IA pour premium, trending pour free)
- [ ] 8.1 — Push notifications (disponibilité watchlist)
- [ ] 8.2 — Notifications "nouveau film pour toi"
- [ ] 11.1 — Notifier à la sortie
- [ ] 6.1 — "Parce que tu as regardé X"
- [ ] 7.2 — Widget "Temps gagné"

### Phase 3 — Différenciation
- [ ] Auto-play trailer en background sur le swipe
- [ ] 8.3 — Match entre amis
- [ ] 8.4 — Mode soirée (écran dédié)
- [ ] 3.3 — Historique: re-lancer une recherche + effacer

### Phase finale — Mise à jour du site web
- [ ] **Mettre à jour le site web FastFlix** pour refléter toutes les nouvelles features (screenshots, descriptions, pricing, changelog)
