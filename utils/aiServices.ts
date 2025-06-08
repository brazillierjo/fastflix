/**
 * AI Services Module
 *
 * This file provides a centralized interface for all AI-powered functionality in the
 * "FastFlix" application. It abstracts the complexity of working with Google's Gemini AI
 * and provides a clean, consistent API for generating intelligent movie and TV show recommendations.
 *
 * The module leverages Google's Gemini 2.0 Flash model to:
 * 1. Generate contextual movie and TV show recommendations using natural language processing
 * 2. Process user queries in multiple languages (French, English)
 * 3. Provide conversational responses that feel natural and engaging
 * 4. Handle content type filtering (movies vs TV shows) based on user preferences
 * 5. Adapt recommendations based on conceptual queries vs specific requests
 *
 * Key features:
 * - Multi-language support with intelligent language detection
 * - Contextual understanding of user intent (conceptual vs specific searches)
 * - Conversational AI responses that enhance user experience
 * - Robust error handling and fallback mechanisms
 * - Optimized prompts for accurate and relevant recommendations
 *
 * The service is designed to be easily testable, maintainable, and extensible
 * for future AI model integrations or prompt optimizations.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;

export interface AIRecommendationResult {
  recommendations: string[];
  conversationalResponse: string;
}

export const aiService = {
  /**
   * Generates movie and TV show recommendations based on user query
   * @param query - User's search query
   * @param contentTypes - Array of content types to include (e.g., ['films', 'séries'])
   * @returns Promise<string[]> - Array of recommended titles
   */
  async generateRecommendations(
    query: string,
    contentTypes: string[]
  ): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contentTypeText = contentTypes.join(' et ');
    const prompt = `Tu es un assistant IA expert en cinéma et télévision avec une connaissance encyclopédique des films et séries du monde entier. Basé sur cette demande: "${query}", recommande-moi jusqu'à 25 ${contentTypeText}.

STRATÉGIE DE RECHERCHE CRÉATIVE:

Pour les requêtes conceptuelles (ex: "monstre japonais dans l'eau", "voitures qui se transforment", "robots géants") :
- PENSE AUX FRANCHISES ICONIQUES : Godzilla, Kaiju, mecha, Transformers, etc.
- INCLUS LES VARIATIONS : titres originaux, suites, remakes, adaptations
- EXPLORE LES SYNONYMES : "monstre marin" = Godzilla, Kaiju, créatures aquatiques
- CONSIDÈRE LES ORIGINES : films japonais, américains, coréens pour les monstres
- INCLUS LES CLASSIQUES ET MODERNES : des années 50 à aujourd'hui

Règles d'expansion créative :
- Si "monstre" → pense Godzilla, King Kong, Cloverfield, Pacific Rim, Rampage
- Si "eau/océan" → pense créatures marines, sous-marins, îles mystérieuses  
- Si "japonais" → pense kaiju, anime, J-horror, samurai, yakuza
- Si "robot" → pense mecha, IA, cyborgs, transformers, terminators
- COMBINE les concepts : "monstre japonais eau" = Godzilla ET ses variations

IMPORTANT : Sois TRÈS généreux dans tes recommandations. Mieux vaut inclure trop de résultats pertinents que pas assez. Inclus les franchises célèbres même si le titre exact n'est pas mentionné.

Réponds uniquement avec les titres qui correspondent à la demande, séparés par des virgules, sans numérotation ni explication supplémentaire.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response
      .text()
      .split(',')
      .map(title => title.trim());
  },

  /**
   * Generates a conversational response to user query
   * @param query - User's search query
   * @returns Promise<string> - Conversational response
   */
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

  /**
   * Generates both recommendations and conversational response in a single API call
   * This is more efficient than making separate calls for recommendations and response
   * @param query - User's search query
   * @param contentTypes - Array of content types to include
   * @returns Promise<AIRecommendationResult> - Object containing both recommendations and response
   */
  async generateRecommendationsWithResponse(
    query: string,
    contentTypes: string[]
  ): Promise<AIRecommendationResult> {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contentTypeText = contentTypes.join(' et ');
    const prompt = `Tu es un assistant IA expert en cinéma et télévision avec une connaissance encyclopédique des films et séries du monde entier. Un utilisateur te demande: "${query}".

