const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findAll() {
  console.log('📡 Lade alle sichtbaren Objekte aus Notion...');
  try {
    const response = await notion.search({});
    console.log(`\nGesamtanzahl Objekte: ${response.results.length}\n`);

    const databases = response.results.filter(r => r.object === 'database' || r.object === 'data_source');
    
    databases.forEach(db => {
      let title = 'Unbenannt';
      if (db.title) title = db.title[0]?.plain_text;
      else if (db.properties?.Name?.title) title = db.properties.Name.title[0]?.plain_text;
      
      console.log(`📦 [${db.object.toUpperCase()}] "${title}"`);
      console.log(`   ID: ${db.id}`);
      if (db.properties) {
          console.log(`   Properties: ${Object.keys(db.properties).join(', ')}`);
      }
      console.log('-----------------------------------');
    });

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  }
}

findAll();