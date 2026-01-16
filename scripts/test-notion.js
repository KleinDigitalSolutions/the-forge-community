const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function testNotionConnection() {
  console.log('🧪 Testing Notion Connection...\n');
  console.log(`Database ID: ${databaseId}\n`);

  try {
    // Test 1: Retrieve database
    console.log('1️⃣ Testing database access...');
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    console.log(`✅ Database found: "${database.title[0]?.plain_text || 'Untitled'}"\n`);

    // Test 2: Query database
    console.log('2️⃣ Testing database query...');
    const response = await notion.databases.query({
      database_id: databaseId,
    });
    console.log(`✅ Query successful! Found ${response.results.length} entries\n`);

    console.log('🎉 All tests passed! Notion integration is working perfectly.\n');
    console.log('Next steps:');
    console.log('1. Check your Notion database - you should see the test founder');
    console.log('2. Visit http://localhost:3000/dashboard to see live data');
    console.log('3. Ready to deploy! 🚀');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 Troubleshooting:');

    if (error.code === 'object_not_found') {
      console.error('   → The database was not found');
      console.error('   → Make sure to connect your integration to the database:');
      console.error('     1. Open your database in Notion');
      console.error('     2. Click "..." (top right)');
      console.error('     3. Click "Add connections"');
      console.error('     4. Select your integration');
    } else if (error.code === 'unauthorized') {
      console.error('   → Invalid API key or missing permissions');
      console.error('   → Check your NOTION_API_KEY in .env.local');
    } else {
      console.error('   → Unknown error:', error);
    }
  }
}

testNotionConnection();
