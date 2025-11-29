/**
 * Script de test pour valider les endpoints d'authentification
 * Usage: npx tsx test-auth-endpoints.ts
 */

import dotenv from 'dotenv';
import { generateJWT } from './lib/auth';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Pour les tests locaux, on a besoin d'un JWT_SECRET
// En production, ce secret est dans Vercel
if (!process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET non trouvé dans .env.local');
  console.log("⚠️  Les tests vont utiliser les tokens JWT depuis l'app réelle\n");
}

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://fastflix-api.vercel.app';
const TEST_USER_ID = '57248865-dfc5-4aa0-93da-0fd8d4590032'; // userId réel depuis RevenueCat log
const TEST_EMAIL = 'johan@example.com'; // Email de test

async function runTests() {
  console.log("🧪 Tests des endpoints d'authentification\n");
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  // Test 1: GET /api/auth/me avec JWT valide
  console.log('📝 Test 1: GET /api/auth/me avec JWT valide');
  try {
    const validToken = generateJWT(TEST_USER_ID, TEST_EMAIL);
    console.log(`Token généré: ${validToken.substring(0, 50)}...`);

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    const data = await response.json();

    if (response.status === 200 && data.user) {
      console.log('✅ PASS - User récupéré avec succès');
      console.log(`   User: ${data.user.email}\n`);
    } else {
      console.log(`❌ FAIL - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}\n`);
  }

  // Test 2: POST /api/search sans JWT
  console.log('📝 Test 2: POST /api/search sans JWT (doit retourner 401)');
  try {
    const response = await fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'test movie',
        language: 'en',
        country: 'US',
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      console.log('✅ PASS - 401 Unauthorized comme attendu');
      console.log(`   Message: ${data.error}\n`);
    } else {
      console.log(`❌ FAIL - Attendu 401, reçu ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}\n`);
  }

  // Test 3: POST /api/search avec JWT expiré
  console.log('📝 Test 3: POST /api/search avec JWT expiré (doit retourner 401)');
  try {
    // Créer un token expiré manuellement
    const jwtLib = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.log('⚠️  SKIP - JWT_SECRET non défini\n');
    } else {
      const expiredToken = jwtLib.default.sign(
        { userId: TEST_USER_ID, email: TEST_EMAIL },
        secret,
        { expiresIn: '-1h' } // Token expiré il y a 1 heure
      );

      const response = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${expiredToken}`,
        },
        body: JSON.stringify({
          query: 'test movie',
          language: 'en',
          country: 'US',
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        console.log('✅ PASS - 401 Unauthorized pour token expiré');
        console.log(`   Message: ${data.error}\n`);
      } else {
        console.log(`❌ FAIL - Attendu 401, reçu ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data)}\n`);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}\n`);
  }

  // Test 4: POST /api/search avec JWT valide
  console.log('📝 Test 4: POST /api/search avec JWT valide (doit fonctionner)');
  try {
    const validToken = generateJWT(TEST_USER_ID, TEST_EMAIL);

    const response = await fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        query: 'Inception',
        language: 'en',
        country: 'US',
      }),
    });

    const data = await response.json();

    if (response.status === 200 && data.results) {
      console.log('✅ PASS - Recherche réussie avec JWT valide');
      console.log(`   Résultats: ${data.results.length} films trouvés\n`);
    } else {
      console.log(`❌ FAIL - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}\n`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}\n`);
  }

  console.log('🏁 Tests terminés');
}

// Exécuter les tests
runTests().catch(console.error);
