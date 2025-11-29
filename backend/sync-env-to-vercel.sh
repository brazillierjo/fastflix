#!/bin/bash

# Sync environment variables from .env.local to Vercel
# This script adds all variables to production, preview, and development environments

set -e

echo "🔄 Syncing environment variables to Vercel..."
echo ""

# Read .env.local and export each variable
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" || "$key" =~ ^# ]]; then
    continue
  fi

  # Remove any quotes from value
  value="${value%\"}"
  value="${value#\"}"

  # Skip if value is empty
  if [[ -z "$value" ]]; then
    continue
  fi

  echo "Adding $key..."

  # Add to production
  echo "$value" | vercel env add "$key" production --yes 2>/dev/null || echo "  ⚠️  Already exists in production"

  # Add to preview
  echo "$value" | vercel env add "$key" preview --yes 2>/dev/null || echo "  ⚠️  Already exists in preview"

  # Add to development
  echo "$value" | vercel env add "$key" development --yes 2>/dev/null || echo "  ⚠️  Already exists in development"

  echo "  ✅ Done"
  echo ""

done < .env.local

echo ""
echo "✅ All environment variables synced to Vercel!"
echo ""
echo "Next steps:"
echo "1. Run: vercel --prod"
echo "2. Test the Apple Sign In"
