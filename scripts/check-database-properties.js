const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function checkDatabaseProperties() {
  try {
    console.log('🔍 Checking database properties...\n');

    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    console.log(`📊 Database: ${database.title[0]?.plain_text || 'Untitled'}\n`);
    console.log('Properties:');
    console.log('─────────────────────────────────\n');

    for (const [propName, propData] of Object.entries(database.properties)) {
      console.log(`✓ ${propName}`);
      console.log(`  Type: ${propData.type}`);
      console.log('');
    }

    console.log('─────────────────────────────────');
    console.log('\n💡 Use these exact property names when adding data!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabaseProperties();
