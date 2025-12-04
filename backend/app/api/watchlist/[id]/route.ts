/**
 * FastFlix Backend - Watchlist Item Endpoint
 * DELETE: Remove item from watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/watchlist/:id
 * Remove an item from user's watchlist
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    // Remove from watchlist
    const deleted = await db.removeFromWatchlist(authResult.userId, id);

    if (!deleted) {
      return NextResponse.json({ error: 'Item not found in watchlist' }, { status: 404 });
    }

    console.log(`✅ Removed from watchlist: ${id} for user ${authResult.userId}`);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('❌ Error in DELETE /api/watchlist/:id:', error);
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
  }
}
