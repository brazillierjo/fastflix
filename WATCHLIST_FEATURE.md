# Feature: Watchlist

## Description

Système de Watchlist permettant aux utilisateurs de sauvegarder des films/séries pour les regarder plus tard, avec suivi de la disponibilité sur les plateformes de streaming.

---

## Backend

### Base de données

- [ ] Créer la migration pour la table `watchlist`
  - `id` (TEXT PRIMARY KEY)
  - `user_id` (TEXT, FK vers users)
  - `tmdb_id` (INTEGER)
  - `media_type` (TEXT: 'movie' | 'tv')
  - `title` (TEXT)
  - `poster_path` (TEXT, nullable)
  - `added_at` (DATETIME)
  - `last_provider_check` (DATETIME)
  - `providers_json` (TEXT - JSON des plateformes disponibles)
  - `country` (TEXT - pays pour les providers)

- [ ] Créer un index sur `(user_id, tmdb_id, media_type)` pour éviter les doublons

### API Routes

- [ ] `POST /api/watchlist` - Ajouter un élément à la watchlist
  - Body: `{ tmdbId, mediaType, title, posterPath, providers, country }`
  - Vérifier que l'élément n'existe pas déjà

- [ ] `GET /api/watchlist` - Récupérer la watchlist de l'utilisateur
  - Query params optionnels: `mediaType` (filter movies/tv)
  - Retourner les éléments triés par date d'ajout (plus récent en premier)

- [ ] `DELETE /api/watchlist/:id` - Retirer un élément de la watchlist

- [ ] `GET /api/watchlist/check/:tmdbId/:mediaType` - Vérifier si un élément est dans la watchlist
  - Utile pour afficher l'état du bouton sur la page détails

### Mise à jour des providers

- [ ] Créer un endpoint `POST /api/watchlist/refresh-providers`
  - Appelé périodiquement ou à l'ouverture de la watchlist
  - Met à jour les providers pour tous les éléments de la watchlist
  - Ne met à jour que si `last_provider_check` > 24h

- [ ] Alternative: Job CRON Vercel pour mise à jour quotidienne des providers
  - Plus efficace mais nécessite Vercel Cron

### Lib

- [ ] Créer `lib/watchlist.ts` avec les fonctions DB:
  - `addToWatchlist(userId, item)`
  - `removeFromWatchlist(userId, itemId)`
  - `getWatchlist(userId, mediaType?)`
  - `isInWatchlist(userId, tmdbId, mediaType)`
  - `refreshWatchlistProviders(userId)`

### Tests

- [ ] Tests unitaires pour les fonctions watchlist
- [ ] Tests d'intégration pour les endpoints API

---

## Frontend

### Services

- [ ] Créer `services/watchlist.service.ts`
  - `addToWatchlist(item)`
  - `removeFromWatchlist(itemId)`
  - `getWatchlist(mediaType?)`
  - `checkInWatchlist(tmdbId, mediaType)`
  - `refreshProviders()`

### Hooks

- [ ] Créer `hooks/useWatchlist.ts`
  - Utiliser React Query pour le cache et les mutations
  - `useWatchlist()` - récupérer la liste
  - `useAddToWatchlist()` - mutation pour ajouter
  - `useRemoveFromWatchlist()` - mutation pour retirer
  - `useIsInWatchlist(tmdbId, mediaType)` - vérifier si présent

### Accès à la Watchlist (depuis l'écran Home)

- [ ] Ajouter une icône discrète sur l'écran Home (header ou coin)
  - Icône: bookmark ou coeur
  - Badge avec le nombre d'éléments dans la watchlist
  - Position: ne pas gêner l'UX existante

- [ ] Créer `components/WatchlistBottomSheet.tsx` - Bottom sheet pour afficher la watchlist
  - S'ouvre au tap sur l'icône
  - Liste des éléments sauvegardés
  - Filtres: Tous / Films / Séries
  - Pull-to-refresh pour actualiser les providers
  - Swipe pour supprimer ou bouton "Vu"
  - État vide avec message explicatif
  - Hauteur: ~70% de l'écran, draggable

