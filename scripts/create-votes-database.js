const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const foundersDatabaseId = process.env.NOTION_DATABASE_ID;
const parentPageOverride = process.env.NOTION_PARENT_PAGE_ID;

async function resolveParentPageId() {
  if (parentPageOverride) {
    return parentPageOverride;
  }

  if (!foundersDatabaseId) {
    throw new Error('NOTION_DATABASE_ID not set. Provide NOTION_PARENT_PAGE_ID.');
  }

  const database = await notion.databases.retrieve({ database_id: foundersDatabaseId });
  if (database.parent?.type === 'page_id') {
    return database.parent.page_id;
  }

  throw new Error('NOTION_PARENT_PAGE_ID required. Use a page id to create databases.');
}

async function createVotesDatabase() {
  console.log('Creating THE FORGE - Votes Database...\n');

  try {
    const parentPageId = await resolveParentPageId();
    const properties = {
      Name: { title: {} },
      Description: { rich_text: {} },
      Votes: { number: { format: 'number' } },
      Status: {
        select: {
          options: [
            { name: 'active', color: 'green' },
            { name: 'closed', color: 'yellow' },
            { name: 'winner', color: 'blue' },
          ],
        },
      },
      Metrics: { rich_text: {} },
      Highlights: { rich_text: {} },
      Timeline: { rich_text: {} },
      'Start Date': { date: {} },
      'End Date': { date: {} },
    };

    const database = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'THE FORGE - Votes',
          },
        },
      ],
      properties,
    });

    await fetch(`https://api.notion.com/v1/databases/${database.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });

    console.log('Votes database created!');
    console.log(`\nDatabase ID: ${database.id}`);
    console.log('\nAdd to your .env.local:');
    console.log(`NOTION_VOTES_DATABASE_ID=${database.id}`);
    console.log(`\nView in Notion: https://notion.so/${database.id.replace(/-/g, '')}`);
    console.log('\nAll done!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nMake sure the integration has access to the parent page.');
  }
}

createVotesDatabase();
