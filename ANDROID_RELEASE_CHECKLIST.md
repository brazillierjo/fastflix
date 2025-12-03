# FastFlix - Android Release Checklist

## Phase 1: Google Cloud Console - Authentication

### Créer Android OAuth Client ID
- [ ] Aller sur [Google Cloud Console](https://console.cloud.google.com)
- [ ] Sélectionner le projet FastFlix existant
- [ ] Aller dans "APIs & Services" > "Credentials"
- [ ] Cliquer "Create Credentials" > "OAuth 2.0 Client ID"
- [ ] Sélectionner "Android" comme type d'application
- [ ] Renseigner le package name: `com.fastflix.app`
- [ ] Générer le SHA-1 fingerprint (voir commande ci-dessous)
- [ ] Copier l'Android Client ID généré

```bash
# Pour générer le SHA-1 (debug)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Pour générer le SHA-1 (release - après création du keystore)
keytool -list -v -keystore /path/to/release.keystore -alias fastflix-release
```

---

## Phase 2: RevenueCat - Configuration Android

### Dashboard RevenueCat
- [ ] Se connecter sur [RevenueCat Dashboard](https://app.revenuecat.com)
- [ ] Aller dans le projet FastFlix
- [ ] Cliquer "Add App" et sélectionner "Google Play Store"
- [ ] Configurer le Service Account JSON (voir Phase 4)
- [ ] Copier l'Android Public API Key

### Créer les produits Android
- [ ] Aller dans "Products"
- [ ] Créer le produit Monthly pour Android (`com.fastflix.app.Month`)
- [ ] Créer le produit Quarterly pour Android (`com.fastflix.app.Quarterly`)
- [ ] Créer le produit Annual pour Android (`com.fastflix.app.Annual`)
- [ ] Vérifier que les produits sont dans les bons "Offerings"

---

## Phase 3: Configuration du Code

### Variables d'environnement (.env.local)
- [ ] Ajouter `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com`
- [ ] Ajouter `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxx`

### Modifier auth.tsx
- [ ] Importer les variables d'environnement Android
- [ ] Ajouter `androidClientId` dans `Google.useIdTokenAuthRequest()`

```tsx
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  iosClientId: googleIosClientId,
  androidClientId: googleAndroidClientId, // Ajouter cette ligne
});
```

### Modifier RevenueCatContext.tsx
- [ ] Ajouter Platform.select pour l'API key

```tsx
const apiKey = Platform.select({
  ios: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
});
```

### Synchroniser les versions
- [ ] Mettre à jour `android/app/build.gradle` versionName vers 2.1.0
- [ ] Incrémenter versionCode si nécessaire

---

## Phase 4: Google Play Console

### Créer un compte développeur
- [ ] Aller sur [Google Play Console](https://play.google.com/console)
- [ ] Payer les frais d'inscription ($25 one-time)
- [ ] Compléter la vérification d'identité

### Créer l'application FastFlix
- [ ] Cliquer "Create app"
- [ ] Nom: "FastFlix"
- [ ] Langue par défaut: Français ou English
- [ ] Type: App
- [ ] Catégorie: Entertainment
- [ ] Accepter les conditions

### Configurer les informations de l'app
- [ ] Remplir "App content" > "Privacy policy" (URL de la privacy policy)
- [ ] Remplir "App content" > "Ads" (pas de pubs)
- [ ] Remplir "App content" > "Content rating" questionnaire
- [ ] Remplir "App content" > "Target audience"
- [ ] Remplir "App content" > "Data safety"

### Store Listing
- [ ] Ajouter le titre: "FastFlix - Movie Recommendations"
- [ ] Ajouter la description courte (80 caractères max)
- [ ] Ajouter la description longue (4000 caractères max)
- [ ] Uploader l'icône de l'app (512x512)
- [ ] Uploader le feature graphic (1024x500)
- [ ] Uploader les screenshots (min 2 pour téléphone)
- [ ] Sélectionner la catégorie: Entertainment

### Configurer les abonnements
- [ ] Aller dans "Monetization" > "Products" > "Subscriptions"
- [ ] Créer l'abonnement Monthly (com.fastflix.app.Month) - 2,99€
- [ ] Créer l'abonnement Quarterly (com.fastflix.app.Quarterly) - 6,99€
- [ ] Créer l'abonnement Annual (com.fastflix.app.Annual) - 17,99€
- [ ] Activer les abonnements

### Service Account pour RevenueCat
- [ ] Aller dans "Setup" > "API access"
- [ ] Créer un Service Account ou utiliser un existant
- [ ] Télécharger le JSON credentials
- [ ] Uploader le JSON dans RevenueCat (Phase 2)

---

## Phase 5: Build Configuration

### Générer le Release Keystore
- [ ] Exécuter la commande ci-dessous
- [ ] Sauvegarder le keystore dans un endroit sécurisé (PAS dans git)
- [ ] Noter le mot de passe dans un gestionnaire de mots de passe

```bash
keytool -genkey -v -keystore fastflix-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias fastflix-release
```

### Configurer EAS Build
- [ ] Ajouter le keystore à EAS: `eas credentials`
- [ ] Sélectionner Android > production
- [ ] Upload le keystore

### Mettre à jour eas.json (optionnel)
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Phase 6: Test

### Build de test
- [ ] Lancer `eas build --platform android --profile preview`
- [ ] Installer l'APK sur un appareil Android
- [ ] Tester Google Sign In
- [ ] Tester l'affichage du paywall
- [ ] Tester un achat en sandbox (si configuré)

### Internal Testing Track
- [ ] Uploader le build sur Internal Testing dans Play Console
- [ ] Ajouter des testeurs (emails)
- [ ] Tester le flow complet d'achat

---

## Phase 7: Release

### Build de production
- [ ] Lancer `eas build --platform android --profile production`
- [ ] Télécharger l'AAB (Android App Bundle)

### Soumettre sur Play Store
- [ ] Aller dans "Release" > "Production"
- [ ] Cliquer "Create new release"
- [ ] Uploader l'AAB
- [ ] Ajouter les release notes
- [ ] Soumettre pour review

### Post-release
- [ ] Vérifier que l'app est approuvée (1-3 jours)
- [ ] Tester l'app depuis le Play Store
- [ ] Vérifier que les achats fonctionnent en production

---

## Ressources utiles

- [Expo Android Guide](https://docs.expo.dev/workflow/android-studio-emulator/)
- [RevenueCat Android Setup](https://www.revenuecat.com/docs/getting-started/installation/android)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [EAS Build Android](https://docs.expo.dev/build/setup/#android)

---

## Notes

- Le SHA-1 doit correspondre au keystore utilisé pour signer l'app
- Les product IDs doivent être identiques entre Play Console et RevenueCat
- Le webhook RevenueCat est le même pour iOS et Android
- Apple Sign In n'est pas disponible sur Android (Google Sign In uniquement)
