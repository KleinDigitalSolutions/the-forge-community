const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

async function createClean() {
  console.log('Creating Clean Squads DB...');
  
  const db = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ text: { content: 'THE FORGE - Squads FINAL' } }],
    properties: {
        Name: { title: {} } // Minimal
    }
  });
  
  console.log('ID:', db.id);
  
  // Now add properties one by one
  console.log('Adding Status...');
  await notion.databases.update({
      database_id: db.id,
      properties: {
          Status: { select: { options: [{ name: 'Live', color: 'green' }] } }
      }
  });

  console.log('Adding Target...');
  await notion.databases.update({
      database_id: db.id,
      properties: {
          'Target Capital': { select: { options: [{ name: '25k', color: 'gray' }] } }
      }
  });
  
  console.log('Adding Max Founders...');
  await notion.databases.update({
      database_id: db.id,
      properties: {
          'Max Founders': { number: {} }
      }
  });

  console.log('ALL GOOD! Use this ID:', db.id);
}

createClean();