/**
 * Tests for Gemini Service
 * Tests AI recommendation generation with mocked Google Generative AI
 */

// Mock the @google/generative-ai module before importing
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

import { GoogleGenerativeAI } from '@google/generative-ai';
import { gemini } from '../lib/gemini';

// Reset module state between tests
beforeEach(() => {
  jest.clearAllMocks();
  // Reset the singleton state by clearing its internal state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gemini as any).isInitialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gemini as any).genAI = null;
});

describe('Gemini Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GOOGLE_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-2.0-flash';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should throw error when API key is missing', async () => {
      delete process.env.GOOGLE_API_KEY;

      await expect(
        gemini.generateRecommendationsWithResponse('test query', ['movies'])
      ).rejects.toThrow('Missing Google AI API key');
    });

    it('should initialize with valid API key', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 1, Movie 2
DETECTED_PLATFORMS:
MESSAGE: Here are some great movies!`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test query', ['movies']);

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
      expect(result).toBeDefined();
    });
  });

  describe('generateRecommendationsWithResponse', () => {
    it('should parse recommendations correctly', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: The Matrix, Inception, Interstellar
DETECTED_PLATFORMS:
MESSAGE: Voici d'excellents films de science-fiction!`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse(
        'science fiction movies',
        ['movies'],
        'fr-FR'
      );

      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations).toContain('The Matrix');
      expect(result.recommendations).toContain('Inception');
      expect(result.recommendations).toContain('Interstellar');
      expect(result.conversationalResponse).toBe("Voici d'excellents films de science-fiction!");
    });

    it('should detect valid streaming platforms', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Stranger Things, The Witcher
DETECTED_PLATFORMS: Netflix, Disney+
MESSAGE: Great shows available on streaming!`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('Netflix shows', [
        'tv shows',
      ]);

      expect(result.detectedPlatforms).toContain('Netflix');
      expect(result.detectedPlatforms).toContain('Disney+');
    });

    it('should filter out invalid platform names', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Test Movie
DETECTED_PLATFORMS: Netflix, Some Invalid Platform That Is Way Too Long
MESSAGE: Test message`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test', ['movies']);

      expect(result.detectedPlatforms).toContain('Netflix');
      expect(result.detectedPlatforms).not.toContain('Some Invalid Platform That Is Way Too Long');
    });

    it('should filter out unknown platforms', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Test Movie
DETECTED_PLATFORMS: Netflix, UnknownPlatform
MESSAGE: Test message`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test', ['movies']);

      expect(result.detectedPlatforms).toContain('Netflix');
      expect(result.detectedPlatforms).not.toContain('UnknownPlatform');
    });

    it('should filter recommendations with invalid length', async () => {
      const longTitle = 'A'.repeat(250);
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Valid Movie, ${longTitle}, Another Valid
DETECTED_PLATFORMS:
MESSAGE: Test message`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test', ['movies']);

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations).toContain('Valid Movie');
      expect(result.recommendations).toContain('Another Valid');
    });

    it('should handle year filters in prompt', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 2020, Movie 2021
DETECTED_PLATFORMS:
MESSAGE: Recent movies!`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      await gemini.generateRecommendationsWithResponse('recent movies', ['movies'], 'en-US', {
        yearFrom: 2020,
        yearTo: 2023,
      });

      // Check that the prompt includes year constraints
      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('2020');
      expect(callArgs).toContain('2023');
      expect(callArgs).toContain('YEAR CONSTRAINT');
    });

    it('should handle year filter with only yearFrom', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 1
DETECTED_PLATFORMS:
MESSAGE: Test`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      await gemini.generateRecommendationsWithResponse('movies', ['movies'], 'en-US', {
        yearFrom: 2020,
      });

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('from 2020 onwards');
    });

    it('should handle year filter with only yearTo', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 1
DETECTED_PLATFORMS:
MESSAGE: Test`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      await gemini.generateRecommendationsWithResponse('movies', ['movies'], 'en-US', {
        yearTo: 1999,
      });

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('up to 1999');
    });

    it('should use correct language for response', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Test
DETECTED_PLATFORMS:
MESSAGE: Test`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      await gemini.generateRecommendationsWithResponse('test', ['movies'], 'it-IT');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('Italian');
    });

    it('should handle API errors gracefully', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('API Error'));
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      await expect(gemini.generateRecommendationsWithResponse('test', ['movies'])).rejects.toThrow(
        'Failed to generate AI recommendations'
      );
    });

    it('should provide default message when MESSAGE section is missing', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 1, Movie 2
DETECTED_PLATFORMS: `,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test', ['movies']);

      expect(result.conversationalResponse).toBe('Here are my recommendations for you!');
    });

    it('should handle response with no valid recommendations', async () => {
      // Response where all recommendations are invalid (too short or empty)
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: , , ,
DETECTED_PLATFORMS: Netflix
MESSAGE: Sorry, I couldn't find specific matches.`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test', ['movies']);

      // Empty commas should be filtered out, leaving 0 valid recommendations
      expect(result.recommendations).toHaveLength(0);
      expect(result.conversationalResponse).toBe("Sorry, I couldn't find specific matches.");
    });

    it('should ignore "none" in detected platforms', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 1
DETECTED_PLATFORMS: none
MESSAGE: Test`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      const result = await gemini.generateRecommendationsWithResponse('test', ['movies']);

      expect(result.detectedPlatforms).toHaveLength(0);
    });

    it('should include temporal vocabulary in prompt', async () => {
      const mockResponse = {
        response: {
          text: () => `RECOMMENDATIONS: Movie 1
DETECTED_PLATFORMS:
MESSAGE: Test`,
        },
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      }));

      await gemini.generateRecommendationsWithResponse('modern comedy', ['movies']);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs).toContain('TEMPORAL AWARENESS');
      expect(callArgs).toContain('modern');
      expect(callArgs).toContain('contemporary');
    });
  });
});
