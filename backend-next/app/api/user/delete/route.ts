/**
 * FastFlix Backend - Delete Account Endpoint
 * POST endpoint to soft-delete a user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';

/**
 * POST /api/user/delete
 * Soft-delete the authenticated user's account
 * Sets deleted_at timestamp — data preserved to prevent trial abuse
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.success || !authResult.userId) {
      return authResult.error!;
    }

    await db.softDeleteUser(authResult.userId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
