/**
 * FastFlix Backend - User Stats Endpoint
 * GET: Return user statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/user/stats
 * Return user statistics including search count, watchlist, streaks, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const stats = await db.getUserStats(authResult.userId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}