### Accès à la Watchlist (depuis le Profil)

- [ ] Ajouter une section "Watchlist" dans l'écran Profil
  - Afficher le nombre d'éléments sauvegardés
  - Lien "Voir ma watchlist"

- [ ] Créer `app/watchlist.tsx` - Écran dédié watchlist (full screen)
  - Accessible depuis le profil (navigation push)
  - Liste complète des éléments sauvegardés
  - Filtres: Tous / Films / Séries
  - Pull-to-refresh pour actualiser les providers
  - Swipe pour supprimer ou bouton "Vu"
  - État vide avec message explicatif
  - Header avec bouton retour

### Composants

- [ ] Créer `components/WatchlistItem.tsx`
  - Affiche poster, titre, plateformes disponibles
  - Indicateur si les providers ont changé depuis l'ajout
  - Boutons: "Vu" / "Retirer"

- [ ] Créer `components/AddToWatchlistButton.tsx`
  - Bouton toggle (ajouter/retirer)
  - Animation de feedback
  - État loading pendant la requête

- [ ] Modifier `components/MediaDetails.tsx` (ou équivalent)
  - Intégrer le bouton AddToWatchlist
  - Afficher si déjà dans la watchlist

### Indicateur de disponibilité

- [ ] Créer `components/ProviderAvailability.tsx`
  - Affiche les logos des plateformes
  - Indicateur visuel si disponibilité a changé (nouveau/retiré)
  - Date de dernière vérification

### Traductions

- [ ] Ajouter les clés i18n dans tous les fichiers de locales:
  - `watchlist.title`
  - `watchlist.empty`
  - `watchlist.add`
  - `watchlist.remove`
  - `watchlist.watched`
  - `watchlist.availableOn`
  - `watchlist.notAvailable`
  - `watchlist.lastChecked`
  - `watchlist.providersChanged`

---

## UX/UI

### Interactions

- [ ] Animation d'ajout à la watchlist (coeur qui pulse, bookmark qui se remplit)
- [ ] Haptic feedback sur iOS lors de l'ajout/suppression
- [ ] Toast de confirmation après ajout/suppression
- [ ] Swipe actions sur les éléments de la liste

### États

- [ ] État loading pendant le chargement de la watchlist
- [ ] État vide avec illustration et CTA
- [ ] État erreur avec retry
- [ ] Skeleton loading pour les items

---

## Points d'attention

### Performance

- [ ] Pagination de la watchlist si beaucoup d'éléments
- [ ] Cache React Query avec invalidation intelligente
- [ ] Optimistic updates pour les mutations

### Fraîcheur des données

- [ ] Refresh automatique des providers à l'ouverture de l'app
- [ ] Indicateur visuel quand les providers sont "stale" (> 24h)
- [ ] Option de refresh manuel

### Edge cases

- [ ] Gérer le cas où un film/série n'est plus disponible nulle part
- [ ] Gérer le changement de pays de l'utilisateur
- [ ] Limite max d'éléments dans la watchlist? (éviter abus)
- [ ] Que faire si l'utilisateur n'est pas premium? (limite gratuite?)

---

## Ordre d'implémentation suggéré

1. [ ] Migration DB + fonctions lib backend
2. [ ] Endpoints API backend + tests
3. [ ] Service + hooks frontend
4. [ ] Icône watchlist sur Home + WatchlistBottomSheet
5. [ ] Section watchlist dans Profil + écran dédié
6. [ ] Bouton ajout sur page détails
7. [ ] Traductions
8. [ ] Refresh des providers
9. [ ] Polish UX (animations, swipe, badge, etc.)

---

## Questions ouvertes

- Faut-il une limite d'éléments pour les utilisateurs gratuits vs premium?
- Faut-il stocker l'historique des films "vus"?
- Notifications quand un film devient disponible sur une plateforme de l'utilisateur?
