import LoadingState from '@/components/LoadingState';
import MovieResults from '@/components/MovieResults';
import SearchForm from '@/components/SearchForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Constants from 'expo-constants';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type?: 'movie' | 'tv' | 'person';
}

interface TMDBSearchItem {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

interface StreamingProvider {
  provider_name: string;
  logo_path: string;
}

export default function HomeScreen() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingProviders, setStreamingProviders] = useState<{
    [key: number]: StreamingProvider[];
  }>({});
  const [showWelcome, setShowWelcome] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [numberOfRecommendations, setNumberOfRecommendations] = useState(5);
  const [includeMovies, setIncludeMovies] = useState(true);
  const [includeTvShows, setIncludeTvShows] = useState(true);

  const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;
  const TMDB_API_KEY = Constants.expoConfig?.extra?.TMDB_API_KEY;
  const [isSearching, setIsSearching] = useState(false);

  const goBackToHome = () => {
    setShowResults(false);
    setShowWelcome(true);
    setMovies([]);
    setQuery('');
    setStreamingProviders({});
  };

  const searchMoviesWithGemini = async () => {
    if (!query.trim()) {
      Alert.alert(t('errors.title'), t('errors.enterRequest'));
      return;
    }

    if (!includeMovies && !includeTvShows) {
      Alert.alert(t('errors.title'), t('errors.selectContentType'));
      return;
    }

    setLoading(true);
    setShowWelcome(false);
    setMovies([]);
    try {
      // Initialize AI
      const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // AI prompt
      let contentTypes = [];
      if (includeMovies) contentTypes.push('films');
      if (includeTvShows) contentTypes.push('séries');
      const contentTypeText = contentTypes.join(' et ');

      const prompt = `Basé sur cette demande: "${query}", recommande-moi ${numberOfRecommendations} ${contentTypeText}. Réponds uniquement avec les titres séparés par des virgules, sans numérotation ni explication supplémentaire.`;

      // AI response
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const movieTitles = response
        .text()
        .split(',')
        .map(title => title.trim());

      // Look for each title on TMDB (movies and TV shows)
      const contentPromises = movieTitles.map(async title => {
        try {
          // Use multi-search to search for both movies and TV shows
          const searchResponse = await axios.get(
            `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
          );

          // Filter results based on media_type
          const results = searchResponse.data.results.filter(
            (item: TMDBSearchItem) => {
              if (item.media_type === 'movie' && includeMovies) return true;
              if (item.media_type === 'tv' && includeTvShows) return true;
              return false;
            }
          );

          return results[0] || null;
        } catch (error) {
          console.error(`${t('errors.searchMovieError')} ${title}:`, error);
          return null;
        }
      });

      const contentResults = await Promise.all(contentPromises);
      const validContent = contentResults.filter(
        item =>
          item !== null &&
          item !== undefined &&
          item.id &&
          (item.title || item.name) &&
          item.overview
      );

      setMovies(validContent);
      setIsSearching(true);

      // Get streaming providers for each movie
      const providerPromises = validContent.map(async item => {
        try {
          const mediaType = item.media_type || 'movie';
          const providerResponse = await axios.get(
            `https://api.themoviedb.org/3/${mediaType}/${item.id}/watch/providers?api_key=${TMDB_API_KEY}`
          );

          return {
            movieId: item.id,
            providers: providerResponse.data.results?.FR?.flatrate || [],
          };
        } catch (error) {
          console.error(
            `Erreur lors de la récupération des plateformes pour ${item.title || item.name}:`,
            error
          );

          return { movieId: item.id, providers: [] };
        }
      });

      const providerResults = await Promise.all(providerPromises);
      const providersMap: { [key: number]: StreamingProvider[] } = {};
      providerResults.forEach(result => {
        providersMap[result.movieId] = result.providers;
      });

      setStreamingProviders(providersMap);
      setIsSearching(false);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('errors.title'), t('errors.searchError'));
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={{
            flexDirection: 'row',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
            alignItems: 'center',
            justifyContent: showResults ? 'flex-start' : 'space-between',
          }}
        >
          {!showResults && (
            <>
              <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 200, type: 'timing', duration: 400 }}
                style={{
                  fontSize: 24,
                  fontWeight: '600',
                  color: '#000',
                  textAlign: 'left',
                }}
              >
                {t('welcome.title')}
              </MotiText>

              <TouchableOpacity
                style={{
                  padding: 8,
                }}
              >
                <Text style={{ fontSize: 24, color: '#000' }}>⚙️</Text>
              </TouchableOpacity>
            </>
          )}
        </MotiView>

        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {showWelcome && movies.length === 0 && !loading ? (
            <SearchForm
              query={query}
              setQuery={setQuery}
              numberOfRecommendations={numberOfRecommendations}
              setNumberOfRecommendations={setNumberOfRecommendations}
              includeMovies={includeMovies}
              setIncludeMovies={setIncludeMovies}
              includeTvShows={includeTvShows}
              setIncludeTvShows={setIncludeTvShows}
              onSearch={searchMoviesWithGemini}
              loading={loading}
            />
          ) : loading ? (
            <LoadingState isSearching={isSearching} />
          ) : (
            showResults && (
              <MovieResults
                movies={movies}
                streamingProviders={streamingProviders}
                onGoBack={goBackToHome}
              />
            )
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
