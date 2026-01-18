#!/bin/bash

echo "📝 Füge Notion Environment Variables zu Vercel hinzu..."
echo "========================================================"

# Function to add a variable to all environments
add_env_var() {
  local name=$1
  local value=$2

  echo ""
  echo "Füge $name hinzu..."

  # Production
  echo "$value" | vercel env add "$name" production
  sleep 1

  # Preview
  echo "$value" | vercel env add "$name" preview
  sleep 1

  # Development
  echo "$value" | vercel env add "$name" development
  sleep 1
}

# Add all Notion variables
add_env_var "NOTION_API_KEY" "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"
add_env_var "NOTION_DATABASE_ID" "2ea69398379480dc8fdbe8136641105a"
add_env_var "NOTION_FORUM_DATABASE_ID" "e3b2c19142414318a0b1c520e4c87e95"
add_env_var "NOTION_VOTES_DATABASE_ID" "34e3d2057f98487f90d2bd4e02955417"
add_env_var "NOTION_TRANSACTIONS_DATABASE_ID" "37d248b1789045e09ec512be5ed15e67"
add_env_var "NOTION_ANNOUNCEMENTS_DATABASE_ID" "0f386904305e4bd2a68194171ded8b4b"
add_env_var "NOTION_TASKS_DATABASE_ID" "50b6bfb2c9f544ecb8db41e5bbac62c1"
add_env_var "NOTION_DOCUMENTS_DATABASE_ID" "956898b39a0b417ba058018e5458c83d"
add_env_var "NOTION_EVENTS_DATABASE_ID" "edf2125ecd1546e9ae78e27816f0c0f5"
add_env_var "NOTION_GROUPS_DATABASE_ID" "1df1e525291c4d6e86b982120fc4f38e"

echo ""
echo "✅ Alle Notion Variables hinzugefügt!"
echo ""
echo "Jetzt neu deployen mit: vercel --prod"
