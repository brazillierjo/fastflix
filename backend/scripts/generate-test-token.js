#!/usr/bin/env node
/**
 * Generate a test JWT token for API testing
 * Usage: node scripts/generate-test-token.js
 */

require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

const userId = process.argv[2] || '57248865-dfc5-4aa0-93da-0fd8d4590032';
const email = process.argv[3] || 'j.r.brazillier@icloud.com';

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in .env.local');
  process.exit(1);
}

const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '30d' });

console.log('🔐 Test JWT Token Generated');
console.log('━'.repeat(50));
console.log(token);
console.log('━'.repeat(50));
console.log('');
console.log('Usage with curl:');
console.log(`curl -X POST http://localhost:3000/api/search \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "Authorization: Bearer ${token.substring(0, 20)}..." \\`);
console.log(
  `  -d '{"query": "comédie romantique moderne", "includeMovies": true, "includeTvShows": true}'`
);
