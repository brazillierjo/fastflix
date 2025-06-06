# What Movie Tonight? 🎬

A smart movie and TV show recommendation app powered by AI. Simply describe what you're in the mood to watch, and get personalized recommendations with streaming availability information.

## Features

✨ **AI-Powered Recommendations**: Describe your mood or preferences in natural language and get tailored suggestions

🎯 **Smart Filtering**: Choose between movies, TV shows, or both

🌍 **Multi-language Support**: Available in English and French

📱 **Cross-Platform**: Runs on iOS, Android, and web

🎨 **Modern UI**: Beautiful, responsive interface with smooth animations

🔍 **Detailed Information**: Get movie/show details, ratings, and streaming provider information

## Technology Stack

- **Framework**: [Expo](https://expo.dev) with React Native
- **AI**: Google Generative AI (Gemini)
- **Movie Data**: The Movie Database (TMDB) API
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animations**: Moti (Framer Motion for React Native)
- **Navigation**: Expo Router with file-based routing
- **State Management**: React Context API
- **Internationalization**: Custom translation system

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
   cd what-movie-tonight
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

## Project Structure

```
what-movie-tonight/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── index.tsx      # Home screen with recommendations
│   │   ├── profile.tsx    # Profile/settings screen
│   │   └── _layout.tsx    # Tab layout configuration
│   ├── _layout.tsx        # Root layout with providers
│   └── +not-found.tsx     # 404 page
├── components/            # Reusable UI components
├── contexts/              # React Context providers
├── hooks/                 # Custom React hooks
├── locales/               # Translation files
│   ├── en.json           # English translations
│   └── fr.json           # French translations
├── constants/             # App constants
└── assets/               # Images, fonts, and other assets
```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run web` - Start web version
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## How It Works

1. **User Input**: Users describe what they want to watch in natural language
2. **AI Processing**: The app uses Google's Gemini AI to understand the request and generate relevant movie/TV show titles
3. **Data Fetching**: Movie details are fetched from TMDB API
4. **Streaming Info**: The app retrieves streaming provider information
5. **Results Display**: Recommendations are presented with posters, descriptions, and streaming availability

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
