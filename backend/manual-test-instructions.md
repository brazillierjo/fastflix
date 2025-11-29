# Tests Manuels des Endpoints d'Authentification

## Configuration

Backend URL: `https://fastflix-api.vercel.app`

## Test 1: POST /api/search sans JWT → doit retourner 401

```bash
curl -X POST https://fastflix-api.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Inception", "language": "en", "country": "US"}'
```

**Résultat attendu:** Status 401 avec message "Missing authentication token"

## Test 2: GET /api/auth/me avec JWT valide

### Étape 1: Récupérer un JWT depuis l'app

Dans votre app React Native, ajoutez temporairement ce code dans `AuthContext.tsx` après un login réussi:

```typescript
const token = authData.token;
console.log('🔑 JWT Token:', token);
```

### Étape 2: Tester l'endpoint

```bash
curl https://fastflix-api.vercel.app/api/auth/me \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

**Résultat attendu:** Status 200 avec les infos utilisateur

## Test 3: POST /api/search avec JWT valide

```bash
curl -X POST https://fastflix-api.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{"query": "Inception", "language": "en", "country": "US"}'
```

**Résultat attendu:** Status 200 avec résultats de recherche

## Test 4: POST /api/search avec JWT expiré

Utilisez un ancien token ou attendez 30 jours (durée d'expiration).

**Résultat attendu:** Status 401 avec message "Invalid or expired token"

## Validation

- ✅ Test 1: Sans JWT → 401
- ⏳ Test 2: Avec JWT valide → 200 + user info
- ⏳ Test 3: Search avec JWT → 200 + résultats
- ⏳ Test 4: JWT expiré → 401
