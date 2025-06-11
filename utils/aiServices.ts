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
    const prompt = `You are an expert AI assistant specializing in cinema and television with encyclopedic knowledge of films and series from around the world. Based on this request: "${query}", recommend up to 25 ${contentTypeText}.

CREATIVE SEARCH STRATEGY:

For conceptual queries (e.g., "Japanese monster in water", "transforming cars", "giant robots"):
- THINK OF ICONIC FRANCHISES: Godzilla, Kaiju, mecha, Transformers, etc.
- INCLUDE VARIATIONS: original titles, sequels, remakes, adaptations
- EXPLORE SYNONYMS: "sea monster" = Godzilla, Kaiju, aquatic creatures
- CONSIDER ORIGINS: Japanese, American, Korean films for monsters
- INCLUDE CLASSICS AND MODERN: from the 1950s to today

Creative expansion rules:
- If "monster" → think Godzilla, King Kong, Cloverfield, Pacific Rim, Rampage
- If "water/ocean" → think marine creatures, submarines, mysterious islands
- If "Japanese" → think kaiju, anime, J-horror, samurai, yakuza
- If "robot" → think mecha, AI, cyborgs, transformers, terminators
- COMBINE concepts: "Japanese monster water" = Godzilla AND its variations

IMPORTANT: Be VERY generous in your recommendations. Better to include too many relevant results than too few. Include famous franchises even if the exact title isn't mentioned.

Respond only with titles that match the request, separated by commas, without numbering or additional explanation.`;

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

    const prompt = `You are an AI assistant specialized in movie and TV show recommendations. A user asks you: "${query}".

Respond conversationally and friendly, adapting your tone to match the user's style (humorous, serious, casual, etc.). Provide a general message of encouragement or context related to their request, without mentioning specific results that will be displayed. Be enthusiastic and personalized in your response, as if talking to a friend.

Also include a brief explanation of why you chose these recommendations (e.g., "I selected works that match your style", "I prioritized recent and well-rated films", "I chose unmissable classics", etc.).

Limit your response to 3-4 sentences maximum. Always respond in English regardless of the user's query language.`;

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

    const contentTypeText = contentTypes.join(' and ');
    const prompt = `You are an expert AI assistant specializing in cinema and television with encyclopedic knowledge of films and series from around the world. A user asks you: "${query}".

ADVANCED SEARCH STRATEGY:

For conceptual queries (e.g., "Japanese monster in water", "transforming cars", "giant robots", "magic", "space opera"):
- THINK OF ICONIC FRANCHISES: Godzilla, Kaiju, mecha, Transformers, Marvel, DC, etc.
- INCLUDE VARIATIONS: original titles, sequels, prequels, remakes, reboots, adaptations
- EXPLORE SYNONYMS: "sea monster" = Godzilla, Kaiju, aquatic creatures, Leviathan
- CONSIDER ORIGINS: Japanese, American, Korean, European productions
- SPAN DECADES: from classic 1950s to cutting-edge modern releases
- THINK CROSS-GENRE: horror, action, sci-fi, animation, thriller combinations

For geographical/cultural queries:
- "Japanese" = include Toho films, Studio Ghibli, anime, J-horror, samurai, yakuza
- "Korean" = K-movies, psychological thrillers, revenge dramas, romantic comedies
- "French" = auteur cinema, nouvelle vague, comedies, art house films
- "British" = period dramas, comedies, crime thrillers, social realism

For specific queries (actor/director):
- Recommend ENTIRE relevant filmography across career phases
- Include frequent collaborations and creative partnerships
- Consider different genres and time periods
- Add breakthrough roles and career-defining performances

Creative expansion algorithms:
- If "monster" → Godzilla, King Kong, Cloverfield, Pacific Rim, Rampage, The Host, Tremors
- If "water/ocean" → marine creatures, submarines, island mysteries, underwater adventures
- If "Japanese" → kaiju, anime, J-horror, samurai, yakuza, Studio Ghibli magic
- If "robot" → mecha, AI consciousness, cyborgs, transformers, terminators, androids
- SYNTHESIZE concepts: "Japanese monster water" = comprehensive Godzilla universe + similar kaiju

CRITICAL: Be EXCEPTIONALLY generous and creative in recommendations. Cast a wide net - better to include comprehensive relevant results than miss hidden gems. Include cult classics, international variants, and thematic connections.

Provide two distinct outputs:

1. RECOMMENDATIONS: Up to 25 ${contentTypeText} matching the request (be generous and inventive). Include exact titles, franchise variations, spiritual successors, and thematically similar works. List only titles separated by commas.

2. MESSAGE: A conversational, engaging message that adapts to the user's tone and style. Provide encouragement and context about their request without mentioning specific results. Be enthusiastic and personalized, matching their energy level (humorous, serious, casual, etc.). Include a brief insight about your selection strategy. Always respond in English. Limit to 3-4 sentences maximum.

Format your response exactly like this:
RECOMMENDATIONS: [comma-separated list of titles]
MESSAGE: [your conversational message]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parse the response
    const recommendationsMatch = text.match(
      /RECOMMENDATIONS:\s*(.+?)(?=\nMESSAGE:|$)/s
    );
    const messageMatch = text.match(/MESSAGE:\s*(.+)$/s);

    const recommendations = recommendationsMatch
      ? recommendationsMatch[1].split(',').map(title => title.trim())
      : [];

    const conversationalResponse = messageMatch
      ? messageMatch[1].trim()
      : 'Here are my recommendations for you!';

    return {
      recommendations,
      conversationalResponse,
    };
  },

  /**
   * Analyzes user query to detect streaming platform mentions
   * @param query - User's search query
   * @returns Object with detected streaming platform or null if none found
   */
  detectStreamingPlatform(query: string): {
    platform: string | null;
    platformId: number | null;
  } {
    const queryLower = query.toLowerCase();

    // Map of streaming platforms with their TMDB provider IDs
    const streamingPlatforms = {
      netflix: { id: 8, names: ['netflix'] },
      'amazon prime': {
        id: 119,
        names: ['amazon prime', 'prime video', 'amazon'],
      },
      'disney+': { id: 337, names: ['disney+', 'disney plus', 'disney'] },
      hulu: { id: 15, names: ['hulu'] },
      'hbo max': { id: 384, names: ['hbo max', 'hbo', 'max'] },
      'apple tv+': { id: 350, names: ['apple tv+', 'apple tv', 'apple'] },
      'paramount+': {
        id: 531,
        names: ['paramount+', 'paramount plus', 'paramount'],
      },
      peacock: { id: 387, names: ['peacock'] },
      crunchyroll: { id: 283, names: ['crunchyroll'] },
      'canal+': { id: 381, names: ['canal+', 'canal plus', 'canal'] },
      ocs: { id: 56, names: ['ocs'] },
      salto: { id: 564, names: ['salto'] },
      'france tv': {
        id: 190,
        names: ['france tv', 'france télévisions', 'francetv'],
      },
      youtube: { id: 188, names: ['youtube'] },
    };

    // Check for platform mentions in the query
    for (const [platformName, platformData] of Object.entries(
      streamingPlatforms
    )) {
      for (const name of platformData.names) {
        if (queryLower.includes(name)) {
          return { platform: platformName, platformId: platformData.id };
        }
      }
    }

    return { platform: null, platformId: null };
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
