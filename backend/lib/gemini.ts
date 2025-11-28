/**
 * FastFlix Backend - Google AI Service
 * Handles AI-powered movie recommendations using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIRecommendationResult } from './types';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private isInitialized = false;

  /**
   * Initialize the Gemini client (singleton)
   */
  private initialize(): void {
    if (this.isInitialized && this.genAI) {
      return;
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Missing Google AI API key in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.isInitialized = true;
    console.log('✅ Gemini client initialized');
  }

  /**
   * Get the Gemini client instance
   */
  private getClient(): GoogleGenerativeAI {
    if (!this.genAI || !this.isInitialized) {
      this.initialize();
    }
    return this.genAI!;
  }

  /**
   * Generate movie/TV show recommendations based on user query
   * Returns only titles (will be enriched with TMDB later)
   */
  async generateRecommendations(
    query: string,
    contentTypes: string[]
  ): Promise<string[]> {
    const genAI = this.getClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const contentTypeText = contentTypes.join(' and ');
    const prompt = `You are an expert AI assistant specializing in cinema and television with encyclopedic knowledge of films and series from around the world. Based on this request: "${query}", recommend up to 25 ${contentTypeText}.

CREATIVE SEARCH STRATEGY:

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

Respond only with titles that match the request, separated by commas, without numbering or additional explanation.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse comma-separated titles
      const titles = text
        .split(',')
        .map(title => title.trim())
        .filter(title => title.length > 0 && title.length < 200); // Sanity check

      console.log(`🎬 Gemini generated ${titles.length} recommendations`);

      return titles;
    } catch (error) {
      console.error('❌ Gemini error in generateRecommendations:', error);
      throw new Error('Failed to generate recommendations from AI');
    }
  }

  /**
   * Generate a conversational response to user query
   */
  async generateConversationalResponse(query: string): Promise<string> {
    const genAI = this.getClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an AI assistant specialized in movie and TV show recommendations. A user asks you: "${query}".

Respond conversationally and friendly, adapting your tone to match the user's style (humorous, serious, casual, etc.). Provide a general message of encouragement or context related to their request, without mentioning specific results that will be displayed. Be enthusiastic and personalized in your response, as if talking to a friend.

Also include a brief explanation of why you chose these recommendations (e.g., "I selected works that match your style", "I prioritized recent and well-rated films", "I chose unmissable classics", etc.).

IMPORTANT: Automatically detect the language used in the user's query and respond in that same language. If the user wrote in French, respond in French. If they wrote in German, respond in German. If they wrote in Japanese, respond in Japanese. Match their language exactly.

Limit your response to 3-4 sentences maximum.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      console.log(`💬 Gemini generated conversational response`);

      return text;
    } catch (error) {
      console.error('❌ Gemini error in generateConversationalResponse:', error);
      throw new Error('Failed to generate conversational response from AI');
    }
  }

  /**
   * Generate both recommendations and conversational response in a single call
   * More efficient than making separate calls
   */
  async generateRecommendationsWithResponse(
    query: string,
    contentTypes: string[]
  ): Promise<AIRecommendationResult> {
    const genAI = this.getClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

2. MESSAGE: A conversational, engaging message that adapts to the user's tone and style. Provide encouragement and context about their request without mentioning specific results. Be enthusiastic and personalized, matching their energy level (humorous, serious, casual, etc.). Include a brief insight about your selection strategy. IMPORTANT: Automatically detect the language used in the user's query and respond in that same language. If the user wrote in French, respond in French. If they wrote in German, respond in German. If they wrote in Japanese, respond in Japanese. Match their language exactly. Limit to 3-4 sentences maximum.

Format your response exactly like this:
RECOMMENDATIONS: [comma-separated list of titles]
MESSAGE: [your conversational message]`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Parse the response
      const recommendationsMatch = text.match(
        /RECOMMENDATIONS:\s*(.+?)(?=\nMESSAGE:|$)/s
      );
      const messageMatch = text.match(/MESSAGE:\s*(.+)$/s);

      const recommendations = recommendationsMatch
        ? recommendationsMatch[1]
            .split(',')
            .map(title => title.trim())
            .filter(title => title.length > 0 && title.length < 200)
        : [];

      const conversationalResponse = messageMatch
        ? messageMatch[1].trim()
        : 'Here are my recommendations for you!';

      console.log(
        `🎬 Gemini generated ${recommendations.length} recommendations + conversational response`
      );

      return {
        recommendations,
        conversationalResponse,
      };
    } catch (error) {
      console.error('❌ Gemini error in generateRecommendationsWithResponse:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }
}

// Export singleton instance
export const gemini = new GeminiService();
