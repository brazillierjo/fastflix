# FastFlix - Android Release Checklist

## Phase 1: Google Play Console

### Creer un compte developpeur
- [ ] Aller sur [Google Play Console](https://play.google.com/console)
- [ ] Payer les frais d'inscription ($25 one-time)
- [ ] Completer la verification d'identite

### Creer l'application FastFlix
- [ ] Cliquer "Create app"
- [ ] Nom: "FastFlix"
- [ ] Langue par defaut: Francais ou English
- [ ] Type: App
- [ ] Categorie: Entertainment
- [ ] Accepter les conditions

### Configurer les informations de l'app
- [ ] Remplir "App content" > "Privacy policy" (URL de la privacy policy)
- [ ] Remplir "App content" > "Ads" (pas de pubs)
- [ ] Remplir "App content" > "Content rating" questionnaire
- [ ] Remplir "App content" > "Target audience"
- [ ] Remplir "App content" > "Data safety"

### Store Listing
- [ ] Ajouter le titre: "FastFlix - Movie Recommendations"
- [ ] Ajouter la description courte (80 caracteres max)
- [ ] Ajouter la description longue (4000 caracteres max)
- [ ] Uploader l'icone de l'app (512x512)
- [ ] Uploader le feature graphic (1024x500)
- [ ] Uploader les screenshots (min 2 pour telephone)
- [ ] Selectionner la categorie: Entertainment

### Configurer les abonnements
- [ ] Aller dans "Monetization" > "Products" > "Subscriptions"
- [ ] Creer l'abonnement Monthly (com.fastflix.app.Month) - 2,99 EUR
- [ ] Creer l'abonnement Quarterly (com.fastflix.app.Quarterly) - 6,99 EUR
- [ ] Creer l'abonnement Annual (com.fastflix.app.Annual) - 17,99 EUR
- [ ] Activer les abonnements

### Service Account pour RevenueCat
- [ ] Aller dans "Setup" > "API access"
- [ ] Creer un Service Account ou utiliser un existant
- [ ] Telecharger le JSON credentials
- [ ] Garder le fichier pour RevenueCat (Phase 3)

---

## Phase 2: Google Cloud Console - Authentication

### Creer Android OAuth Client ID
- [x] Aller sur [Google Cloud Console](https://console.cloud.google.com)
- [x] Selectionner le projet FastFlix existant
- [x] Aller dans "APIs & Services" > "Credentials"
- [x] Cliquer "Create Credentials" > "OAuth 2.0 Client ID"
- [x] Selectionner "Android" comme type d'application
- [x] Renseigner le package name: `com.fastflix.app`
- [x] Generer le SHA-1 fingerprint (voir commande ci-dessous)
- [x] Copier l'Android Client ID genere

```bash
# Pour generer le SHA-1 (debug)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Pour generer le SHA-1 (release - apres creation du keystore)
keytool -list -v -keystore /path/to/release.keystore -alias fastflix-release
```

---

## Phase 3: RevenueCat - Configuration Android

### Dashboard RevenueCat
- [ ] Se connecter sur [RevenueCat Dashboard](https://app.revenuecat.com)
- [ ] Aller dans le projet FastFlix
- [ ] Cliquer "Add App" et selectionner "Google Play Store"
- [ ] Uploader le Service Account JSON (de Phase 1)
- [ ] Copier l'Android Public API Key

### Creer les produits Android
- [ ] Aller dans "Products"
- [ ] Creer le produit Monthly pour Android (`com.fastflix.app.Month`)
- [ ] Creer le produit Quarterly pour Android (`com.fastflix.app.Quarterly`)
- [ ] Creer le produit Annual pour Android (`com.fastflix.app.Annual`)
- [ ] Verifier que les produits sont dans les bons "Offerings"

---

## Phase 4: Configuration du Code

### Variables d'environnement (.env.local)
- [x] Ajouter `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com`
- [ ] Ajouter `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxx`

### Modifier app.config.js
- [x] Ajouter les nouvelles variables dans `extra`

```js
extra: {
  // ... existing
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
}
```

### Modifier auth.tsx
- [x] Ajouter `androidClientId` dans `Google.useIdTokenAuthRequest()`

```tsx
const googleAndroidClientId =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  iosClientId: googleIosClientId,
  androidClientId: googleAndroidClientId,
});

// Mettre a jour la condition d'affichage du bouton Google
{(googleIosClientId || googleAndroidClientId) && (
  <TouchableOpacity ... />
)}
```

### Modifier RevenueCatContext.tsx
- [ ] Ajouter la cle API Android dans Platform.select

```tsx
const apiKey = Platform.select({
  ios: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  android: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
});
```

---

## Phase 5: Build Configuration

### Generer le Release Keystore
- [x] Executer la commande ci-dessous (fait via EAS)
- [x] Sauvegarder le keystore dans un endroit securise (PAS dans git)
- [x] Noter le mot de passe dans un gestionnaire de mots de passe

```bash
keytool -genkey -v -keystore fastflix-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias fastflix-release
```

### Configurer EAS Build
- [x] Ajouter le keystore a EAS: `eas credentials`
- [x] Selectionner Android > production
- [x] Upload le keystore

---

## Phase 6: Test

### Build de test
- [ ] Lancer `eas build --platform android --profile preview`
- [ ] Installer l'APK sur un appareil Android
- [ ] Tester Google Sign In
- [ ] Tester l'affichage du paywall
- [ ] Tester un achat en sandbox (si configure)

### Internal Testing Track
- [ ] Uploader le build sur Internal Testing dans Play Console
- [ ] Ajouter des testeurs (emails)
- [ ] Tester le flow complet d'achat

---

## Phase 7: Release

### Build de production
- [ ] Lancer `eas build --platform android --profile production`
- [ ] Telecharger l'AAB (Android App Bundle)

### Soumettre sur Play Store
- [ ] Aller dans "Release" > "Production"
- [ ] Cliquer "Create new release"
- [ ] Uploader l'AAB
- [ ] Ajouter les release notes
- [ ] Soumettre pour review

### Post-release
- [ ] Verifier que l'app est approuvee (1-3 jours)
- [ ] Tester l'app depuis le Play Store
- [ ] Verifier que les achats fonctionnent en production

---

## Notes importantes

- Le SHA-1 doit correspondre au keystore utilise pour signer l'app
- Les product IDs doivent etre identiques entre Play Console et RevenueCat
- Le webhook RevenueCat est le meme pour iOS et Android
- Apple Sign In n'est pas disponible sur Android (Google Sign In uniquement)
- Le package name `com.fastflix.app` est deja configure dans app.config.js

## Ressources utiles

- [Expo Android Guide](https://docs.expo.dev/workflow/android-studio-emulator/)
- [RevenueCat Android Setup](https://www.revenuecat.com/docs/getting-started/installation/android)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [EAS Build Android](https://docs.expo.dev/build/setup/#android)
