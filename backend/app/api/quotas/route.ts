/**
 * FastFlix Backend - Quotas Endpoint
 * GET endpoint to retrieve current daily quota usage and limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { FREE_TIER_LIMITS, PREMIUM_LIMITS } from '@/lib/types';

/**
 * GET /api/quotas
 * Return current quota usage for the day and applicable limits
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    const userId = authResult.userId;

    // Weekly key for search quota
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    const weekKey = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

    // Get current search quota (weekly)
    const searchQuota = await db.getUserQuota(userId, weekKey);

    // Check if user is premium
    const isPremium = await db.hasAccess(userId);
    const limits = isPremium ? PREMIUM_LIMITS : FREE_TIER_LIMITS;

    return NextResponse.json({
      success: true,
      data: {
        period: weekKey,
        isPremium,
        usage: {
          searches: searchQuota.search_count,
        },
        limits: {
          searches: limits.searches,
        },
        remaining: {
          searches: limits.searches === -1 ? -1 : Math.max(0, limits.searches - searchQuota.search_count),
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quota information' }, { status: 500 });
  }
}
