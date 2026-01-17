const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databases = {
  'NOTION_DATABASE_ID': process.env.NOTION_DATABASE_ID,
  'NOTION_FORUM_DATABASE_ID': process.env.NOTION_FORUM_DATABASE_ID,
  'NOTION_VOTES_DATABASE_ID': process.env.NOTION_VOTES_DATABASE_ID,
  'NOTION_TRANSACTIONS_DATABASE_ID': process.env.NOTION_TRANSACTIONS_DATABASE_ID,
  'NOTION_ANNOUNCEMENTS_DATABASE_ID': process.env.NOTION_ANNOUNCEMENTS_DATABASE_ID,
  'NOTION_TASKS_DATABASE_ID': process.env.NOTION_TASKS_DATABASE_ID,
  'NOTION_DOCUMENTS_DATABASE_ID': process.env.NOTION_DOCUMENTS_DATABASE_ID,
  'NOTION_EVENTS_DATABASE_ID': process.env.NOTION_EVENTS_DATABASE_ID,
  'NOTION_GROUPS_DATABASE_ID': process.env.NOTION_GROUPS_DATABASE_ID,
};

async function fixAllIds() {
  console.log('🔧 Finding real Source IDs...\n');

  const replacements = {};

  for (const [envKey, viewId] of Object.entries(databases)) {
    if (!viewId) continue;

    try {
      const db = await notion.databases.retrieve({ database_id: viewId });

      if (db.data_sources && db.data_sources.length > 0) {
        const sourceId = db.data_sources[0].id;
        const dbName = db.title?.[0]?.plain_text || envKey;

        console.log(`📌 ${dbName}:`);
        console.log(`   View ID:   ${viewId}`);
        console.log(`   Source ID: ${sourceId}\n`);

        replacements[viewId] = sourceId;
      }
    } catch (error) {
      console.log(`❌ ${envKey}: ${error.message}`);
    }
  }

  // Read .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace all View IDs with Source IDs
  for (const [viewId, sourceId] of Object.entries(replacements)) {
    envContent = envContent.replace(viewId, sourceId);
  }

  // Backup original
  fs.writeFileSync(envPath + '.backup', fs.readFileSync(envPath));
  console.log('💾 Backed up original .env.local to .env.local.backup\n');

  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with Source IDs!\n');

  console.log('🎯 Next step: Run scripts to add Properties to the Source DBs');
}

fixAllIds();
