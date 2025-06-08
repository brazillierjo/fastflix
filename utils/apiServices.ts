/**
 * API Services Module
 *
 * This file provides a centralized interface for all external API interactions in the
 * "FastFlix" application. It abstracts the complexity of working with multiple
 * third-party services and provides a clean, consistent API for the application to consume.
 *
 * The module integrates two primary services:
 *
 * 1. Google Gemini AI Service:
 *    - Generates intelligent movie and TV show recommendations using natural language processing
 *    - Processes user queries in French and returns contextually relevant suggestions
 *    - Leverages the latest Gemini 2.0 Flash model for fast and accurate responses
 *    - Handles content type filtering (movies vs TV shows) based on user preferences
 *
 * 2. The Movie Database (TMDB) Service:
 *    - Provides comprehensive movie and TV show metadata including titles, descriptions, ratings
 *    - Fetches high-quality poster images and media information
 *    - Retrieves streaming provider availability specifically for the French market
 *    - Supplies cast and crew information with localized French content
 *    - Supports multi-search functionality across different media types
 *
 * Key architectural decisions:
 * - Uses environment variables for secure API key management
 * - Implements proper error handling and logging for debugging
 * - Provides French localization for all API responses
 * - Maintains consistent data structures across different API responses
 * - Optimizes API calls by limiting results and focusing on relevant data
 *
 * The services are designed to be easily testable, maintainable, and extensible
 * for future API integrations or modifications.
 */

import { TMDBSearchItem } from '@/hooks/useMovieSearch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Constants from 'expo-constants';

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
    const prompt = `Tu es un assistant IA expert en cinéma et télévision. Basé sur cette demande: "${query}", recommande-moi ${numberOfRecommendations} ${contentTypeText}.

IMPORTANT: Sois très précis dans tes recommandations :
- Si un nom d'acteur est mentionné, recommande uniquement des œuvres où cet acteur joue réellement
- Si un réalisateur est mentionné, recommande uniquement ses œuvres
- Si un genre est mentionné, respecte strictement ce genre
- Si une époque est mentionnée, respecte cette période
- Privilégie les œuvres les plus connues et populaires
- Vérifie mentalement que chaque recommandation correspond exactement à la demande

Réponds uniquement avec les titres qui correspondent EXACTEMENT à la demande, séparés par des virgules, sans numérotation ni explication supplémentaire.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response
      .text()
      .split(',')
      .map(title => title.trim());
  },

  async generateConversationalResponse(query: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Tu es un assistant IA spécialisé dans les recommandations de films et séries. Un utilisateur te demande: "${query}". 

Réponds de manière conversationnelle et amicale dans la même langue que la demande de l'utilisateur. Donne un message général d'encouragement ou de contexte en lien avec sa demande, sans mentionner les résultats spécifiques qui seront affichés. Sois enthousiaste et personnalisé dans ta réponse, comme si tu parlais à un ami. Adapte ton ton selon le contexte (humoristique, sérieux, etc.). 

Ajoute également une phrase courte expliquant brièvement pourquoi tu as choisi ces recommandations (par exemple: "J'ai sélectionné des œuvres qui correspondent à ton style" ou "J'ai privilégié des films récents et bien notés" ou "J'ai choisi des classiques incontournables", etc.). 

Limite ta réponse à 3-4 phrases maximum.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text().trim();
  },

  async generateRecommendationsWithResponse(
    query: string,
    numberOfRecommendations: number,
    contentTypes: string[]
  ): Promise<{ recommendations: string[]; conversationalResponse: string }> {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contentTypeText = contentTypes.join(' et ');
    const prompt = `Tu es un assistant IA expert en cinéma et télévision. Un utilisateur te demande: "${query}".

IMPORTANT: Sois très précis dans tes recommandations. Si l'utilisateur mentionne un acteur, réalisateur ou personnalité spécifique, assure-toi que TOUS les ${contentTypeText} recommandés incluent réellement cette personne dans le casting ou l'équipe technique.

Règles strictes :
- Si un nom d'acteur est mentionné, recommande uniquement des œuvres où cet acteur joue réellement
- Si un réalisateur est mentionné, recommande uniquement ses œuvres
- Si un genre est mentionné, respecte strictement ce genre
- Si une époque est mentionnée, respecte cette période
- Privilégie les œuvres les plus connues et populaires
- Vérifie mentalement que chaque recommandation correspond exactement à la demande

Tu dois fournir deux choses dans ta réponse :

1. RECOMMANDATIONS: ${numberOfRecommendations} ${contentTypeText} qui correspondent EXACTEMENT à la demande. Liste uniquement les titres séparés par des virgules.

2. MESSAGE: Un message conversationnel et amical dans la même langue que la demande. Donne un message général d'encouragement ou de contexte en lien avec sa demande, sans mentionner les résultats spécifiques. Sois enthousiaste et personnalisé, comme si tu parlais à un ami. Limite à 2-3 phrases maximum.

Formate ta réponse exactement comme ceci :
RECOMMANDATIONS: [liste des titres séparés par des virgules]
MESSAGE: [ton message conversationnel]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse the response
    const recommendationsMatch = text.match(
      /RECOMMANDATIONS:\s*(.+?)(?=\nMESSAGE:|$)/s
    );
    const messageMatch = text.match(/MESSAGE:\s*(.+)$/s);

    const recommendations = recommendationsMatch
      ? recommendationsMatch[1].split(',').map(title => title.trim())
      : [];

    const conversationalResponse = messageMatch
      ? messageMatch[1].trim()
      : 'Voici mes recommandations pour vous !';

    return {
      recommendations,
      conversationalResponse,
    };
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

  async getWatchProviders(
    itemId: number,
    mediaType: string,
    countryCode: string = 'FR'
  ): Promise<any[]> {
    try {
      const providerResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}/watch/providers?api_key=${TMDB_API_KEY}`
      );

      return providerResponse.data.results?.[countryCode]?.flatrate || [];
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

  async getDetailedInfo(itemId: number, mediaType: string): Promise<any> {
    try {
      const detailsResponse = await axios.get(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}?api_key=${TMDB_API_KEY}&language=fr-FR`
      );

      const data = detailsResponse.data;

      if (mediaType === 'movie') {
        return {
          genres: data.genres || [],
          runtime: data.runtime || null,
          release_year: data.release_date
            ? new Date(data.release_date).getFullYear()
            : null,
        };
      } else if (mediaType === 'tv') {
        return {
          genres: data.genres || [],
          number_of_seasons: data.number_of_seasons || null,
          number_of_episodes: data.number_of_episodes || null,
          status: data.status || null,
          first_air_year: data.first_air_date
            ? new Date(data.first_air_date).getFullYear()
            : null,
        };
      }

      return {};
    } catch (error) {
      console.error(
        `Error fetching detailed info for ${mediaType} ${itemId}:`,
        error
      );
      return {};
    }
  },
};
