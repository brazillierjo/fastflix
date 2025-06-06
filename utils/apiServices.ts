import axios from 'axios';
import Constants from 'expo-constants';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TMDBSearchItem } from '@/hooks/useMovieSearch';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;
const TMDB_API_KEY = Constants.expoConfig?.extra?.TMDB_API_KEY;

export const geminiService = {
  async generateRecommendations(
    query: string,
    numberOfRecommendations: number,
    contentTypes: string[]
  ): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contentTypeText = contentTypes.join(' et ');
    const prompt = `Basé sur cette demande: "${query}", recommande-moi ${numberOfRecommendations} ${contentTypeText}. Réponds uniquement avec les titres séparés par des virgules, sans numérotation ni explication supplémentaire.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response
      .text()
      .split(',')
      .map(title => title.trim());
  },
};

export const tmdbService = {
  async searchMulti(
    title: string,
    includeMovies: boolean,
    includeTvShows: boolean
  ): Promise<TMDBSearchItem | null> {
    try {
      const searchResponse = await axios.get(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
      );

      const results = searchResponse.data.results.filter(
        (item: TMDBSearchItem) => {
          if (item.media_type === 'movie' && includeMovies) return true;
          if (item.media_type === 'tv' && includeTvShows) return true;
          return false;
        }
      );

      return results[0] || null;
    } catch (error) {
      console.error(`Error searching for ${title}:`, error);
      return null;
    }
  },

  async getWatchProviders(itemId: number, mediaType: string): Promise<any[]> {
    try {
      const providerResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}/watch/providers?api_key=${TMDB_API_KEY}`
      );

      return providerResponse.data.results?.FR?.flatrate || [];
    } catch (error) {
      console.error(
        `Error fetching providers for ${mediaType} ${itemId}:`,
        error
      );
      return [];
    }
  },

  async getCredits(itemId: number, mediaType: string): Promise<any[]> {
    try {
      const creditsResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}/credits?api_key=${TMDB_API_KEY}&language=fr-FR`
      );

      // Retourner les 5 premiers acteurs principaux
      return creditsResponse.data.cast?.slice(0, 5) || [];
    } catch (error) {
      console.error(
        `Error fetching credits for ${mediaType} ${itemId}:`,
        error
      );
      return [];
    }
  },
};
