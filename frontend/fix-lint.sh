#!/bin/bash

# Script pour fixer automatiquement les erreurs de lint et TypeScript
# Utilisation: ./fix-lint.sh

echo "🔧 Fixing lint and TypeScript errors..."

# Aller dans le dossier website
cd website

# Fixer les erreurs ESLint automatiquement
echo "📝 Running ESLint with --fix..."
npm run lint -- --fix

# Vérifier les erreurs TypeScript
echo "🔍 Checking TypeScript errors..."
npx tsc --noEmit

# Formater le code avec Prettier si disponible
if npm list prettier > /dev/null 2>&1; then
  echo "✨ Formatting code with Prettier..."
  npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
fi

echo "✅ Lint and TypeScript check completed!"

# Retourner au dossier parent
cd ..