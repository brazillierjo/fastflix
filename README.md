# FastFlix 🎬

A smart movie and TV show recommendation app powered by AI. Simply describe what you're in the mood to watch, and get personalized recommendations with streaming availability information.

## Features

✨ **AI-Powered Recommendations**: Describe your mood or preferences in natural language and get tailored suggestions

🎯 **Smart Filtering**: Choose between movies, TV shows, or both

🌍 **Multi-language Support**: Available in English and French

📱 **Cross-Platform**: Runs on iOS, Android, and web

🎨 **Modern UI**: Beautiful, responsive interface with smooth animations

🔍 **Detailed Information**: Get movie/show details, ratings, and streaming provider information

## How It Works

**FastFlix** is an intelligent application that combines Google Gemini AI with the TMDB API to provide personalized movie and TV show recommendations.

### Detailed Application Flow:

1. **Intuitive User Interface**:

   - Search form with natural language input
   - Configurable filters (movies, TV shows, or both)
   - Fixed maximum of 20 recommendations
   - Multi-language support with automatic detection

2. **Advanced AI Processing**:

   - Uses Gemini 2.0 Flash to analyze user queries
   - Contextual title generation based on mood, genres, or preferences
   - Localized processing with region-specific responses

3. **Multi-Source Data Aggregation**:

   - TMDB search for each recommended title
   - Complete metadata retrieval (synopsis, ratings, posters)
   - Cast and crew information collection
   - Streaming platform availability

4. **Enhanced Presentation**:

   - Modern interface with smooth animations (Moti)
   - Detailed cards with high-quality posters
   - Streaming information with platform logos
   - Advanced sorting and filtering system
   - Loading states and error handling

5. **Sophisticated State Management**:
   - `useAppState` hook for global coordination
   - `useMovieSearch` hook with React Query for API management
   - Language context with preference persistence
   - Smooth navigation between home and profile screens

## Technology Stack

- **Framework**: [Expo](https://expo.dev) with React Native
- **AI**: Google Generative AI (Gemini)
- **Movie Data**: The Movie Database (TMDB) API
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animations**: Moti (Framer Motion for React Native)
- **Navigation**: Expo Router with file-based routing
- **State Management**: React Context API
- **Internationalization**: Custom translation system
- **Code Quality**: Husky for Git hooks, ESLint, Prettier, TypeScript

## Prerequisites

Before running the app, you'll need:

1. **API Keys**:

   - Google Generative AI API key
   - The Movie Database (TMDB) API key

2. **Development Environment**:
   - Node.js (v18 or later)
   - Expo CLI
   - iOS Simulator (for iOS development)
   - Android Studio (for Android development)

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd fastflix
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## Running the App

After starting the development server, you can run the app on:

- **iOS Simulator**: Press `i` in the terminal or scan the QR code with your iPhone
- **Android Emulator**: Press `a` in the terminal or scan the QR code with the Expo Go app
- **Web Browser**: Press `w` in the terminal
- **Physical Device**: Install [Expo Go](https://expo.dev/go) and scan the QR code

## Code Quality & Git Hooks

The project uses **Husky** to enforce code quality standards before commits. Pre-commit hooks automatically run:

- **ESLint**: Code linting and style checking
- **Prettier**: Code formatting verification
- **TypeScript**: Type checking with `tsc --noEmit`

If any check fails, the commit will be blocked until issues are resolved. You can manually run these checks:

```bash
npm run lint          # Run ESLint
npm run format:check  # Check code formatting
npm run typecheck     # Run TypeScript checks
npm run pre-commit    # Run all checks together
```

## Project Structure

```
fastflix/
├── app/                    # Code principal de l'application
│   ├── _layout.tsx        # Layout racine avec providers (QueryProvider, LanguageProvider)
│   ├── index.tsx          # Écran d'accueil avec recherche et recommandations
│   ├── profile.tsx        # Écran de profil/paramètres (langue, pays)
│   └── +not-found.tsx     # Page 404
├── components/            # Composants UI réutilisables
│   ├── SearchForm.tsx     # Formulaire de recherche avec filtres
│   ├── MovieResults.tsx   # Affichage des résultats avec tri/filtrage
│   ├── LoadingState.tsx   # États de chargement animés
│   ├── LanguageSelector.tsx # Sélecteur de langue
│   ├── SettingsModal.tsx  # Modal de paramètres
│   └── HapticTab.tsx      # Onglets avec retour haptique
├── hooks/                 # Hooks React personnalisés
│   ├── useAppState.ts     # Gestion d'état globale de l'application
│   └── useMovieSearch.ts  # Logique de recherche avec Gemini + TMDB
├── contexts/              # Providers React Context
│   └── LanguageContext.tsx # Gestion multilingue et pays
├── providers/             # Providers externes
│   └── QueryProvider.tsx # Configuration React Query
├── utils/                 # Utilitaires et services
│   ├── apiServices.ts     # Services API (Gemini, TMDB)
│   └── cn.ts             # Utilitaire de classes CSS
├── locales/               # Fichiers de traduction
│   ├── en.json           # Traductions anglaises
│   └── fr.json           # Traductions françaises
├── assets/               # Ressources statiques
│   ├── app-images/       # Icônes et splash screens
│   └── fonts/            # Polices personnalisées
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start web version
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run version:patch` - Increment patch version (0.0.1 → 0.0.2)
- `npm run version:minor` - Increment minor version (0.0.1 → 0.1.0)
- `npm run version:major` - Increment major version (0.0.1 → 1.0.0)

## Version Management

FastFlix uses a centralized versioning system that manages app versions, iOS build numbers, and Android version codes from a single source. The project follows semantic versioning (MAJOR.MINOR.PATCH) and includes custom scripts for automated version management.

### Key Features:

- **Centralized Configuration**: Single source of truth in `package.json`
- **Automated Build Numbers**: Environment-based iOS and Android build management
- **Custom Scripts**: Easy version incrementing with `npm run version:*` commands
- **Store Compatibility**: Full compatibility with App Store Connect and Google Play Console

For detailed information about the versioning system, implementation details, best practices, and migration guides, see [VERSIONING.md](VERSIONING.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
