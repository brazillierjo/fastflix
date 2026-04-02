/**
 * FastFlix Backend - Google AI Service
 * Handles AI-powered movie recommendations using Gemini
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as Sentry from "@sentry/node";
import type { AIRecommendationResult, UserContext, ConversationMessage } from "./types";

/**
 * Sanitize user input to prevent prompt injection attacks
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/^(system|assistant|user):/gi, "")
    .replace(/ignore (previous|all|above) instructions/gi, "")
    .replace(/\{[\s\S]*?\}/g, "") // Remove JSON-like injections
    .trim()
    .slice(0, 1000); // Max 1000 chars
}

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
      throw new Error("Missing Google AI API key in environment variables");
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
    language: string = "fr-FR",
    filters?: {
      yearFrom?: number;
      yearTo?: number;
    },
    maxRecommendations: number = 25,
    userContext?: UserContext,
    conversationHistory?: ConversationMessage[],
    recentTitles?: { title: string; mediaType: string }[]
  ): Promise<AIRecommendationResult> {
    const genAI = this.getClient();
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const model = genAI.getGenerativeModel({ model: modelName });

    // Sanitize user query to prevent prompt injection
    const sanitizedQuery = sanitizeInput(query);

    Sentry.addBreadcrumb({
      category: "gemini",
      message: "Starting AI recommendation generation",
      level: "info",
      data: { queryLength: sanitizedQuery.length, model: modelName, maxRecommendations },
    });

    const geminiStartTime = Date.now();

    // Map language codes to full language names for clearer instructions
    const languageMap: { [key: string]: string } = {
      fr: "French",
      "fr-FR": "French",
      en: "English",
      "en-US": "English",
      it: "Italian",
      "it-IT": "Italian",
      ja: "Japanese",
      "ja-JP": "Japanese",
      es: "Spanish",
      "es-ES": "Spanish",
      de: "German",
      "de-DE": "German",
    };
    const languageName = languageMap[language] || "English";

    const contentTypeText = contentTypes.join(" and ");
    const currentYear = new Date().getFullYear();

    // Build year constraint text if filters are provided
    let yearConstraint = "";
    if (filters?.yearFrom && filters?.yearTo) {
      yearConstraint = `\n\nYEAR CONSTRAINT: Only include ${contentTypeText} released between ${filters.yearFrom} and ${filters.yearTo}. This is a STRICT requirement - do not include anything outside this range.`;
    } else if (filters?.yearFrom) {
      yearConstraint = `\n\nYEAR CONSTRAINT: Only include ${contentTypeText} released from ${filters.yearFrom} onwards. This is a STRICT requirement - do not include anything released before ${filters.yearFrom}.`;
    } else if (filters?.yearTo) {
      yearConstraint = `\n\nYEAR CONSTRAINT: Only include ${contentTypeText} released up to ${filters.yearTo}. This is a STRICT requirement - do not include anything released after ${filters.yearTo}.`;
    }

    // Build temporal vocabulary section
    const temporalVocabulary = `
TEMPORAL AWARENESS (CRITICAL - Today is ${new Date().toISOString().split("T")[0]}, current year is ${currentYear}):
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

    // Build user profile section for personalization
    let userProfileSection = "";
    if (userContext) {
      const profileLines: string[] = [];

      if (userContext.favoriteGenres && userContext.favoriteGenres.length > 0) {
        profileLines.push(`- Favorite genres: [${userContext.favoriteGenres.join(", ")}]`);
      }
      if (userContext.dislikedGenres && userContext.dislikedGenres.length > 0) {
        profileLines.push(`- Genres to avoid: [${userContext.dislikedGenres.join(", ")}]`);
      }
      if (userContext.favoriteDecades && userContext.favoriteDecades.length > 0) {
        profileLines.push(`- Preferred decades: [${userContext.favoriteDecades.join(", ")}]`);
      }

      const highlyRated = userContext.ratedMovies?.filter((m) => m.rating >= 4);
      const neutralRated = userContext.ratedMovies?.filter((m) => m.rating === 3);
      const dislikedMovies = userContext.ratedMovies?.filter((m) => m.rating >= 1 && m.rating <= 2);
      const _watchedNoRating = userContext.ratedMovies?.filter((m) => m.rating === 0);

      if (highlyRated && highlyRated.length > 0) {
        profileLines.push(
          `- LOVED (rated 4-5 stars): [${highlyRated.map((m) => m.title).join(", ")}]`
        );
      }
      if (neutralRated && neutralRated.length > 0) {
        profileLines.push(
          `- Found OK but not great (rated 3 stars): [${neutralRated.map((m) => m.title).join(", ")}]`
        );
      }
      if (dislikedMovies && dislikedMovies.length > 0) {
        profileLines.push(
          `- DISLIKED (rated 1-2 stars): [${dislikedMovies.map((m) => m.title).join(", ")}]`
        );
      }
      // All watched titles (any rating) to avoid re-recommending
      const allWatched = userContext.ratedMovies?.filter((m) => m.title);
      if (allWatched && allWatched.length > 0) {
        profileLines.push(
          `- Already watched (DO NOT recommend these): [${allWatched.map((m) => m.title).join(", ")}]`
        );
      }
      if (userContext.recentSearches && userContext.recentSearches.length > 0) {
        profileLines.push(
          `- Recent searches: [${userContext.recentSearches.map((s) => `"${s}"`).join(", ")}]`
        );
      }

      if (profileLines.length > 0) {
        userProfileSection = `

USER PROFILE (use to personalize recommendations):
${profileLines.join("\n")}

Use this profile to:
1. PRIORITIZE recommendations matching favorite genres and decades
2. STRICTLY AVOID genres the user dislikes (unless specifically requested)
3. Find movies SIMILAR to ones they LOVED (4-5 stars) — same directors, themes, style
4. NEVER recommend movies similar to ones they DISLIKED (1-2 stars) — avoid similar genres/directors/themes
5. Movies rated 3 stars indicate lukewarm interest — don't prioritize that style
6. NEVER recommend any title from the "Already watched" list
7. DIVERSIFY beyond recent searches to help discovery
`;
      }
    }

    // Build conversation history section for multi-turn refinement
    let conversationSection = "";
    if (conversationHistory && conversationHistory.length > 0) {
      const historyLines = conversationHistory.map((msg) => {
        const roleLabel = msg.role === "user" ? "User" : "Assistant";
        // Sanitize conversation history to prevent prompt injection
        const sanitizedContent = msg.role === "user" ? sanitizeInput(msg.content) : msg.content;
        return `${roleLabel}: ${sanitizedContent}`;
      });
      conversationSection = `

CONVERSATION HISTORY (the user is refining their search - use this context to understand what they want):
${historyLines.join("\n")}

The user's latest message is a REFINEMENT of the above conversation. Take into account what was previously discussed and recommended. If the user asks to exclude something, narrow down, or change direction, adapt your recommendations accordingly.`;
    }

    // Build recent titles awareness section
    let recentTitlesSection = "";
    if (recentTitles && recentTitles.length > 0) {
      const movieTitles = recentTitles.filter((t) => t.mediaType === "movie").map((t) => t.title);
      const tvTitles = recentTitles.filter((t) => t.mediaType === "tv").map((t) => t.title);
      const lines: string[] = [];
      if (movieTitles.length > 0) lines.push(`Recent/trending movies: ${movieTitles.join(", ")}`);
      if (tvTitles.length > 0) lines.push(`Recent/trending TV shows: ${tvTitles.join(", ")}`);
      recentTitlesSection = `

RECENT RELEASES AWARENESS (these are currently popular/new titles — your training data may not include them):
${lines.join("\n")}

Use these ONLY when relevant to the user's query. Do NOT blindly recommend trending titles — only include them if they genuinely match what the user is asking for. Your own knowledge remains your primary source. These titles supplement your knowledge for recent content you might not know about.`;
    }

    const prompt = `You are an expert AI assistant specializing in cinema and television with encyclopedic knowledge of films and series from around the world. A user asks you: "${sanitizedQuery}".${userProfileSection}${conversationSection}${temporalVocabulary}${yearConstraint}${recentTitlesSection}

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

Provide four distinct outputs:

1. RECOMMENDATIONS: Up to ${maxRecommendations} ${contentTypeText} matching the request (be generous and inventive). Include exact titles, franchise variations, spiritual successors, and thematically similar works. List only titles separated by commas.

2. REASONS: For each recommendation (in the SAME order), provide a short personalized reason (max 15 words) explaining why this user would love it, based on their profile. Reference specific movies they liked, genres they prefer, or themes that connect. Separate each reason with " ||| ". If no user profile is available, give a generic but engaging reason for each title.

3. DETECTED_PLATFORMS: Extract any specific streaming platforms mentioned in the user's request (e.g., "Netflix", "Disney+", "Amazon Prime", "HBO", "Hulu", "Apple TV"). If no specific platform is mentioned, leave this empty. List only platform names separated by commas.

4. MESSAGE: A conversational, engaging message that adapts to the user's tone and style. Provide encouragement and context about their request without mentioning specific results. Be enthusiastic and personalized, matching their energy level (humorous, serious, casual, etc.). Include a brief insight about your selection strategy.
CRITICAL LANGUAGE INSTRUCTION: You MUST respond in ${languageName} language ONLY for MESSAGE and REASONS. This is the user's application interface language. Do NOT auto-detect the language from the query. Even if the user writes in English, French, or any other language, you MUST respond in ${languageName}. This is mandatory for a consistent user experience.
Limit MESSAGE to 3-4 sentences maximum.

Format your response exactly like this:
RECOMMENDATIONS: [comma-separated list of titles]
REASONS: [reason1 ||| reason2 ||| reason3 ||| ...]
DETECTED_PLATFORMS: [comma-separated list of platforms]
MESSAGE: [your conversational message]`;

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout after 30s")), 30000)
      );
      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const response = await result.response;
      const text = response.text().trim();

      // Parse the response
      const recommendationsMatch = text.match(
        /RECOMMENDATIONS:\s*([\s\S]+?)(?=\nREASONS:|\nDETECTED_PLATFORMS:|\nMESSAGE:|$)/
      );
      const reasonsMatch = text.match(
        /REASONS:\s*([\s\S]+?)(?=\nDETECTED_PLATFORMS:|\nMESSAGE:|$)/
      );
      const platformsMatch = text.match(/DETECTED_PLATFORMS:\s*([^\n]*)/); // Capture only until end of line
      const messageMatch = text.match(/MESSAGE:\s*([\s\S]+)$/);

      const recommendations = recommendationsMatch
        ? recommendationsMatch[1]
            .split(",")
            .map((title) => title.trim())
            .filter((title) => title.length > 0 && title.length < 200)
        : [];

      const reasons = reasonsMatch
        ? reasonsMatch[1]
            .split("|||")
            .map((reason) => reason.trim())
            .filter((reason) => reason.length > 0)
        : [];

      // List of known streaming platforms to validate against
      const knownPlatforms = [
        "netflix",
        "disney",
        "disneyplus",
        "disney+",
        "amazon",
        "prime",
        "primevideo",
        "hbo",
        "hbomax",
        "apple",
        "appletv",
        "hulu",
        "paramount",
        "peacock",
        "showtime",
        "starz",
        "crave",
        "crunchyroll",
        "funimation",
      ];

      const detectedPlatforms =
        platformsMatch && platformsMatch[1]
          ? platformsMatch[1]
              .split(",")
              .map((platform) => platform.trim())
              .filter((platform) => {
                // Ignore empty strings and 'none'
                if (platform.length === 0 || platform.toLowerCase() === "none") {
                  return false;
                }
                // Validate that this looks like a platform name (not a sentence)
                // A platform name should be short (< 30 chars) and not contain ':' or '.'
                if (platform.length > 30 || platform.includes(":") || platform.includes(".")) {
                  return false;
                }
                // Check if it matches a known platform
                const normalized = platform.toLowerCase().replace(/\s+/g, "");
                const isKnown = knownPlatforms.some(
                  (known) => normalized.includes(known) || known.includes(normalized)
                );
                return isKnown;
              })
          : [];

      const conversationalResponse = messageMatch
        ? messageMatch[1].trim()
        : "Here are my recommendations for you!";

      const geminiDuration = Date.now() - geminiStartTime;
      Sentry.addBreadcrumb({
        category: "gemini",
        message: `AI generation completed in ${geminiDuration}ms`,
        level: "info",
        data: { durationMs: geminiDuration, recommendationCount: recommendations.length },
      });

      return {
        recommendations,
        reasons,
        conversationalResponse,
        detectedPlatforms,
      };
    } catch (error) {
      const geminiDuration = Date.now() - geminiStartTime;
      console.error("⚠️ AI recommendation generation failed, returning fallback:", error);
      Sentry.addBreadcrumb({
        category: "gemini",
        message: "AI generation failed, returning fallback",
        level: "error",
        data: {
          durationMs: geminiDuration,
          error: error instanceof Error ? error.message : "Unknown",
        },
      });
      return {
        recommendations: [],
        reasons: [],
        conversationalResponse: "Our AI is temporarily unavailable. Please try again in a moment.",
        detectedPlatforms: [],
        isFallback: true,
      };
    }
  }
}

// Export singleton instance
export const gemini = new GeminiService();
