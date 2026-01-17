const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dbId = process.env.NOTION_GROUPS_DATABASE_ID;

async function checkSchema() {
  const db = await notion.databases.retrieve({ database_id: dbId });
  console.log(JSON.stringify(db, null, 2));
}

checkSchema();