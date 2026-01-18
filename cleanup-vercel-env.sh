#!/bin/bash

echo "🧹 VERCEL ENVIRONMENT VARIABLES CLEANUP"
echo "========================================"
echo ""

# Notion Variables, die gelöscht werden sollen
NOTION_VARS=(
  "NOTION_API_KEY"
  "NOTION_DATABASE_ID"
  "NOTION_FORUM_DATABASE_ID"
  "NOTION_VOTES_DATABASE_ID"
  "NOTION_TRANSACTIONS_DATABASE_ID"
  "NOTION_ANNOUNCEMENTS_DATABASE_ID"
  "NOTION_TASKS_DATABASE_ID"
  "NOTION_DOCUMENTS_DATABASE_ID"
  "NOTION_EVENTS_DATABASE_ID"
  "NOTION_GROUPS_DATABASE_ID"
)

echo "Step 1: Lösche alte Notion Variables..."
echo "========================================="
for var in "${NOTION_VARS[@]}"; do
  echo "Lösche $var aus allen Environments..."

  # Versuche aus Production zu löschen
  echo "$var" | vercel env rm "$var" production --yes 2>/dev/null || true

  # Versuche aus Preview zu löschen
  echo "$var" | vercel env rm "$var" preview --yes 2>/dev/null || true

  # Versuche aus Development zu löschen
  echo "$var" | vercel env rm "$var" development --yes 2>/dev/null || true

  sleep 1
done

echo ""
echo "✅ Alte Variables gelöscht!"
echo ""
echo "Step 2: Erstelle neue Variables (OHNE Bindestriche)..."
echo "======================================================="

# Korrekte Werte OHNE Bindestriche
declare -A NEW_VARS=(
  ["NOTION_API_KEY"]="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"
  ["NOTION_DATABASE_ID"]="2ea69398379480dc8fdbe8136641105a"
  ["NOTION_FORUM_DATABASE_ID"]="e3b2c19142414318a0b1c520e4c87e95"
  ["NOTION_VOTES_DATABASE_ID"]="34e3d2057f98487f90d2bd4e02955417"
  ["NOTION_TRANSACTIONS_DATABASE_ID"]="37d248b1789045e09ec512be5ed15e67"
  ["NOTION_ANNOUNCEMENTS_DATABASE_ID"]="0f386904305e4bd2a68194171ded8b4b"
  ["NOTION_TASKS_DATABASE_ID"]="50b6bfb2c9f544ecb8db41e5bbac62c1"
  ["NOTION_DOCUMENTS_DATABASE_ID"]="956898b39a0b417ba058018e5458c83d"
  ["NOTION_EVENTS_DATABASE_ID"]="edf2125ecd1546e9ae78e27816f0c0f5"
  ["NOTION_GROUPS_DATABASE_ID"]="1df1e525291c4d6e86b982120fc4f38e"
)

for var_name in "${!NEW_VARS[@]}"; do
  value="${NEW_VARS[$var_name]}"

  echo "Erstelle $var_name für Production..."
  echo "$value" | vercel env add "$var_name" production

  echo "Erstelle $var_name für Preview..."
  echo "$value" | vercel env add "$var_name" preview

  echo "Erstelle $var_name für Development..."
  echo "$value" | vercel env add "$var_name" development

  sleep 1
done

echo ""
echo "✅ Alle Variables neu erstellt!"
echo ""
echo "Step 3: Überprüfe andere wichtige Variables..."
echo "==============================================="

# Prüfe ob GROQ_API_KEY vorhanden ist
if vercel env ls | grep -q "GROQ_API_KEY"; then
  echo "✅ GROQ_API_KEY ist vorhanden"
else
  echo "⚠️  GROQ_API_KEY fehlt - bitte manuell hinzufügen!"
fi

# Prüfe ob AUTH_* vorhanden sind
if vercel env ls | grep -q "AUTH_SECRET"; then
  echo "✅ AUTH_SECRET ist vorhanden"
else
  echo "⚠️  AUTH_SECRET fehlt - bitte manuell hinzufügen!"
fi

if vercel env ls | grep -q "AUTH_RESEND_KEY"; then
  echo "✅ AUTH_RESEND_KEY ist vorhanden"
else
  echo "⚠️  AUTH_RESEND_KEY fehlt - bitte manuell hinzufügen!"
fi

echo ""
echo "🎉 CLEANUP ABGESCHLOSSEN!"
echo "========================="
echo ""
echo "Nächster Schritt: Redeploy mit 'vercel --prod'"
