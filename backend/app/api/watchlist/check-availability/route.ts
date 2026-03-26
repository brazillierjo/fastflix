/**
 * FastFlix Backend - Watchlist Check Availability Endpoint
 * GET: Check all watchlist items for provider changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { tmdb } from '@/lib/tmdb';
import type { StreamingProvider } from '@/lib/types';

interface ProviderChange {
  watchlistId: string;
  title: string;
  newProviders: Array<{ name: string; logo: string }>;
  removedProviders: Array<{ name: string; logo: string }>;
}

/**
 * GET /api/watchlist/check-availability
 * Check all unwatched watchlist items for provider changes.
 * Only checks items not checked in the last 24 hours.
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Get items that need a provider check (last check > 24h ago), unwatched only
    const itemsToCheck = await db.getWatchlistItemsNeedingRefresh(authResult.userId);

    // Filter to only unwatched items
    const unwatchedItems = itemsToCheck.filter((item) => !item.watched);

    if (unwatchedItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          checkedCount: 0,
          message: 'All items are up to date',
        },
      });
    }

    const changes: ProviderChange[] = [];

    // Check providers in parallel
    const checkPromises = unwatchedItems.map(async (item) => {
      try {
        const currentProviders = await tmdb.getWatchProviders(
          item.tmdb_id,
          item.media_type,
          item.country
        );

        // Build sets for comparison using provider_id as key
        const oldProviderIds = new Set(item.providers.map((p) => p.provider_id));
        const currentProviderIds = new Set(currentProviders.map((p) => p.provider_id));

        // Find new providers (in current but not in old)
        const newProviders: Array<{ name: string; logo: string }> = currentProviders
          .filter((p) => !oldProviderIds.has(p.provider_id))
          .map((p) => ({
            name: p.provider_name,
            logo: p.logo_path,
          }));

        // Find removed providers (in old but not in current)
        const removedProviders: Array<{ name: string; logo: string }> = item.providers
          .filter((p: StreamingProvider) => !currentProviderIds.has(p.provider_id))
          .map((p: StreamingProvider) => ({
            name: p.provider_name,
            logo: p.logo_path,
          }));

        // Update stored providers with current data
        await db.updateWatchlistProviders(item.id, currentProviders);

        // Only report if there are actual changes
        if (newProviders.length > 0 || removedProviders.length > 0) {
          changes.push({
            watchlistId: item.id,
            title: item.title,
            newProviders,
            removedProviders,
          });
        }
      } catch (error) {
        console.error('❌ /api/watchlist/check-availability item check:', error);
        // Skip items that fail to check
      }
    });

    await Promise.all(checkPromises);

    return NextResponse.json({
      success: true,
      data: {
        changes,
        checkedCount: unwatchedItems.length,
        message:
          changes.length > 0
            ? `Found ${changes.length} items with provider changes`
            : 'No provider changes detected',
      },
    });
  } catch (error) {
    console.error('❌ /api/watchlist/check-availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
