const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const groupsDbId = process.env.NOTION_GROUPS_DATABASE_ID;

async function seedSquadAlpha() {
  console.log('🌱 Seeding "Squad Alpha"...\n');

  if (!groupsDbId) {
    console.error('❌ NOTION_GROUPS_DATABASE_ID missing.');
    return;
  }

  try {
    const response = await notion.pages.create({
      parent: {
        database_id: groupsDbId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: 'Squad Alpha',
              },
            },
          ],
        },
        'Target Capital': {
          select: {
            name: '25k',
          },
        },
        Status: {
          status: {
            name: 'Live', // Bereits gelauncht
          },
        },
        'Max Founders': {
          number: 25,
        },
        'Start Date': {
            date: {
                start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0] // Vor 3 Monaten
            }
        }
      },
    });

    console.log(`✅ Squad Alpha created! ID: ${response.id}`);
    console.log('Go to /admin to see it in action.');

  } catch (error) {
    console.error('❌ Error creating squad:', error.message);
  }
}

seedSquadAlpha();