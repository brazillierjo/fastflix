/**
 * Environment Variables Validation
 * Validates required environment variables at startup
 */

// Check if we're in production
const isProduction =
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

interface EnvConfig {
  // Database
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;

  // Auth
  JWT_SECRET: string;
  APPLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_ID?: string;

  // External APIs
  TMDB_API_KEY: string;
  GOOGLE_API_KEY: string;

  // RevenueCat (required in production)
  REVENUECAT_WEBHOOK_SECRET?: string;
}

/**
 * Required environment variables
 */
const requiredVars = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
  'JWT_SECRET',
  'TMDB_API_KEY',
  'GOOGLE_API_KEY',
] as const;

/**
 * Variables required only in production
 */
const productionRequiredVars = ['REVENUECAT_WEBHOOK_SECRET'] as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check production-only required variables
  if (isProduction) {
    for (const varName of productionRequiredVars) {
      if (!process.env[varName]) {
        missing.push(`${varName} (required in production)`);
      }
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n  - ${missing.join('\n  - ')}`;
    console.error(`[ENV] ${message}`);

    if (isProduction) {
      throw new Error(message);
    } else {
      console.warn('[ENV] Running in development mode - some features may be unavailable');
    }
  }

  return {
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL!,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN!,
    JWT_SECRET: process.env.JWT_SECRET!,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    TMDB_API_KEY: process.env.TMDB_API_KEY!,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY!,
    REVENUECAT_WEBHOOK_SECRET: process.env.REVENUECAT_WEBHOOK_SECRET,
  };
}

/**
 * Get environment configuration (cached)
 */
let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if running in production
 */
export function isProductionEnv(): boolean {
  return isProduction;
}
