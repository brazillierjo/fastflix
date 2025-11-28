/**
 * AI Service - Google Gemini integration
 * Handles AI-powered movie recommendations with proper error handling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Constants from 'expo-constants';
import { ERROR_MESSAGES } from '@/constants/app';
import { APIResponse } from '@/types/api';

export interface AIRecommendationParams {
  query: string;
  language: string;
  includeMovies: boolean;
  includeTvShows: boolean;
  maxRecommendations?: number;
}

export interface AIRecommendationResult {
  recommendations: string[];
  explanation: string;
  confidence: number;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = Constants.expoConfig?.extra?.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error('Google AI API key not found in configuration');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google AI:', error);
    }
  }

  private createPrompt(params: AIRecommendationParams): string {
    const {
      query,
      language,
      includeMovies,
      includeTvShows,
      maxRecommendations = 5,
    } = params;

    const mediaTypes = [];
    if (includeMovies) mediaTypes.push('movies');
    if (includeTvShows) mediaTypes.push('TV shows');

    const mediaTypeText = mediaTypes.join(' and ');

    return `You are a movie and TV show recommendation expert. Based on the user's request: "${query}", please recommend exactly ${maxRecommendations} ${mediaTypeText} that match their preferences.

Instructions:
1. Analyze the user's request to understand their mood, genre preferences, and specific requirements
2. Provide ${maxRecommendations} specific title recommendations
3. Focus on well-known, popular titles that are likely to be available on streaming platforms
4. Consider the user's language preference (${language}) but include international content if appropriate
5. Provide a brief explanation for your choices

Format your response as a JSON object with this exact structure:
{
  "recommendations": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
  "explanation": "Brief explanation of why these titles were chosen based on the user's request",
  "confidence": 0.85
}

Important:
- Only return the JSON object, no additional text
- Use exact titles as they appear in TMDB/streaming services
- Confidence should be between 0.0 and 1.0
- Explanation should be 1-2 sentences maximum
- For TV shows, use the main series title without season information`;
  }

  async getMovieRecommendations(
    params: AIRecommendationParams
  ): Promise<APIResponse<AIRecommendationResult>> {
    try {
      if (!this.isInitialized || !this.genAI) {
        return {
          success: false,
          data: { recommendations: [], explanation: '', confidence: 0 },
          error: {
            code: 'AI_NOT_INITIALIZED',
            message: 'AI service is not properly initialized',
          },
        };
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      const prompt = this.createPrompt(params);

      console.log('AI Prompt:', prompt);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('AI Response:', text);

      // Parse the JSON response
      let parsedResponse: AIRecommendationResult;
      try {
        // Clean the response text (remove any markdown formatting)
        const cleanText = text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        parsedResponse = JSON.parse(cleanText);

        // Validate the response structure
        if (
          !parsedResponse.recommendations ||
          !Array.isArray(parsedResponse.recommendations)
        ) {
          throw new Error('Invalid recommendations format');
        }

        if (
          !parsedResponse.explanation ||
          typeof parsedResponse.explanation !== 'string'
        ) {
          throw new Error('Invalid explanation format');
        }

        if (typeof parsedResponse.confidence !== 'number') {
          parsedResponse.confidence = 0.8; // Default confidence
        }

        // Ensure confidence is within valid range
        parsedResponse.confidence = Math.max(
          0,
          Math.min(1, parsedResponse.confidence)
        );
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', text);

        // Fallback: try to extract recommendations manually
        const fallbackRecommendations =
          this.extractRecommendationsFromText(text);

        if (fallbackRecommendations.length > 0) {
          parsedResponse = {
            recommendations: fallbackRecommendations,
            explanation: 'AI provided recommendations based on your request.',
            confidence: 0.6,
          };
        } else {
          return {
            success: false,
            data: { recommendations: [], explanation: '', confidence: 0 },
            error: {
              code: 'AI_PARSE_ERROR',
              message: 'Failed to parse AI recommendations',
              details: {
                rawResponse: text,
                parseError: (parseError as Error).message,
              },
            },
          };
        }
      }

      return {
        success: true,
        data: parsedResponse,
      };
    } catch (error) {
      console.error('AI service error:', error);

      // Determine error type
      let errorCode = 'AI_ERROR';
      let errorMessage: string = ERROR_MESSAGES.API_ERROR;

      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          errorCode = 'AI_QUOTA_EXCEEDED';
          errorMessage = ERROR_MESSAGES.AI_QUOTA_EXCEEDED;
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          errorCode = 'AI_NETWORK_ERROR';
          errorMessage = ERROR_MESSAGES.AI_NETWORK_ERROR;
        } else {
          errorMessage = ERROR_MESSAGES.API_ERROR;
        }
      }

      return {
        success: false,
        data: { recommendations: [], explanation: '', confidence: 0 },
        error: {
          code: errorCode,
          message: errorMessage,
          details: { error: (error as Error).message },
        },
      };
    }
  }

  private extractRecommendationsFromText(text: string): string[] {
    const recommendations: string[] = [];

    // Try to find movie/TV show titles in the text
    const lines = text.split('\n');

    for (const line of lines) {
      // Look for patterns like "1. Title", "- Title", or quoted titles
      const patterns = [
        /^\d+\.\s*(.+)/, // "1. Title"
        /^-\s*(.+)/, // "- Title"
        /^•\s*(.+)/, // "• Title"
        /"([^"]+)"/g, // "Title"
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const title = match[1].trim();
          if (title.length > 2 && title.length < 100) {
            recommendations.push(title);
            break;
          }
        }
      }

      if (recommendations.length >= 5) break;
    }

    return recommendations.slice(0, 5);
  }

  // Test method for debugging
  async testConnection(): Promise<APIResponse<string>> {
    try {
      if (!this.isInitialized || !this.genAI) {
        return {
          success: false,
          data: '',
          error: {
            code: 'AI_NOT_INITIALIZED',
            message: 'AI service is not properly initialized',
          },
        };
      }

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      const result = await model.generateContent(
        'Say "Hello from FastFlix AI Service"'
      );
      const response = result.response;
      const text = response.text();

      return {
        success: true,
        data: text,
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        error: {
          code: 'AI_TEST_ERROR',
          message: 'AI service test failed',
          details: { error: (error as Error).message },
        },
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
