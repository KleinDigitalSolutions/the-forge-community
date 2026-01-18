const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const lines = envContent.split('\n');
const vars = {};

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      vars[key] = value;
    }
  }
});

// JETZT ALLE KEYS INKLUSIVE API KEY
const keysToPush = [
  'NOTION_API_KEY',
  'NOTION_DATABASE_ID',
  'NOTION_FORUM_DATABASE_ID',
  'NOTION_VOTES_DATABASE_ID',
  'NOTION_TRANSACTIONS_DATABASE_ID',
  'NOTION_ANNOUNCEMENTS_DATABASE_ID',
  'NOTION_TASKS_DATABASE_ID',
  'NOTION_DOCUMENTS_DATABASE_ID',
  'NOTION_EVENTS_DATABASE_ID',
  'NOTION_GROUPS_DATABASE_ID',
  'ADMIN_EMAIL'
];

console.log('🚀 Start pushing ALL variables (including API Key) to Vercel...\n');

keysToPush.forEach(key => {
  if (vars[key]) {
    console.log(`📡 Pushing ${key}...`);
    try {
      // Remove old one just in case to force update? No, add usually updates or warns.
      // We will try to add. If it exists, we might need to remove first or just assume it updates?
      // Vercel CLI 'env add' prompts for value. We pipe it.
      // If it exists, it might error. Let's try.
      
      // Production
      execSync(`echo "${vars[key]}" | vercel env add ${key} production --force`, { stdio: 'inherit' });
      // Preview
      // execSync(`echo "${vars[key]}" | vercel env add ${key} preview --force`, { stdio: 'inherit' });
      // Development
      // execSync(`echo "${vars[key]}" | vercel env add ${key} development --force`, { stdio: 'inherit' });
      
      console.log(`✅ ${key} added/updated.\n`);
    } catch (error) {
      // If add fails (e.g. exists), we try 'rm' then 'add' ? 
      // Vercel CLI behavior: 'env add' errors if exists.
      console.log(`⚠️  Could not add ${key} (maybe exists). Attempting to remove and re-add...`);
      try {
          execSync(`vercel env rm ${key} production -y`, { stdio: 'inherit' });
          execSync(`echo "${vars[key]}" | vercel env add ${key} production`, { stdio: 'inherit' });
          console.log(`✅ ${key} updated successfully.\n`);
      } catch (retryError) {
          console.error(`❌ Failed to update ${key}: ${retryError.message}\n`);
      }
    }
  } else {
    console.log(`⚠️  ${key} not found in .env.local, skipping.\n`);
  }
});

console.log('🎉 Done! Vercel is now 100% in sync with local.');
