#!/bin/bash

# List of variables to transfer
vars=(
  "AUTH_RESEND_FROM"
  "GEMINI_API_VERSION"
  "GEMINI_MODEL"
  "MODAL_PREFETCH_URL"
  "REPLICATE_API_TOKEN"
  "REPLICATE_WEBHOOK_"
  "STRIPE_WEBHOOK_SECRET"
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY"
  "TURNSTILE_SECRET_KEY"
)

# Function to get value from .env.local
get_val() {
  grep "^$1=" .env.local | cut -d'=' -f2- | sed 's/^"//;s/"$//'
}

echo "Starting transfer of environment variables to Vercel..."

for var in "${vars[@]}"; do
  val=$(get_val "$var")
  if [ -n "$val" ]; then
    echo "Adding $var..."
    # We use printf to handle potential special characters in values
    printf "%s" "$val" | vercel env add "$var" production --force
    printf "%s" "$val" | vercel env add "$var" preview --force
    printf "%s" "$val" | vercel env add "$var" development --force
  else
    echo "Skipping $var (not found in .env.local)"
  fi
done

# Special case for NEXT_PUBLIC_APP_URL which might be your custom domain
val=$(get_val "AUTH_URL")
if [ -n "$val" ]; then
  echo "Adding NEXT_PUBLIC_APP_URL (from AUTH_URL)..."
  printf "%s" "$val" | vercel env add "NEXT_PUBLIC_APP_URL" production --force
  printf "%s" "$val" | vercel env add "NEXT_PUBLIC_APP_URL" preview --force
  printf "%s" "$val" | vercel env add "NEXT_PUBLIC_APP_URL" development --force
fi

echo "Done! Please run 'vercel deploy' or wait for the next push to apply changes."
