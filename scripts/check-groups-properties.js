const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const groupsDbId = process.env.NOTION_GROUPS_DATABASE_ID;

async function checkProperties() {
  console.log('🔍 Checking Groups Database...\n');
  console.log('ID:', groupsDbId);

  try {
    const db = await notion.databases.retrieve({ database_id: groupsDbId });

    console.log('\n📊 Database Info:');
    console.log('Title:', db.title?.[0]?.plain_text || 'Untitled');
    console.log('URL:', db.url);

    if (db.properties && Object.keys(db.properties).length > 0) {
      console.log('\n✅ Properties found:');
      Object.keys(db.properties).forEach(key => {
        const prop = db.properties[key];
        console.log(`  - ${key} (${prop.type})`);
      });

      // Check specifically for our required properties
      const required = ['Target Capital', 'Status', 'Max Founders', 'Start Date'];
      console.log('\n🎯 Required Properties Check:');
      required.forEach(name => {
        const exists = db.properties[name] ? '✅' : '❌';
        console.log(`  ${exists} ${name}`);
      });
    } else {
      console.log('\n❌ No properties found (this is a Linked View issue)');

      if (db.data_sources && db.data_sources.length > 0) {
        console.log('\n💡 This is a Linked Database View!');
        console.log('Real Source DB ID:', db.data_sources[0].id);
        console.log('\n⚠️  You need to either:');
        console.log('  1. Update .env.local with the Source ID above');
        console.log('  2. OR manually add properties in Notion to this view');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProperties();
