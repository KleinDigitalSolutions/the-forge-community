const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function setupNotionDatabase() {
  try {
    console.log('🔧 Setting up THE FORGE Notion Database...\n');

    // Get current database structure
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    console.log('✅ Connected to Notion!');
    console.log(`📊 Database: ${database.title[0]?.plain_text || 'Untitled'}\n`);

    // Update database title and properties
    await notion.databases.update({
      database_id: databaseId,
      title: [
        {
          type: 'text',
          text: {
            content: 'THE FORGE - Founders Database',
          },
        },
      ],
      properties: {
        // Main fields
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
        // Founder tracking
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

    console.log('✅ Database structure updated!\n');
    console.log('📋 Properties configured:');
    console.log('   - Name (Title)');
    console.log('   - Email');
    console.log('   - Phone');
    console.log('   - Instagram');
    console.log('   - Why Join');
    console.log('   - Founder Number');
    console.log('   - Joined Date');
    console.log('   - Status (pending/active/inactive)');
    console.log('   - Investment Paid');
    console.log('\n✨ THE FORGE Database ready to use!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure the integration is connected to this database');
    console.error('2. Go to your database → ... → Add connections → Select your integration');
    console.error('3. Check that NOTION_API_KEY and NOTION_DATABASE_ID are correct in .env.local');
  }
}

setupNotionDatabase();
