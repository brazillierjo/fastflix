/**
 * FastFlix Backend - Check Limit Endpoint
 * Checks if a device can make a prompt (quota verification)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkLimitSchema } from '@/lib/validation';
import { promptCounter } from '@/lib/prompt-counter';
import { applyRateLimit } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    // Parse request body first to get deviceId for rate limiting
    const body = await request.json();
    const validatedData = checkLimitSchema.parse(body);

    // Apply rate limiting (IP + device)
    const rateLimitResponse = await applyRateLimit(request, 'checkLimit', validatedData.deviceId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check if device can make a prompt
    const result = await promptCounter.canMakePrompt(validatedData.deviceId);

    return NextResponse.json({
      allowed: result.allowed,
      remaining: result.remaining,
      isProUser: result.isProUser,
      reason: result.reason,
    });
  } catch (error) {
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Other errors
    console.error('❌ Error in /api/check-limit:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
