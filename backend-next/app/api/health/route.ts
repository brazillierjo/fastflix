/**
 * FastFlix Backend - Health Check Endpoint
 * Simple endpoint to verify API is running
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FastFlix Backend API',
    version: '1.0.0',
  });
}
