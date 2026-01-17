const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const dbId = process.env.NOTION_GROUPS_DATABASE_ID;

async function fixSchema() {
  console.log('Fixing Groups Database Schema...');
  try {
    await notion.databases.update({
      database_id: dbId,
      properties: {
        'Target Capital': { 
            select: {
                options: [
                    { name: '25k', color: 'gray' },
                    { name: '50k', color: 'blue' },
                    { name: '100k', color: 'purple' },
                ]
            } 
        },
        'Status': {
          select: {
            options: [
              { name: 'Recruiting', color: 'yellow' },
              { name: 'Building', color: 'blue' },
              { name: 'Live', color: 'green' },
              { name: 'Exit', color: 'red' },
            ],
          },
        },
        'Max Founders': { number: { format: 'number' } },
        'Start Date': { date: {} },
      },
    });
    console.log('✅ Schema fixed!');
  } catch (e) {
    console.error('❌ Error fixing schema:', e.message);
  }
}

fixSchema();