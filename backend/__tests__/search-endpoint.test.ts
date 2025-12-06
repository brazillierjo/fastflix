/**
 * Tests for Search Endpoint
 * Tests the main search functionality with mocked dependencies
 */

// Mock dependencies
jest.mock('../lib/gemini', () => ({
  gemini: {
    generateRecommendationsWithResponse: jest.fn(),
  },
}));

jest.mock('../lib/tmdb', () => ({
  tmdb: {
    enrichRecommendations: jest.fn(),
    getBatchWatchProviders: jest.fn(),
    getBatchDetailsAndCredits: jest.fn(),
  },
}));

jest.mock('../lib/db', () => ({
  db: {
    hasAccess: jest.fn(),
  },
}));

jest.mock('../lib/middleware', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('../lib/api-helpers', () => ({
  applyRateLimit: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../app/api/search/route';
import { gemini } from '../lib/gemini';
import { tmdb } from '../lib/tmdb';
import { db } from '../lib/db';
import { requireAuth } from '../lib/middleware';
import { applyRateLimit } from '../lib/api-helpers';

// Helper to create mock request
function createMockRequest(body: object): NextRequest {
  return {
    json: () => Promise.resolve(body),
    headers: new Map([['authorization', 'Bearer test-token']]),
  } as unknown as NextRequest;
}

describe('Search Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (requireAuth as jest.Mock).mockResolvedValue({
      success: true,
      userId: 'user-123',
      user: { id: 'user-123', email: 'test@example.com' },
    });

    (applyRateLimit as jest.Mock).mockResolvedValue(null);

    (db.hasAccess as jest.Mock).mockResolvedValue(true);

    (gemini.generateRecommendationsWithResponse as jest.Mock).mockResolvedValue({
      recommendations: ['Movie 1', 'Movie 2', 'Movie 3'],
      conversationalResponse: 'Here are some great movies!',
      detectedPlatforms: [],
    });

    (tmdb.enrichRecommendations as jest.Mock).mockResolvedValue([
      { tmdb_id: 1, title: 'Movie 1', media_type: 'movie' },
      { tmdb_id: 2, title: 'Movie 2', media_type: 'movie' },
      { tmdb_id: 3, title: 'Movie 3', media_type: 'movie' },
    ]);

    (tmdb.getBatchWatchProviders as jest.Mock).mockResolvedValue({
      1: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
      2: [{ provider_id: 337, provider_name: 'Disney+', availability_type: 'flatrate' }],
    });

    (tmdb.getBatchDetailsAndCredits as jest.Mock).mockResolvedValue({
      credits: { 1: [{ id: 1, name: 'Actor 1' }] },
      detailedInfo: { 1: { genres: [{ id: 28, name: 'Action' }] } },
    });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        success: false,
        error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
        }),
      });

      const request = createMockRequest({
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Access Control', () => {
    it('should return 402 when user has no subscription or trial', async () => {
      (db.hasAccess as jest.Mock).mockResolvedValue(false);

      const request = createMockRequest({
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toBe('Subscription required');
    });

    it('should allow access when user has subscription', async () => {
      (db.hasAccess as jest.Mock).mockResolvedValue(true);

      const request = createMockRequest({
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 when no content type selected', async () => {
      const request = createMockRequest({
        query: 'action movies',
        includeMovies: false,
        includeTvShows: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should accept valid search request', async () => {
      const request = createMockRequest({
        query: 'comedy movies',
        includeMovies: true,
        includeTvShows: true,
        language: 'fr-FR',
        country: 'FR',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Search Flow', () => {
    it('should call Gemini with correct parameters', async () => {
      const request = createMockRequest({
        query: 'sci-fi movies',
        includeMovies: true,
        includeTvShows: false,
        language: 'en-US',
      });

      await POST(request);

      expect(gemini.generateRecommendationsWithResponse).toHaveBeenCalledWith(
        'sci-fi movies',
        ['movies'],
        'en-US',
        undefined,
        25 // Default recommendations count (no platform filters)
      );
    });

    it('should include both content types when selected', async () => {
      const request = createMockRequest({
        query: 'adventure',
        includeMovies: true,
        includeTvShows: true,
      });

      await POST(request);

      expect(gemini.generateRecommendationsWithResponse).toHaveBeenCalledWith(
        'adventure',
        ['movies', 'TV shows'],
        expect.any(String),
        undefined,
        25 // Default recommendations count (no platform filters)
      );
    });

    it('should request more recommendations when platform filters are active', async () => {
      const request = createMockRequest({
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
        platforms: [8, 9], // Netflix, Amazon Prime
      });

      await POST(request);

      expect(gemini.generateRecommendationsWithResponse).toHaveBeenCalledWith(
        'action movies',
        ['movies'],
        expect.any(String),
        undefined,
        40 // Increased recommendations count when platform filters are active
      );
    });

    it('should enrich recommendations with TMDB data', async () => {
      const request = createMockRequest({
        query: 'thriller',
        includeMovies: true,
        includeTvShows: false,
      });

      await POST(request);

      expect(tmdb.enrichRecommendations).toHaveBeenCalledWith(
        ['Movie 1', 'Movie 2', 'Movie 3'],
        true,
        false,
        expect.any(String)
      );
    });

    it('should fetch streaming providers for the specified country', async () => {
      const request = createMockRequest({
        query: 'horror',
        includeMovies: true,
        includeTvShows: false,
        country: 'US',
      });

      await POST(request);

      expect(tmdb.getBatchWatchProviders).toHaveBeenCalledWith(expect.any(Array), 'US');
    });
  });

  describe('Response Format', () => {
    it('should return recommendations with all required fields', async () => {
      const request = createMockRequest({
        query: 'action movies',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.recommendations).toBeDefined();
      expect(data.streamingProviders).toBeDefined();
      expect(data.credits).toBeDefined();
      expect(data.detailedInfo).toBeDefined();
      expect(data.conversationalResponse).toBeDefined();
      expect(data.totalResults).toBeDefined();
    });

    it('should include conversational response from Gemini', async () => {
      (gemini.generateRecommendationsWithResponse as jest.Mock).mockResolvedValue({
        recommendations: ['Movie'],
        conversationalResponse: 'Custom response!',
        detectedPlatforms: [],
      });

      const request = createMockRequest({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.conversationalResponse).toBe('Custom response!');
    });
  });

  describe('Platform Filtering', () => {
    it('should filter by platforms when specified', async () => {
      (tmdb.enrichRecommendations as jest.Mock).mockResolvedValue([
        { tmdb_id: 1, title: 'Movie 1', media_type: 'movie' },
        { tmdb_id: 2, title: 'Movie 2', media_type: 'movie' },
        { tmdb_id: 3, title: 'Movie 3', media_type: 'movie' },
        { tmdb_id: 4, title: 'Movie 4', media_type: 'movie' },
        { tmdb_id: 5, title: 'Movie 5', media_type: 'movie' },
        { tmdb_id: 6, title: 'Movie 6', media_type: 'movie' },
      ]);

      (tmdb.getBatchWatchProviders as jest.Mock).mockResolvedValue({
        1: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        2: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        3: [{ provider_id: 337, provider_name: 'Disney+', availability_type: 'flatrate' }],
        4: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        5: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        6: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
      });

      const request = createMockRequest({
        query: 'movies on Netflix',
        includeMovies: true,
        includeTvShows: false,
        platforms: [8], // Netflix only
        includeFlatrate: true,
      });

      const response = await POST(request);
      const data = await response.json();

      // Should only return movies available on Netflix (provider_id: 8)
      expect(data.recommendations.length).toBe(5); // Movies 1, 2, 4, 5, 6
    });

    it('should filter by availability type', async () => {
      (tmdb.enrichRecommendations as jest.Mock).mockResolvedValue([
        { tmdb_id: 1, title: 'Movie 1', media_type: 'movie' },
        { tmdb_id: 2, title: 'Movie 2', media_type: 'movie' },
        { tmdb_id: 3, title: 'Movie 3', media_type: 'movie' },
        { tmdb_id: 4, title: 'Movie 4', media_type: 'movie' },
        { tmdb_id: 5, title: 'Movie 5', media_type: 'movie' },
        { tmdb_id: 6, title: 'Movie 6', media_type: 'movie' },
      ]);

      (tmdb.getBatchWatchProviders as jest.Mock).mockResolvedValue({
        1: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        2: [{ provider_id: 2, provider_name: 'Apple', availability_type: 'rent' }],
        3: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        4: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        5: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        6: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
      });

      const request = createMockRequest({
        query: 'streaming movies',
        includeMovies: true,
        includeTvShows: false,
        includeFlatrate: true,
        includeRent: false,
        includeBuy: false,
      });

      const response = await POST(request);
      const data = await response.json();

      // Should only include flatrate movies (not rent)
      expect(data.recommendations.length).toBe(5); // Movies 1, 3, 4, 5, 6
    });
  });

  describe('AI-Detected Platforms', () => {
    it('should filter by AI-detected platforms from query', async () => {
      (gemini.generateRecommendationsWithResponse as jest.Mock).mockResolvedValue({
        recommendations: Array(10)
          .fill('Movie')
          .map((m, i) => `${m} ${i + 1}`),
        conversationalResponse: 'Netflix movies!',
        detectedPlatforms: ['Netflix'],
      });

      (tmdb.enrichRecommendations as jest.Mock).mockResolvedValue(
        Array(10)
          .fill(null)
          .map((_, i) => ({ tmdb_id: i + 1, title: `Movie ${i + 1}`, media_type: 'movie' }))
      );

      (tmdb.getBatchWatchProviders as jest.Mock).mockResolvedValue({
        1: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        2: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        3: [{ provider_id: 337, provider_name: 'Disney+', availability_type: 'flatrate' }],
        4: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        5: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        6: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        7: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        8: [{ provider_id: 337, provider_name: 'Disney+', availability_type: 'flatrate' }],
        9: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
        10: [{ provider_id: 8, provider_name: 'Netflix', availability_type: 'flatrate' }],
      });

      const request = createMockRequest({
        query: 'films sur Netflix',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);
      const data = await response.json();

      // Should filter to Netflix results (8 movies on Netflix)
      expect(data.recommendations.length).toBe(8);
    });
  });

  describe('Error Handling', () => {
    it('should handle Gemini errors gracefully', async () => {
      (gemini.generateRecommendationsWithResponse as jest.Mock).mockRejectedValue(
        new Error('AI service unavailable')
      );

      const request = createMockRequest({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI service unavailable');
    });

    it('should handle TMDB errors gracefully', async () => {
      (tmdb.enrichRecommendations as jest.Mock).mockRejectedValue(
        new Error('TMDB service unavailable')
      );

      const request = createMockRequest({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);
      await response.json(); // Consume response body

      expect(response.status).toBe(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      const request = createMockRequest({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      await POST(request);

      expect(applyRateLimit).toHaveBeenCalledWith(request, 'search');
    });

    it('should return rate limit response when limit exceeded', async () => {
      (applyRateLimit as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
        })
      );

      const request = createMockRequest({
        query: 'test',
        includeMovies: true,
        includeTvShows: false,
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
    });
  });
});
