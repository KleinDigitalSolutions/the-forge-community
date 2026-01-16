const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function createFoundersDatabase() {
  try {
    console.log('🔨 Creating THE FORGE Founders Database...\n');

    // Create a new database in the workspace
    const database = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: '2e969398-3794-8057-9475-f5ee6d71933f', // Use existing page as parent
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'THE FORGE - Founders',
          },
        },
      ],
      properties: {
        'Name': {
          title: {},
        },
        'Email': {
          email: {},
        },
        'Phone': {
          phone_number: {},
        },
        'Instagram': {
          rich_text: {},
        },
        'Why Join': {
          rich_text: {},
        },
        'Founder Number': {
          number: {
            format: 'number',
          },
        },
        'Joined Date': {
          date: {},
        },
        'Status': {
          select: {
            options: [
              {
                name: 'pending',
                color: 'yellow',
              },
              {
                name: 'active',
                color: 'green',
              },
              {
                name: 'inactive',
                color: 'red',
              },
            ],
          },
        },
        'Investment Paid': {
          checkbox: {},
        },
      },
    });

    console.log('✅ Database created successfully!');
    console.log(`\n📊 New Database ID: ${database.id}`);
    console.log(`\nUpdate your .env.local with:`);
    console.log(`NOTION_DATABASE_ID=${database.id}`);
    console.log(`\n🔗 Database URL: https://notion.so/${database.id.replace(/-/g, '')}`);

    console.log('\n🎉 All done! Visit http://localhost:3000/dashboard to see your data.');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.code === 'object_not_found') {
      console.error('\n💡 Alternative: Let me create a standalone database...');

      // Try creating without parent
      try {
        const standaloneDb = await notion.databases.create({
          parent: {
            type: 'workspace',
          },
          title: [
            {
              type: 'text',
              text: {
                content: 'THE FORGE - Founders',
              },
            },
          ],
          properties: {
            'Name': { title: {} },
            'Email': { email: {} },
            'Phone': { phone_number: {} },
            'Instagram': { rich_text: {} },
            'Why Join': { rich_text: {} },
            'Founder Number': { number: { format: 'number' } },
            'Joined Date': { date: {} },
            'Status': {
              select: {
                options: [
                  { name: 'pending', color: 'yellow' },
                  { name: 'active', color: 'green' },
                  { name: 'inactive', color: 'red' },
                ],
              },
            },
            'Investment Paid': { checkbox: {} },
          },
        });

        console.log('✅ Standalone database created!');
        console.log(`\n📊 Database ID: ${standaloneDb.id}`);
        console.log(`\nUpdate .env.local:`);
        console.log(`NOTION_DATABASE_ID=${standaloneDb.id}`);
      } catch (err) {
        console.error('❌ Failed to create standalone database:', err.message);
      }
    }
  }
}

createFoundersDatabase();
