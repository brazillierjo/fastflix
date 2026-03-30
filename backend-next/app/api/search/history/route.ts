/**
 * FastFlix Backend - Search History Endpoint
 * GET endpoint to retrieve recent search history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/search/history
 * Return last 20 searches for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const history = await db.getSearchHistory(authResult.userId, 20);

    return NextResponse.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error('❌ /api/search/history:', error);
    return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 });
  }
}
