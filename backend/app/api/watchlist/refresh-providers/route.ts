/**
 * FastFlix Backend - Watchlist Refresh Providers Endpoint
 * POST: Refresh streaming providers for watchlist items
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { tmdb } from '@/lib/tmdb';

/**
 * POST /api/watchlist/refresh-providers
 * Refresh streaming providers for all watchlist items that are stale (> 24h old)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    // Get items that need refresh (last check > 24h ago)
    const itemsToRefresh = await db.getWatchlistItemsNeedingRefresh(authResult.userId);

    if (itemsToRefresh.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          refreshed: 0,
          message: 'All providers are up to date',
        },
      });
    }

    console.log(`🔄 Refreshing providers for ${itemsToRefresh.length} watchlist items`);

    // Refresh providers in parallel
    const refreshPromises = itemsToRefresh.map(async (item) => {
      try {
        const providers = await tmdb.getWatchProviders(item.tmdb_id, item.media_type, item.country);
        await db.updateWatchlistProviders(item.id, providers);
        return { id: item.id, success: true };
      } catch (error) {
        console.error(`❌ Failed to refresh providers for ${item.title}:`, error);
        return { id: item.id, success: false };
      }
    });

    const results = await Promise.all(refreshPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`✅ Refreshed providers for ${successCount}/${itemsToRefresh.length} items`);

    return NextResponse.json({
      success: true,
      data: {
        refreshed: successCount,
        total: itemsToRefresh.length,
        message: `Refreshed ${successCount} of ${itemsToRefresh.length} items`,
      },
    });
  } catch (error) {
    console.error('❌ Error in POST /api/watchlist/refresh-providers:', error);
    return NextResponse.json({ error: 'Failed to refresh providers' }, { status: 500 });
  }
}
