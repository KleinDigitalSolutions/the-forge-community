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

async function createTransactionsDatabase() {
  console.log('Creating THE FORGE - Transactions Database...\n');

  try {
    const parentPageId = await resolveParentPageId();
    const properties = {
      Description: {
        title: {},
      },
      Amount: {
        number: {
          format: 'euro',
        },
      },
      Category: {
        select: {
          options: [
            { name: 'Supplier', color: 'blue' },
            { name: 'Marketing', color: 'green' },
            { name: 'Legal', color: 'purple' },
            { name: 'Operations', color: 'orange' },
            { name: 'Investment', color: 'pink' },
            { name: 'Membership Fee', color: 'yellow' },
            { name: 'Service Fee', color: 'gray' },
            { name: 'Platform Fee', color: 'brown' },
            { name: 'Other', color: 'gray' },
          ],
        },
      },
      Type: {
        select: {
          options: [
            { name: 'Income', color: 'green' },
            { name: 'Expense', color: 'red' },
          ],
        },
      },
      Date: {
        date: {},
      },
      Status: {
        select: {
          options: [
            { name: 'Pending', color: 'yellow' },
            { name: 'Completed', color: 'green' },
            { name: 'Cancelled', color: 'red' },
          ],
        },
      },
      'Receipt URL': {
        url: {},
      },
      Notes: {
        rich_text: {},
      },
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
            content: 'THE FORGE - Transactions',
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

    console.log('Transactions database created!');
    console.log(`\nDatabase ID: ${database.id}`);
    console.log('\nAdd to your .env.local:');
    console.log(`NOTION_TRANSACTIONS_DATABASE_ID=${database.id}`);
    console.log(`\nView in Notion: https://notion.so/${database.id.replace(/-/g, '')}`);
    console.log('\nAll done!');
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nMake sure the integration has access to the parent page.');
  }
}

createTransactionsDatabase();
