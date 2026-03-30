#!/bin/bash

# FastFlix Database Migration Runner
# Usage: ./run-migration.sh [migration_file]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default migration file
MIGRATION_FILE="${1:-001_add_users_auth.sql}"

echo -e "${YELLOW}FastFlix Database Migration${NC}"
echo "============================"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}Error: Migration file '$MIGRATION_FILE' not found${NC}"
  exit 1
fi

echo -e "Migration file: ${GREEN}$MIGRATION_FILE${NC}"
echo ""

# Ask for confirmation
read -p "Are you sure you want to run this migration? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo -e "${YELLOW}Migration cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}Running migration...${NC}"

# Run migration using turso
turso db shell fastflix-db < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
else
  echo ""
  echo -e "${RED}❌ Migration failed!${NC}"
  exit 1
fi

# Show updated schema
echo ""
echo -e "${YELLOW}Current database schema:${NC}"
turso db shell fastflix-db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo -e "${GREEN}Done!${NC}"
