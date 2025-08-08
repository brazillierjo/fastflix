# 🚀 FastFlix - Guide de Développement

Guide complet des commandes essentielles pour développer, tester et déployer FastFlix.

## 📱 Développement Local

### Lancer l'app en mode développement

```bash
npm start
# ou
npx expo start
```

### Tester sur iPhone physique

```bash
# Via le QR code affiché dans le terminal
# Ouvrir Expo Go et scanner le QR code

# Ou lancer directement via cable USB
npm run ios
# ou
npx expo run:ios
```

### Tester sur simulateur iOS

```bash
# Lancer Xcode Simulator puis
npm run ios
# ou appuyer sur 'i' dans le terminal Expo
```

## 🏗️ Builds & Déploiements

### Builds de développement

```bash
# Build pour tests internes (avec DevClient)
npx eas build --platform ios --profile development

# Build preview (TestFlight interne)
npx eas build --platform ios --profile preview

# Build pour les deux plateformes
npx eas build --profile preview
```

### Builds de production

```bash
# Build production iOS
npx eas build --platform ios --profile production

# Build production Android
npx eas build --platform android --profile production

# Les deux plateformes
npx eas build --profile production
```

## 📦 Soumissions App Store

### Soumission iOS

```bash
# Soumettre à TestFlight + App Store Review
npx eas submit --platform ios --profile production

# Soumettre un build spécifique
npx eas submit --platform ios --build-id [BUILD_ID]
```

### Soumission Android

```bash
# Soumettre au Google Play Store
npx eas submit --platform android --profile production
```

## ⚡ Mises à jour OTA (Over-The-Air)

### Publier une mise à jour

```bash
# Mise à jour automatique (prend le dernier commit)
npx eas update --auto

# Mise à jour avec message personnalisé
npx eas update --message "Fix critical bug"

# Mise à jour pour une branche spécifique
npx eas update --branch production
```

### Voir les mises à jour

```bash
# Lister toutes les mises à jour
npx eas update:list

# Voir une mise à jour spécifique
npx eas update:view [UPDATE_ID]
```

## 🔧 Gestion des Versions

### Incrémenter les versions

```bash
# Version patch (1.2.0 → 1.2.1)
npm run version:patch

# Version mineure (1.2.0 → 1.3.0)
npm run version:minor

# Version majeure (1.2.0 → 2.0.0)
npm run version:major

# Voir la version actuelle
npm run version:status
```

### Builds avec auto-incrémentation

```bash
# Incrémente automatiquement le buildNumber iOS
npm run build:ios

# Incrémente automatiquement le versionCode Android
npm run build:android

# Les deux
npm run build:both
```

## 🧪 Tests & Qualité

### Linting et formatage

```bash
# Vérifier le code
npm run lint

# Corriger automatiquement
npm run lint --fix

# Formater le code
npm run format

# Vérifier le formatage
npm run format:check
```

### Vérification TypeScript

```bash
# Vérifier les types
npm run typecheck
```

### Tests complets (pre-commit)

```bash
# Lance lint + format + typecheck
npm run pre-commit
```

## 📊 Monitoring & Debug

### Voir les logs des builds

```bash
# Dashboard EAS
https://expo.dev/accounts/[USERNAME]/projects/fastflix

# Logs en temps réel
npx eas build:list --limit=10
```

### Debug avec Flipper

```bash
# Installer Flipper (macOS)
brew install --cask flipper

# Puis lancer l'app avec Flipper ouvert
npm run ios
```

## 🔐 Gestion des Credentials

### Voir les credentials

```bash
# Lister les credentials iOS
npx eas credentials:list --platform ios

# Lister les credentials Android
npx eas credentials:list --platform android
```

### Regenerer les credentials

```bash
# Supprimer et recréer les credentials iOS
npx eas credentials --platform ios --clear-all

# Configurer manuellement
npx eas credentials:configure --platform ios
```

## 🌐 Site Web

### Développement local

```bash
cd website/
npm run dev
# Site disponible sur http://localhost:3000
```

### Build production

```bash
cd website/
npm run build
npm run start
```

### Déploiement Vercel

```bash
cd website/
npx vercel --prod
```

## 📱 RevenueCat & Abonnements

### Tester les achats

```bash
# Mode sandbox iOS - utiliser un compte Apple Sandbox
# Aller dans Réglages > App Store > Compte Sandbox

# Réinitialiser les achats de test
# Réglages > App Store > Réinitialiser les achats sandbox
```

## 🚨 Commandes d'Urgence

### Rollback d'une mise à jour OTA

```bash
# Revenir à la version précédente
npx eas update:rollback

# Désactiver les mises à jour OTA temporairement
npx eas update:branch --branch main --disable
```

### Supprimer un build défaillant

```bash
# Annuler une soumission en cours
npx eas submit:cancel --platform ios

# Lister et supprimer des builds anciens
npx eas build:list --limit=20
npx eas build:delete [BUILD_ID]
```

## 📋 Checklist Déploiement Production

- [ ] Tests en local fonctionnels
- [ ] `npm run pre-commit` passe ✅
- [ ] Version incrémentée (`npm run version:patch`)
- [ ] Build production créé (`npx eas build --profile production`)
- [ ] Test sur TestFlight
- [ ] Soumission App Store (`npx eas submit --profile production`)
- [ ] Attendre validation Apple (1-3 jours)
- [ ] Publier sur l'App Store
- [ ] Mises à jour OTA prêtes pour les prochains fixes

## 🔗 Liens Utiles

- **EAS Dashboard** : https://expo.dev/accounts/bzrjoh/projects/fastflix
- **App Store Connect** : https://appstoreconnect.apple.com
- **RevenueCat Dashboard** : https://app.revenuecat.com
- **Site Web Production** : https://fastflix-nu.vercel.app
- **Documentation Expo** : https://docs.expo.dev
