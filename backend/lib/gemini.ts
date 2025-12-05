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
   * Generate both recommendations and conversational response in a single call
   * More efficient than making separate calls
   */
  async generateRecommendationsWithResponse(
    query: string,
    contentTypes: string[],
    language: string = 'fr-FR',
    filters?: {
      yearFrom?: number;
      yearTo?: number;
    }
  ): Promise<AIRecommendationResult> {
    const genAI = this.getClient();
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Map language codes to full language names for clearer instructions
    const languageMap: { [key: string]: string } = {
      fr: 'French',
      'fr-FR': 'French',
      en: 'English',
      'en-US': 'English',
      it: 'Italian',
      'it-IT': 'Italian',
      ja: 'Japanese',
      'ja-JP': 'Japanese',
      es: 'Spanish',
      'es-ES': 'Spanish',
      de: 'German',
      'de-DE': 'German',
    };
    const languageName = languageMap[language] || 'English';

    const contentTypeText = contentTypes.join(' and ');
    const currentYear = new Date().getFullYear();

    // Build year constraint text if filters are provided
    let yearConstraint = '';
    if (filters?.yearFrom && filters?.yearTo) {
      yearConstraint = `\n\nYEAR CONSTRAINT: Only include ${contentTypeText} released between ${filters.yearFrom} and ${filters.yearTo}. This is a STRICT requirement - do not include anything outside this range.`;
    } else if (filters?.yearFrom) {
      yearConstraint = `\n\nYEAR CONSTRAINT: Only include ${contentTypeText} released from ${filters.yearFrom} onwards. This is a STRICT requirement - do not include anything released before ${filters.yearFrom}.`;
    } else if (filters?.yearTo) {
      yearConstraint = `\n\nYEAR CONSTRAINT: Only include ${contentTypeText} released up to ${filters.yearTo}. This is a STRICT requirement - do not include anything released after ${filters.yearTo}.`;
    }

    // Build temporal vocabulary section
    const temporalVocabulary = `
TEMPORAL AWARENESS (CRITICAL - Today is ${new Date().toISOString().split('T')[0]}, current year is ${currentYear}):
When the user uses temporal terms, interpret them STRICTLY as follows:
- "modern", "moderne", "recent", "récent", "new", "nouveau", "latest", "dernier" → ONLY films from ${currentYear - 5} to ${currentYear} (last 5 years)
- "contemporary", "contemporain", "current" → films from ${currentYear - 10} to ${currentYear}
- "2020s" → 2020-${currentYear}
- "2010s" → 2010-2019
- "2000s" → 2000-2009
- "90s", "années 90", "90er" → 1990-1999
- "80s", "années 80", "80er" → 1980-1989
- "70s", "années 70" → 1970-1979
- "classic", "classique", "old", "vieux", "ancien" → before 2000
- "vintage", "retro" → 1950-1989

If the user says "comédie romantique moderne" or "modern romantic comedy", you MUST ONLY suggest films released between ${currentYear - 5} and ${currentYear}. DO NOT suggest films from the 80s, 90s, or 2000s for "modern" queries.`;

    const prompt = `You are an expert AI assistant specializing in cinema and television with encyclopedic knowledge of films and series from around the world. A user asks you: "${query}".${temporalVocabulary}${yearConstraint}

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

Provide three distinct outputs:

1. RECOMMENDATIONS: Up to 25 ${contentTypeText} matching the request (be generous and inventive). Include exact titles, franchise variations, spiritual successors, and thematically similar works. List only titles separated by commas.

2. DETECTED_PLATFORMS: Extract any specific streaming platforms mentioned in the user's request (e.g., "Netflix", "Disney+", "Amazon Prime", "HBO", "Hulu", "Apple TV"). If no specific platform is mentioned, leave this empty. List only platform names separated by commas.

3. MESSAGE: A conversational, engaging message that adapts to the user's tone and style. Provide encouragement and context about their request without mentioning specific results. Be enthusiastic and personalized, matching their energy level (humorous, serious, casual, etc.). Include a brief insight about your selection strategy.
CRITICAL LANGUAGE INSTRUCTION: You MUST respond in ${languageName} language ONLY. This is the user's application interface language. Do NOT auto-detect the language from the query. Even if the user writes in English, French, or any other language, you MUST respond in ${languageName}. This is mandatory for a consistent user experience.
Limit to 3-4 sentences maximum.

Format your response exactly like this:
RECOMMENDATIONS: [comma-separated list of titles]
DETECTED_PLATFORMS: [comma-separated list of platforms]
MESSAGE: [your conversational message]`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Parse the response
      const recommendationsMatch = text.match(
        /RECOMMENDATIONS:\s*([\s\S]+?)(?=\nDETECTED_PLATFORMS:|\nMESSAGE:|$)/
      );
      const platformsMatch = text.match(/DETECTED_PLATFORMS:\s*([^\n]*)/); // Capture only until end of line
      const messageMatch = text.match(/MESSAGE:\s*([\s\S]+)$/);

      const recommendations = recommendationsMatch
        ? recommendationsMatch[1]
            .split(',')
            .map((title) => title.trim())
            .filter((title) => title.length > 0 && title.length < 200)
        : [];

      // List of known streaming platforms to validate against
      const knownPlatforms = [
        'netflix',
        'disney',
        'disneyplus',
        'disney+',
        'amazon',
        'prime',
        'primevideo',
        'hbo',
        'hbomax',
        'apple',
        'appletv',
        'hulu',
        'paramount',
        'peacock',
        'showtime',
        'starz',
        'crave',
        'crunchyroll',
        'funimation',
      ];

      const detectedPlatforms =
        platformsMatch && platformsMatch[1]
          ? platformsMatch[1]
              .split(',')
              .map((platform) => platform.trim())
              .filter((platform) => {
                // Ignore empty strings and 'none'
                if (platform.length === 0 || platform.toLowerCase() === 'none') {
                  return false;
                }
                // Validate that this looks like a platform name (not a sentence)
                // A platform name should be short (< 30 chars) and not contain ':' or '.'
                if (platform.length > 30 || platform.includes(':') || platform.includes('.')) {
                  return false;
                }
                // Check if it matches a known platform
                const normalized = platform.toLowerCase().replace(/\s+/g, '');
                const isKnown = knownPlatforms.some(
                  (known) => normalized.includes(known) || known.includes(normalized)
                );
                return isKnown;
              })
          : [];

      const conversationalResponse = messageMatch
        ? messageMatch[1].trim()
        : 'Here are my recommendations for you!';

      return {
        recommendations,
        conversationalResponse,
        detectedPlatforms,
      };
    } catch {
      throw new Error('Failed to generate AI recommendations');
    }
  }
}

// Export singleton instance
export const gemini = new GeminiService();
