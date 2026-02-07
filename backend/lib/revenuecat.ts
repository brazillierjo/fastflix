/**
 * RevenueCat API v2 Integration
 *
 * RevenueCat is the single source of truth for subscription status.
 * Uses in-memory cache (5 min TTL) to reduce API calls.
 */

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface SubscriptionStatus {
  isPremium: boolean;
  expiresAt: string | null;
}

interface CacheEntry {
  data: SubscriptionStatus;
  expiresAt: number;
}

// In-memory cache for subscription status
const cache = new Map<string, CacheEntry>();

// RevenueCat API V2 response structure
interface RevenueCatV2Response {
  id: string;
  active_entitlements: {
    items: Array<{
      entitlement_id: string;
      expires_at: number | null;
      object: string;
    }>;
    next_page: string | null;
    object: string;
    url: string;
  };
  first_seen_at: number;
  last_seen_at: number;
}

/**
 * Fetch subscription status from RevenueCat API (V2)
 */
async function fetchFromRevenueCat(userId: string): Promise<SubscriptionStatus> {
  const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
  const projectId = process.env.REVENUECAT_PROJECT_ID;

  if (!apiKey || !projectId) {
    console.error('❌ RevenueCat API not configured (missing REVENUECAT_SECRET_API_KEY or REVENUECAT_PROJECT_ID)');
    return { isPremium: false, expiresAt: null };
  }

  try {
    const url = `${REVENUECAT_API_URL}/projects/${projectId}/customers/${userId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // User not found in RevenueCat = free tier
    if (response.status === 404) {
      console.log(`📋 RevenueCat: User ${userId} not found, returning free tier`);
      return { isPremium: false, expiresAt: null };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ RevenueCat API error: ${response.status} ${response.statusText}`, errorBody);
      return { isPremium: false, expiresAt: null };
    }

    const data = (await response.json()) as RevenueCatV2Response;

    // V2 API: active_entitlements.items contains all active entitlements
    const activeEntitlements = data.active_entitlements?.items || [];

    // User has premium if they have ANY active entitlement
    const isPremium = activeEntitlements.length > 0;

    // Get the expiration date from the first entitlement
    let expiresAt: string | null = null;
    if (isPremium && activeEntitlements.length > 0) {
      const expiresAtMs = activeEntitlements[0].expires_at;
      if (expiresAtMs) {
        expiresAt = new Date(expiresAtMs).toISOString();
      }
    }

    console.log(`📋 RevenueCat: User ${userId} isPremium=${isPremium}, expiresAt=${expiresAt}`);

    return { isPremium, expiresAt };
  } catch (error) {
    console.error(`❌ Failed to fetch subscription from RevenueCat for ${userId}:`, error);
    return { isPremium: false, expiresAt: null };
  }
}

/**
 * Check if a user has premium access
 * Uses in-memory cache (5 min TTL) to reduce RevenueCat API calls
 */
export async function checkPremiumAccess(userId: string): Promise<SubscriptionStatus> {
  // Check cache first
  const cached = cache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // Fetch from RevenueCat
  const status = await fetchFromRevenueCat(userId);

  // Cache the result
  cache.set(userId, {
    data: status,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return status;
}

/**
 * Invalidate cache for a user
 * Call this when subscription changes (e.g., after webhook)
 */
export function invalidateSubscriptionCache(userId: string): void {
  cache.delete(userId);
  console.log(`🔄 Subscription cache invalidated for ${userId}`);
}
