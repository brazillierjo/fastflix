/**
 * Integration test for /api/health endpoint
 */

import { describe, it, expect } from '@jest/globals';
import { GET } from '../app/api/health/route';

describe('API /api/health', () => {
  it('should return 200 OK with correct structure', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('service', 'FastFlix Backend API');
    expect(data).toHaveProperty('version', '1.0.0');
  });

  it('should return valid ISO timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp instanceof Date).toBe(true);
    expect(isNaN(timestamp.getTime())).toBe(false);
  });

  it('should return same structure on multiple calls', async () => {
    const response1 = await GET();
    const data1 = await response1.json();

    const response2 = await GET();
    const data2 = await response2.json();

    expect(data1.status).toBe(data2.status);
    expect(data1.service).toBe(data2.service);
    expect(data1.version).toBe(data2.version);
    // Timestamps will be different, but both should be valid
    expect(data1.timestamp).toBeDefined();
    expect(data2.timestamp).toBeDefined();
  });
});
