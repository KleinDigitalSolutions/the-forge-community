const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

async function setupSquads() {
  console.log('Setting up Squad Architecture...\n');

  if (!parentPageId) {
    console.error('❌ NOTION_PARENT_PAGE_ID is missing. Cannot create database.');
    return;
  }

  try {
    // 1. Create GROUPS Database
    console.log('Creating "Groups" database...');
    const groupsDb = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'THE FORGE - Squads V2',
          },
        },
      ],
      properties: {
        Name: { title: {} },
        'Target Capital': { 
            select: {
                options: [
                    { name: '25k', color: 'gray' },
                    { name: '50k', color: 'blue' },
                    { name: '100k', color: 'purple' },
                ]
            }
        },
        Status: {
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

    console.log(`✅ Created "Groups" (ID: ${groupsDb.id})`);
    console.log(`\nPlease add this to your .env.local:\nNOTION_GROUPS_DATABASE_ID=${groupsDb.id}`);
    
    // Note: We cannot easily create a 2-way relation via API solely from here without knowing the Founders DB ID and updating it.
    // It is often safer to ask the user to add the Relation manually to avoid permission errors if the integration isn't perfect.
    // However, we can try to update the Founders DB if we have its ID.

    const foundersDbId = process.env.NOTION_DATABASE_ID;
    if (foundersDbId) {
        console.log('\nAttempting to link Founders DB to Groups DB...');
        try {
            await notion.databases.update({
                database_id: foundersDbId,
                properties: {
                    'Group': {
                        relation: {
                            database_id: groupsDb.id,
                            type: 'dual_property', // Creates a relation on both sides
                            dual_property: {}
                        }
                    }
                }
            });
            console.log('✅ Successfully linked "Founders" to "Groups"!');
        } catch (err) {
            console.log('⚠️ Could not automatically link databases. You might need to do this manually in Notion.');
            console.log('Error details:', err.message);
        }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupSquads();
