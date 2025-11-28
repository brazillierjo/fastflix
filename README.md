# FastFlix - Monorepo

FastFlix est une application de recommandations de films et séries propulsée par l'IA.

## Structure du projet

```
fastflix/
├── frontend/    # Application mobile React Native (Expo)
├── backend/     # API Next.js (Vercel)
└── website/     # Site vitrine Next.js
```

## Démarrage rapide

### Installation

```bash
# Installer toutes les dépendances
npm run install:all
```

### Développement

```bash
# Lancer le frontend (app mobile)
npm run dev:frontend

# Lancer le backend (API)
npm run dev:backend

# Lancer le website (site vitrine)
npm run dev:website
```

## Documentation

- [Frontend](./frontend/README.md) - Application mobile
- [Backend](./backend/README.md) - API Next.js
- [Website](./website/README.md) - Site vitrine

## Technologies

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Next.js 15, TypeScript, Turso (SQLite)
- **Website**: Next.js 15, TypeScript, TailwindCSS
- **AI**: Google Gemini 2.0 Flash
- **Subscription**: RevenueCat
