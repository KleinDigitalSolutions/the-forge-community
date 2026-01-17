const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function debugDatabase() {
  console.log(`Checking Database ID: ${databaseId}`);
  try {
    const database = await notion.databases.retrieve({ database_id: databaseId });
    console.log('Successfully connected!');
    console.log('Parent Object:', JSON.stringify(database.parent, null, 2));
    console.log('Full Response Keys:', Object.keys(database));
  } catch (error) {
    console.error('Error fetching database:', error.message);
  }
}

debugDatabase();