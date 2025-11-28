// Jest setup file - runs before each test file

// Set test environment variables
process.env.TURSO_DATABASE_URL = 'file:test.db';
process.env.TURSO_AUTH_TOKEN = 'test-token';
process.env.GOOGLE_API_KEY = 'test-google-api-key';
process.env.TMDB_API_KEY = 'test-tmdb-api-key';
process.env.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
process.env.MAX_FREE_PROMPTS = '3';
process.env.NODE_ENV = 'test';

// Increase timeout for tests that might take longer
jest.setTimeout(10000);