STRATÉGIE DE RECHERCHE CRÉATIVE:

Pour les requêtes conceptuelles (ex: "monstre japonais dans l'eau", "voitures qui se transforment", "robots géants", "magie", "space opera") :
- PENSE AUX FRANCHISES ICONIQUES : Godzilla, Kaiju, mecha, Transformers, etc.
- INCLUS LES VARIATIONS : titres originaux, suites, remakes, adaptations
- EXPLORE LES SYNONYMES : "monstre marin" = Godzilla, Kaiju, créatures aquatiques
- CONSIDÈRE LES ORIGINES : films japonais, américains, coréens pour les monstres
- INCLUS LES CLASSIQUES ET MODERNES : des années 50 à aujourd'hui
- PENSE AUX SOUS-GENRES : horror, action, science-fiction, animation

Pour les requêtes géographiques/culturelles :
- "japonais" = inclus films de Toho, Studio Ghibli, anime, J-horror
- "coréen" = K-movies, thrillers, drames
- "français" = cinéma d'auteur, comédies, drames

Pour les requêtes spécifiques (acteur/réalisateur) :
- Recommande TOUTE leur filmographie pertinente
- Inclus collaborations fréquentes
- Considère différentes périodes de carrière

Règles d'expansion créative :
- Si "monstre" → pense Godzilla, King Kong, Cloverfield, Pacific Rim, Rampage
- Si "eau/océan" → pense créatures marines, sous-marins, îles mystérieuses
- Si "japonais" → pense kaiju, anime, J-horror, samurai, yakuza
- Si "robot" → pense mecha, IA, cyborgs, transformers, terminators
- COMBINE les concepts : "monstre japonais eau" = Godzilla ET ses variations

IMPORTANT : Sois TRÈS généreux dans tes recommandations. Mieux vaut inclure trop de résultats pertinents que pas assez. L'utilisateur pourra filtrer.

Tu dois fournir deux choses dans ta réponse :

1. RECOMMANDATIONS: Jusqu'à 25 ${contentTypeText} qui correspondent à la demande (sois généreux et créatif). Inclus les titres exacts, variations, franchises, et œuvres similaires. Liste uniquement les titres séparés par des virgules.

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

  /**
   * Analyzes user query to determine optimal content types
   * This helps in providing more relevant recommendations based on query context
   * @param query - User's search query
   * @param includeMovies - Whether movies are initially included
   * @param includeTvShows - Whether TV shows are initially included
   * @returns Object with optimized content type flags
   */
  analyzeQueryForContentTypes(
    query: string,
    includeMovies: boolean,
    includeTvShows: boolean
  ): { includeMovies: boolean; includeTvShows: boolean } {
    const queryLower = query.toLowerCase();

    // Check for specific mentions of movies or TV shows in the query
    const movieKeywords = ['film', 'movie', 'cinema', 'long métrage'];
    const tvKeywords = [
      'série',
      'series',
      'tv show',
      'saison',
      'season',
      'épisode',
      'episode',
    ];

    const hasMovieKeywords = movieKeywords.some(keyword =>
      queryLower.includes(keyword)
    );
    const hasTvKeywords = tvKeywords.some(keyword =>
      queryLower.includes(keyword)
    );

    // If user specifically mentions one type, prioritize that type
    if (hasMovieKeywords && !hasTvKeywords) {
      return { includeMovies: true, includeTvShows: false };
    } else if (hasTvKeywords && !hasMovieKeywords) {
      return { includeMovies: false, includeTvShows: true };
    }

    // If neither or both are mentioned, use original preferences
    return { includeMovies, includeTvShows };
  },
};
