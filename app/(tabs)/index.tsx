import { useLanguage } from '@/contexts/LanguageContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Constants from 'expo-constants';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
  Dimensions,
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

  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth - 48; // 24px padding on each side

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event) => {
      const { locationX } = event.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
      const newValue = Math.round(percentage * 9) + 1; // 1 to 10
      setNumberOfRecommendations(newValue);
    },
  });

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
      Alert.alert(
        t('errors.title'),
        t('errors.selectContentType')
      );
      return;
    }

    setShowWelcome(false);
    setShowResults(true);
    setLoading(true);
    setMovies([]);
    try {
      // Initialiser Gemini AI
      const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Créer un prompt pour Gemini
      let contentTypes = [];
      if (includeMovies) contentTypes.push('films');
      if (includeTvShows) contentTypes.push('séries');
      const contentTypeText = contentTypes.join(' et ');

      const prompt = `Basé sur cette demande: "${query}", recommande-moi ${numberOfRecommendations} ${contentTypeText}. Réponds uniquement avec les titres séparés par des virgules, sans numérotation ni explication supplémentaire.`;

      // Obtenir la réponse de Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const movieTitles = response
        .text()
        .split(',')
        .map(title => title.trim());

      // Rechercher chaque titre sur TMDB (films et séries)
      const contentPromises = movieTitles.map(async title => {
        try {
          // Utiliser multi-search pour chercher films et séries
          const searchResponse = await axios.get(
            `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
          );

          // Filtrer selon les préférences de l'utilisateur
          const results = searchResponse.data.results.filter(
            (item: TMDBSearchItem) => {
              if (item.media_type === 'movie' && includeMovies) return true;
              if (item.media_type === 'tv' && includeTvShows) return true;
              return false;
            }
          );

          return results[0] || null; // Prendre le premier résultat valide
        } catch (error) {
          console.error(`Erreur lors de la recherche de ${title}:`, error);
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

      // Obtenir les plateformes de streaming pour chaque contenu
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
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert(t('errors.title'), t('errors.searchError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
      >
        {/* En-tête */}
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
          {showResults && (
            <TouchableOpacity
              onPress={goBackToHome}
              style={{
                padding: 8,
              }}
            >
              <Text style={{ fontSize: 24, color: '#000' }}>←</Text>
            </TouchableOpacity>
          )}

          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 200, type: 'timing', duration: 400 }}
            style={{
              fontSize: 24,
              fontWeight: '600',
              color: '#000',
              textAlign: showResults ? 'center' : 'left',
              flex: showResults ? 1 : 0,
            }}
          >
            {showResults ? t('movies.recommendations') : t('welcome.title')}
          </MotiText>

          {!showResults && (
            <TouchableOpacity
              style={{
                padding: 8,
              }}
            >
              <Text style={{ fontSize: 24, color: '#000' }}>⚙️</Text>
            </TouchableOpacity>
          )}
        </MotiView>

        {/* Contenu principal */}
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {showWelcome && movies.length === 0 && !loading ? (
            <>
              {/* Champ de description */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  delay: 300,
                  type: 'timing',
                  duration: 600,
                }}
                style={{
                  marginBottom: 24,
                }}
              >
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: '#000',
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder={t('welcome.inputPlaceholder')}
                  placeholderTextColor='#999'
                  value={query}
                  onChangeText={setQuery}
                  multiline
                  maxLength={200}
                />
              </MotiView>

              {/* Options */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  delay: 500,
                  type: 'timing',
                  duration: 600,
                }}
                style={{
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#000',
                    marginBottom: 16,
                  }}
                >
                  {t('welcome.options')}
                </Text>

                {/* Nombre de recommandations */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#000',
                    }}
                  >
                      {t('settings.numberOfRecommendations')}
                    </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        backgroundColor: '#000',
                        borderRadius: 20,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        minWidth: 40,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#fff',
                        }}
                      >
                        {numberOfRecommendations}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Slider pour le nombre de recommandations */}
                <View style={{ marginBottom: 20 }}>
                  <View
                    {...panResponder.panHandlers}
                    style={{
                      height: 20,
                      justifyContent: 'center',
                      paddingVertical: 8,
                    }}
                  >
                    <View
                      style={{
                        height: 4,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 2,
                        position: 'relative',
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          backgroundColor: '#000',
                          borderRadius: 2,
                          width: `${((numberOfRecommendations - 1) / 9) * 100}%`,
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          left: `${((numberOfRecommendations - 1) / 9) * 100}%`,
                          top: -6,
                          width: 16,
                          height: 16,
                          backgroundColor: '#000',
                          borderRadius: 8,
                          marginLeft: -8,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Sélecteur de type de contenu */}
                <View style={{ marginBottom: 20 }}>
                  <TouchableOpacity
                    onPress={() => setIncludeMovies(!includeMovies)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#000' }}>{t('settings.movies')}</Text>
                    <View
                      style={{
                        width: 50,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: includeMovies ? '#000' : '#e0e0e0',
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: '#fff',
                          alignSelf: includeMovies ? 'flex-end' : 'flex-start',
                        }}
                      />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIncludeTvShows(!includeTvShows)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ fontSize: 16, color: '#000' }}>{t('settings.tvShows')}</Text>
                    <View
                      style={{
                        width: 50,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: includeTvShows ? '#000' : '#e0e0e0',
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: '#fff',
                          alignSelf: includeTvShows ? 'flex-end' : 'flex-start',
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </MotiView>

              {/* Bouton Generate */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  delay: 600,
                  type: 'timing',
                  duration: 600,
                }}
                style={{
                  position: 'absolute',
                  bottom: 100,
                  left: 24,
                  right: 24,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: loading || !query.trim() ? '#ccc' : '#000',
                    borderRadius: 25,
                    paddingVertical: 16,
                    alignItems: 'center',
                  }}
                  onPress={searchMoviesWithGemini}
                  disabled={loading || !query.trim()}
                >
                  {loading ? (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <ActivityIndicator color='#fff' size='small' />
                      <Text
                        style={{
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: 17,
                          marginLeft: 8,
                        }}
                      >
                          {t('welcome.generating')}
                        </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: loading || !query.trim() ? '#999' : '#fff',
                        fontWeight: '600',
                        fontSize: 17,
                      }}
                    >
                        {t('welcome.searchButton')}
                      </Text>
                  )}
                </TouchableOpacity>
              </MotiView>
            </>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              {loading && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{ alignItems: 'center', paddingVertical: 60 }}
                >
                  <ActivityIndicator
                    size='large'
                    color='#000'
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '500',
                      color: '#000',
                      marginBottom: 8,
                    }}
                  >
                      {t('welcome.searching')}
                    </Text>
                </MotiView>
              )}

              {movies.length > 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    type: 'timing',
                    duration: 600,
                  }}
                >
                  {/* Header with back button and title */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <TouchableOpacity
                      onPress={goBackToHome}
                      style={{
                        padding: 8,
                        marginRight: 16,
                      }}
                    >
                      <Text style={{ fontSize: 18, color: '#000' }}>←</Text>
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: '#000',
                        flex: 1,
                        textAlign: 'center',
                        marginRight: 42, // To center the title accounting for back button
                      }}
                    >
                      {t('movies.recommendations')}
                    </Text>
                  </View>

                  <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                    {movies.map((movie, index) => {
                      // Vérification de sécurité supplémentaire
                      if (
                        !movie ||
                        !movie.id ||
                        (!movie.title && !movie.name)
                      ) {
                        return null;
                      }

                      return (
                        <MotiView
                          key={movie.id}
                          from={{ opacity: 0, translateY: 30 }}
                          animate={{ opacity: 1, translateY: 0 }}
                          transition={{
                            delay: index * 150,
                            type: 'timing',
                            duration: 500,
                          }}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                          }}
                        >
                          <View style={{ flexDirection: 'row' }}>
                            {movie.poster_path && (
                              <MotiView
                                from={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  delay: index * 150 + 200,
                                  type: 'timing',
                                  duration: 400,
                                }}
                                style={{
                                  backgroundColor: '#f0f0f0',
                                  borderRadius: 8,
                                  marginRight: 12,
                                }}
                              >
                                <Image
                                  source={{
                                    uri: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
                                  }}
                                  style={{
                                    width: 60,
                                    height: 90,
                                    borderRadius: 8,
                                  }}
                                  resizeMode='cover'
                                />
                              </MotiView>
                            )}
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: '600',
                                  color: '#000',
                                  marginBottom: 4,
                                  lineHeight: 20,
                                }}
                              >
                                {movie.title || movie.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: '#666',
                                  marginBottom: 8,
                                }}
                              >
                                {movie.overview
                                  ? movie.overview.length > 100
                                    ? movie.overview.substring(0, 100) + '...'
                                    : movie.overview
                                  : t('welcome.noDescription')}
                              </Text>
                              {streamingProviders[movie.id] &&
                                streamingProviders[movie.id].length > 0 && (
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 8,
                                    }}
                                  >
                                    <View
                                      style={{
                                        backgroundColor: '#000',
                                        padding: 4,
                                        borderRadius: 4,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: '#fff',
                                          fontSize: 10,
                                          fontWeight: '600',
                                        }}
                                      >
                                        N
                                      </Text>
                                    </View>
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        color: '#000',
                                        fontWeight: '500',
                                      }}
                                    >
                                      {streamingProviders[movie.id][0]
                                        ?.provider_name || 'Netflix'}
                                    </Text>
                                  </View>
                                )}
                            </View>
                          </View>
                        </MotiView>
                      );
                    })}
                  </View>
                </MotiView>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
