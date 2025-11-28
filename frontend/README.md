# 🎬 FastFlix

**AI-powered movie and TV show recommendations.** Discover what to watch tonight with personalized suggestions based on your mood and preferences.

[![App Store](https://img.shields.io/badge/Download-App%20Store-blue?style=for-the-badge&logo=apple)](https://apps.apple.com/app/fastflix/id6746981485)
[![Website](https://img.shields.io/badge/Visit-Website-green?style=for-the-badge&logo=vercel)](https://fastflix-website.vercel.app)

## 🚀 Overview

Stop endless scrolling! FastFlix uses AI to provide intelligent movie and TV show recommendations. Simply tell us what you're in the mood for, and get personalized suggestions ranked by rating to help you decide quickly.

### ✨ Key Features

- 🤖 **AI-Powered Recommendations** - Advanced AI analyzes your preferences
- 🎯 **Personalized Suggestions** - Tailored to your mood and taste
- ⭐ **Rating-Based Ranking** - Best content first, save time deciding
- 🌍 **Multi-Language Support** - English, French, Italian, Japanese
- 📱 **Cross-Platform** - iOS app + responsive web version
- 🔄 **Real-Time Updates** - Over-the-air updates for instant improvements

### 💎 FastFlix Pro

- ♾️ **Unlimited Recommendations** - No monthly limits
- 🎛️ **Advanced Filters** - Genre, year, rating, and more
- 📱 **Premium Features** - Enhanced AI, smart notifications
- ☁️ **Cloud Sync** - Your preferences across devices
- 🔐 **Persistent Identity** - Keychain-based user tracking survives app reinstalls

## 📱 App Structure

This is a **monorepo** containing:

### 🎯 **Mobile App** (`/`)

- **Framework**: Expo SDK 53 + React Native
- **Languages**: TypeScript + NativeWind (Tailwind CSS)
- **Platforms**: iOS (App Store) + Android (coming soon)
- **AI Integration**: Google Gemini AI
- **Subscriptions**: RevenueCat integration
- **Updates**: EAS Updates for instant deployments

### 🌐 **Website** (`/website/`)

- **Framework**: Next.js 15 + React 19
- **Languages**: TypeScript + Tailwind CSS
- **Features**: Marketing site, support, privacy policy
- **Deployment**: Vercel
- **Performance**: Static generation + image optimization

## 🛠️ Tech Stack

### Mobile App

- **Expo SDK 53** - React Native framework
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **NativeWind** - Tailwind CSS for React Native
- **Expo Router** - File-based navigation
- **RevenueCat** - Subscription management with persistent identity
- **Google Gemini AI** - Movie recommendations
- **Expo Secure Store** - Keychain-based persistent storage
- **AsyncStorage** - Local data persistence
- **EAS Build & Submit** - CI/CD pipeline

### Website

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible components
- **Vercel** - Deployment platform

## 🚦 Quick Start

### Prerequisites

- Node.js 18+
- iOS device or simulator
- Expo CLI
- Apple Developer Account (for builds)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/fastflix.git
   cd fastflix
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Add your API keys (Google Gemini, TMDB, RevenueCat)
   ```

4. **Start development server**
   ```bash
   npm start
   # Scan QR code with Expo Go app
   ```

### Website Development

```bash
cd website/
npm install
npm run dev
# Visit http://localhost:3000
```

## 📖 Documentation

- **[Development Guide](./DEVELOPMENT.md)** - Complete command reference
- **[Website README](./website/README.md)** - Website-specific documentation

### Quick Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run ios                  # Run on iOS simulator/device

# Building & Deployment
npx eas build --profile production    # Production build
npx eas submit --profile production   # Submit to App Store
npx eas update --auto                 # OTA update

# Versioning
npm run version:patch        # 1.2.0 → 1.2.1
npm run version:minor        # 1.2.0 → 1.3.0

# Code Quality
npm run lint                 # Check code style
npm run format              # Format code
npm run typecheck           # Type checking
```

## 🏗️ Project Architecture

### Mobile App (`/`)

```
├── app/                    # Expo Router pages
│   ├── index.tsx          # Home screen with AI search
│   └── profile.tsx        # User profile & settings
├── components/            # Reusable UI components
│   ├── SearchForm.tsx     # AI prompt interface
│   ├── MovieResults.tsx   # Recommendation display
│   └── SubscriptionModal.tsx # Premium upgrade
├── contexts/              # React contexts
│   ├── RevenueCatContext.tsx  # Subscription management
│   └── LanguageContext.tsx    # Internationalization
├── services/              # Business logic services
│   ├── deviceIdentity.service.ts  # Keychain identity management
│   └── persistentUser.service.ts  # User data persistence
├── hooks/                 # Custom React hooks
├── utils/                 # API services & utilities
├── types/                 # TypeScript type definitions
└── locales/              # Translation files
```

### Website (`/website/`)

```
└── src/
    ├── app/              # Next.js pages
    ├── components/       # React components
    ├── contexts/         # Shared contexts
    └── lib/             # Utilities & constants
```

## 🔧 Configuration

### Environment Variables

**Mobile App (`.env`)**

```env
GOOGLE_API_KEY=your_gemini_api_key
TMDB_API_KEY=your_tmdb_api_key
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_revenuecat_key
```

**Website (`.env.local`)**

```env
NEXT_PUBLIC_APP_URL=https://fastflix-website.vercel.app
```

## 🚀 Deployment

### Mobile App

1. **Development**: `npm start` + Expo Go
2. **Testing**: `npx eas build --profile preview` → TestFlight
3. **Production**: `npx eas build --profile production` → App Store
4. **Updates**: `npx eas update --auto` → OTA updates

### Website

- **Development**: `npm run dev`
- **Production**: Auto-deployed via Vercel on git push

## 🌍 Internationalization

Supported languages:

- 🇺🇸 English
- 🇫🇷 French
- 🇮🇹 Italian
- 🇯🇵 Japanese

Translation files are located in `/locales/` and `/website/src/lib/translations.ts`.

## 📊 Analytics & Monitoring

- **RevenueCat**: Subscription analytics with persistent device identity
- **EAS**: Build and update monitoring
- **Expo**: Crash reporting and performance metrics
- **Keychain Storage**: Secure persistent user identification across app reinstalls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`npm run pre-commit`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Standards

- ESLint + Prettier configuration
- TypeScript strict mode
- Comprehensive error handling
- Responsive design principles
- Accessibility compliance (WCAG 2.1)

## 📄 License

All rights reserved. This is proprietary software.

## 📞 Support

- **Website**: [https://fastflix-website.vercel.app/support](https://fastflix-website.vercel.app/support)
- **Email**: [support@fastflix.app](mailto:support@fastflix.app)
- **App Store**: Leave a review and rating

## 🔗 Links

- **📱 App Store**: https://apps.apple.com/app/fastflix/id6746981485
- **🌐 Website**: https://fastflix-website.vercel.app
- **📚 Privacy Policy**: https://fastflix-website.vercel.app/privacy-policy
- **📋 Terms of Use**: https://fastflix-website.vercel.app/terms-of-use
- **🛠️ Developer Dashboard**: https://expo.dev/accounts/bzrjoh/projects/fastflix

---

**Made with ❤️ for movie lovers everywhere**
