/**
 * Tests for TMDB Service
 * Tests movie/TV search, enrichment, and provider fetching with mocked fetch
 */

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocking
import { tmdb } from '../lib/tmdb';

describe('TMDB Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.TMDB_API_KEY = 'test-api-key';
    process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    // Clear cache between tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tmdb as any).cache.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('searchMovieByTitle', () => {
    it('should search and return first movie result', async () => {
      const mockResponse = {
        results: [
          {
            id: 603,
            title: 'The Matrix',
            original_title: 'The Matrix',
            overview: 'A computer hacker learns about the true nature of reality.',
            poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
            backdrop_path: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
            vote_average: 8.7,
            vote_count: 24000,
            release_date: '1999-03-30',
            genre_ids: [28, 878],
            popularity: 80.5,
            adult: false,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await tmdb.searchMovieByTitle('The Matrix');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(603);
      expect(result?.title).toBe('The Matrix');
      expect(result?.media_type).toBe('movie');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/search/movie'));
    });

    it('should return null when no results found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const result = await tmdb.searchMovieByTitle('NonexistentMovie12345');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await tmdb.searchMovieByTitle('Test Movie');

      expect(result).toBeNull();
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse = {
        results: [{ id: 1, title: 'Test', media_type: 'movie' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // First call
      await tmdb.searchMovieByTitle('Test Movie', 'fr-FR');
      // Second call (should use cache)
      await tmdb.searchMovieByTitle('Test Movie', 'fr-FR');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should include language parameter in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      await tmdb.searchMovieByTitle('Test', 'de-DE');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('language=de-DE'));
    });
  });

  describe('searchTVByTitle', () => {
    it('should search and return first TV show result', async () => {
      const mockResponse = {
        results: [
          {
            id: 1399,
            name: 'Game of Thrones',
            original_name: 'Game of Thrones',
            overview: 'Epic fantasy series.',
            poster_path: '/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg',
            first_air_date: '2011-04-17',
            vote_average: 8.4,
            genre_ids: [18, 10765],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await tmdb.searchTVByTitle('Game of Thrones');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Game of Thrones');
      expect(result?.media_type).toBe('tv');
    });

    it('should return null when no TV results found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      });

      const result = await tmdb.searchTVByTitle('NonexistentShow');

      expect(result).toBeNull();
    });
  });

  describe('searchMulti', () => {
    it('should search both movies and TV shows', async () => {
      const mockResponse = {
        results: [
          { id: 1, title: 'Movie Result', media_type: 'movie' },
          { id: 2, name: 'TV Result', media_type: 'tv' },
          { id: 3, name: 'Actor', media_type: 'person' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await tmdb.searchMulti('Test');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1); // First movie/tv result
    });

    it('should filter out person results', async () => {
      const mockResponse = {
        results: [
          { id: 1, name: 'Actor', media_type: 'person' },
          { id: 2, title: 'Movie', media_type: 'movie' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await tmdb.searchMulti('Test');

      expect(result?.id).toBe(2); // Should return movie, not person
    });

    it('should return null when only person results', async () => {
      const mockResponse = {
        results: [{ id: 1, name: 'Actor', media_type: 'person' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await tmdb.searchMulti('Test Actor');

      expect(result).toBeNull();
    });
  });

  describe('enrichRecommendations', () => {
    it('should enrich multiple titles with TMDB data', async () => {
      // Mock responses for each search
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  id: 1,
                  title: 'Movie 1',
                  overview: 'Overview 1',
                  poster_path: '/poster1.jpg',
                  vote_average: 8.0,
                  media_type: 'movie',
                },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                {
                  id: 2,
                  title: 'Movie 2',
                  overview: 'Overview 2',
                  poster_path: '/poster2.jpg',
                  vote_average: 7.5,
                  media_type: 'movie',
                },
              ],
            }),
        });

      const results = await tmdb.enrichRecommendations(
        ['Movie 1', 'Movie 2'],
        true, // includeMovies
        false, // includeTvShows
        'fr-FR'
      );

      expect(results).toHaveLength(2);
      expect(results[0].tmdb_id).toBe(1);
      expect(results[1].tmdb_id).toBe(2);
    });

    it('should deduplicate results with same tmdb_id', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [{ id: 1, title: 'Movie', media_type: 'movie' }],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [{ id: 1, title: 'Movie (duplicate)', media_type: 'movie' }],
            }),
        });

      const results = await tmdb.enrichRecommendations(['Movie', 'Movie (duplicate)'], true, false);

      expect(results).toHaveLength(1);
    });

    it('should handle titles that are not found', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [{ id: 1, title: 'Found Movie', media_type: 'movie' }],
            }),
        });

      const results = await tmdb.enrichRecommendations(['Not Found', 'Found Movie'], true, false);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Found Movie');
    });

    it('should search with multi endpoint when both types enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ id: 1, title: 'Test', media_type: 'movie' }],
          }),
      });

      await tmdb.enrichRecommendations(['Test'], true, true);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/search/multi'));
    });

    it('should search only TV when movies disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [{ id: 1, name: 'Test Show', media_type: 'tv' }],
          }),
      });

      await tmdb.enrichRecommendations(['Test Show'], false, true);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/search/tv'));
    });
  });

  describe('getWatchProviders', () => {
    it('should return watch providers for a movie', async () => {
      const mockResponse = {
        results: {
          FR: {
            flatrate: [
              {
                provider_id: 8,
                provider_name: 'Netflix',
                logo_path: '/netflix.jpg',
                display_priority: 1,
              },
            ],
            rent: [
              {
                provider_id: 2,
                provider_name: 'Apple TV',
                logo_path: '/apple.jpg',
                display_priority: 2,
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const providers = await tmdb.getWatchProviders(603, 'movie', 'FR');

      expect(providers).toHaveLength(2);
      expect(providers[0].provider_name).toBe('Netflix');
      expect(providers[0].availability_type).toBe('flatrate');
      expect(providers[1].provider_name).toBe('Apple TV');
      expect(providers[1].availability_type).toBe('rent');
    });

    it('should return empty array when country not available', async () => {
      const mockResponse = {
        results: {
          US: {
            flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const providers = await tmdb.getWatchProviders(603, 'movie', 'FR');

      expect(providers).toHaveLength(0);
    });

    it('should avoid duplicate providers across availability types', async () => {
      const mockResponse = {
        results: {
          FR: {
            flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
            rent: [{ provider_id: 8, provider_name: 'Netflix' }], // Same provider
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const providers = await tmdb.getWatchProviders(603, 'movie', 'FR');

      expect(providers).toHaveLength(1);
      expect(providers[0].availability_type).toBe('flatrate'); // First occurrence wins
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const providers = await tmdb.getWatchProviders(999999, 'movie', 'FR');

      expect(providers).toHaveLength(0);
    });
  });

  describe('getBatchWatchProviders', () => {
    it('should fetch providers for multiple items', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: {
                FR: {
                  flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
                },
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: {
                FR: {
                  flatrate: [{ provider_id: 337, provider_name: 'Disney+' }],
                },
              },
            }),
        });

      const items = [
        { tmdb_id: 1, media_type: 'movie' as const },
        { tmdb_id: 2, media_type: 'tv' as const },
      ] as Parameters<typeof tmdb.getBatchWatchProviders>[0];

      const result = await tmdb.getBatchWatchProviders(items, 'FR');

      expect(Object.keys(result)).toHaveLength(2);
      expect(result[1][0].provider_name).toBe('Netflix');
      expect(result[2][0].provider_name).toBe('Disney+');
    });
  });

  describe('getMovieDetails', () => {
    it('should return detailed movie information', async () => {
      const mockResponse = {
        genres: [
          { id: 28, name: 'Action' },
          { id: 878, name: 'Science Fiction' },
        ],
        runtime: 136,
        release_date: '1999-03-30',
        tagline: 'Free your mind',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const details = await tmdb.getMovieDetails(603);

      expect(details).not.toBeNull();
      expect(details?.genres).toHaveLength(2);
      expect(details?.runtime).toBe(136);
      expect(details?.release_year).toBe(1999);
      expect(details?.tagline).toBe('Free your mind');
    });

    it('should handle missing release date', async () => {
      const mockResponse = {
        genres: [],
        runtime: 120,
        release_date: '',
        tagline: '',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const details = await tmdb.getMovieDetails(1);

      expect(details?.release_year).toBeUndefined();
    });

    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const details = await tmdb.getMovieDetails(999999);

      expect(details).toBeNull();
    });
  });

  describe('getTVDetails', () => {
    it('should return detailed TV show information', async () => {
      const mockResponse = {
        genres: [{ id: 18, name: 'Drama' }],
        number_of_seasons: 8,
        number_of_episodes: 73,
        episode_run_time: [60, 80],
        status: 'Ended',
        first_air_date: '2011-04-17',
        tagline: 'Winter is coming',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const details = await tmdb.getTVDetails(1399);

      expect(details).not.toBeNull();
      expect(details?.number_of_seasons).toBe(8);
      expect(details?.number_of_episodes).toBe(73);
      expect(details?.episode_run_time).toBe(70); // Average of [60, 80]
      expect(details?.status).toBe('Ended');
      expect(details?.first_air_year).toBe(2011);
    });
  });

  describe('getCredits', () => {
    it('should return top 10 cast members sorted by order', async () => {
      const cast = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Actor ${i + 1}`,
        character: `Character ${i + 1}`,
        profile_path: `/actor${i + 1}.jpg`,
        order: i,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cast }),
      });

      const credits = await tmdb.getCredits(603, 'movie');

      expect(credits).toHaveLength(10);
      expect(credits[0].name).toBe('Actor 1');
      expect(credits[9].name).toBe('Actor 10');
    });

    it('should return empty array when no cast', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cast: [] }),
      });

      const credits = await tmdb.getCredits(1, 'movie');

      expect(credits).toHaveLength(0);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return providers sorted by display priority', async () => {
      const mockResponse = {
        results: [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/netflix.jpg',
            display_priorities: { FR: 2 },
          },
          {
            provider_id: 337,
            provider_name: 'Disney+',
            logo_path: '/disney.jpg',
            display_priorities: { FR: 1 },
          },
          {
            provider_id: 119,
            provider_name: 'Amazon Prime',
            logo_path: '/prime.jpg',
            display_priorities: { US: 1 }, // Not in FR
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const providers = await tmdb.getAvailableProviders('FR');

      expect(providers).toHaveLength(2); // Only FR providers
      expect(providers[0].provider_name).toBe('Disney+'); // Priority 1 first
      expect(providers[1].provider_name).toBe('Netflix'); // Priority 2 second
    });

    it('should return empty array on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      const providers = await tmdb.getAvailableProviders('FR');

      expect(providers).toHaveLength(0);
    });
  });
});
