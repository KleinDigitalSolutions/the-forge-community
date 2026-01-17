const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Source Database IDs (extracted from previous test)
const sourceDatabases = {
  founders: '2ea69398-3794-8026-abfa-000b6a12fe56',
  forum: '84341fce-903b-4b1d-940c-0b8980d759f1',
  votes: '9fc5c6f9-c71a-4676-b2e1-f59776946a5b',
  transactions: '8fd9c0ae-cfee-4c6a-8a6a-e449f7d82bd2',
  announcements: '08533b98-1c5a-46ca-870a-77a0dd83a144',
  tasks: 'a5dbd413-2f8f-49e2-94d8-ad1ec696bd75',
  documents: 'fdbf837c-36be-4428-b066-41c2f3205f18',
  events: 'bfed5b2b-9fd2-4cb8-9a32-86bd0188be05',
  groups: 'c74f3f89-962a-467b-945e-a9c518d783ce',
};

// Property schemas (same as before)
const propertySchemas = {
  founders: {
    'Email': { email: {} },
    'Phone': { phone_number: {} },
    'Instagram': { rich_text: {} },
    'Why Join': { rich_text: {} },
    'Founder Number': { number: {} },
    'Joined Date': { date: {} },
    'Status': {
      select: {
        options: [
          { name: 'pending', color: 'yellow' },
          { name: 'active', color: 'green' },
          { name: 'inactive', color: 'gray' },
        ],
      },
    },
    'Investment Paid': { checkbox: {} },
    'Role': {
      select: {
        options: [
          { name: 'Investor', color: 'blue' },
          { name: 'Builder', color: 'purple' },
        ],
      },
    },
    'Capital': { rich_text: {} },
    'Skill': { rich_text: {} },
  },

  forum: {
    'Content': { rich_text: {} },
    'Author': { rich_text: {} },
    'Founder Number': { number: {} },
    'Category': {
      select: {
        options: [
          { name: 'General', color: 'blue' },
          { name: 'Ideas', color: 'purple' },
          { name: 'Support', color: 'orange' },
        ],
      },
    },
    'Likes': { number: {} },
  },

  votes: {
    'Description': { rich_text: {} },
    'Votes': { number: {} },
    'Status': {
      select: {
        options: [
          { name: 'active', color: 'green' },
          { name: 'closed', color: 'gray' },
          { name: 'winner', color: 'yellow' },
        ],
      },
    },
    'Metrics': { rich_text: {} },
    'Highlights': { rich_text: {} },
    'Timeline': { rich_text: {} },
    'Start Date': { date: {} },
    'End Date': { date: {} },
  },

  transactions: {
    'Amount': { number: {} },
    'Category': {
      select: {
        options: [
          { name: 'Supplier', color: 'blue' },
          { name: 'Marketing', color: 'purple' },
          { name: 'Legal', color: 'red' },
          { name: 'Operations', color: 'green' },
          { name: 'Investment', color: 'yellow' },
        ],
      },
    },
    'Type': {
      select: {
        options: [
          { name: 'Income', color: 'green' },
          { name: 'Expense', color: 'red' },
        ],
      },
    },
    'Date': { date: {} },
    'Status': {
      select: {
        options: [
          { name: 'Pending', color: 'yellow' },
          { name: 'Completed', color: 'green' },
          { name: 'Cancelled', color: 'red' },
        ],
      },
    },
    'Receipt URL': { url: {} },
    'Notes': { rich_text: {} },
  },

  announcements: {
    'Inhalt': { rich_text: {} },
    'Kategorie': {
      select: {
        options: [
          { name: 'Milestone', color: 'green' },
          { name: 'Deadline', color: 'red' },
          { name: 'General', color: 'blue' },
        ],
      },
    },
    'Priorität': {
      select: {
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'gray' },
        ],
      },
    },
    'Veröffentlichungsdatum': { date: {} },
    'Autor': { rich_text: {} },
  },

  tasks: {
    'Description': { rich_text: {} },
    'Assigned To': { rich_text: {} },
    'Status': {
      select: {
        options: [
          { name: 'To Do', color: 'red' },
          { name: 'In Progress', color: 'yellow' },
          { name: 'Done', color: 'green' },
        ],
      },
    },
    'Priority': {
      select: {
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'gray' },
        ],
      },
    },
    'Due Date': { date: {} },
    'Category': {
      select: {
        options: [
          { name: 'Legal', color: 'red' },
          { name: 'WMS', color: 'blue' },
          { name: 'Marketing', color: 'purple' },
          { name: 'Operations', color: 'green' },
        ],
      },
    },
  },

  documents: {
    'Description': { rich_text: {} },
    'Category': {
      select: {
        options: [
          { name: 'Contract', color: 'red' },
          { name: 'Guide', color: 'blue' },
          { name: 'Template', color: 'purple' },
          { name: 'Process', color: 'green' },
        ],
      },
    },
    'URL': { url: {} },
    'Upload Date': { date: {} },
    'Access Level': {
      select: {
        options: [
          { name: 'All Founders', color: 'green' },
          { name: 'Core Team', color: 'red' },
        ],
      },
    },
  },

  events: {
    'Description': { rich_text: {} },
    'Date': { date: {} },
    'Type': {
      select: {
        options: [
          { name: 'Call', color: 'blue' },
          { name: 'Deadline', color: 'red' },
          { name: 'Launch', color: 'green' },
          { name: 'Meeting', color: 'purple' },
        ],
      },
    },
    'Location/Link': { url: {} },
  },

  groups: {
    'Target Capital': {
      select: {
        options: [
          { name: '25k', color: 'blue' },
          { name: '50k', color: 'purple' },
          { name: '100k', color: 'red' },
        ],
      },
    },
    'Status': {
      select: {
        options: [
          { name: 'Recruiting', color: 'yellow' },
          { name: 'Building', color: 'blue' },
          { name: 'Live', color: 'green' },
          { name: 'Exit', color: 'gray' },
        ],
      },
    },
    'Max Founders': { number: {} },
    'Start Date': { date: {} },
  },
};

async function addPropertiesToSource(dbName, sourceId, properties) {
  console.log(`\n🔧 Trying to add properties to ${dbName} Source Database...`);
  console.log(`   Source ID: ${sourceId}`);

  try {
    // Method 1: Try Notion SDK
    const response = await notion.databases.update({
      database_id: sourceId,
      properties: properties,
    });

    console.log(`✅ ${dbName}: Successfully added ${Object.keys(properties).length} properties via SDK!`);
    return true;
  } catch (sdkError) {
    console.log(`   ❌ SDK failed: ${sdkError.message}`);

    // Method 2: Try fetch API
    try {
      console.log(`   🔄 Trying fetch API...`);

      const fetchResponse = await fetch(`https://api.notion.com/v1/databases/${sourceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      if (fetchResponse.ok) {
        console.log(`✅ ${dbName}: Successfully added properties via fetch!`);
        return true;
      } else {
        const errorData = await fetchResponse.json();
        console.log(`   ❌ Fetch also failed: ${errorData.message || errorData.code}`);
        return false;
      }
    } catch (fetchError) {
      console.log(`   ❌ Fetch error: ${fetchError.message}`);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Attempting to add properties to SOURCE databases...\n');
  console.log('⚠️  This tries to update the hidden Source DBs, not the Linked Views\n');

  const results = {};

  // Try each database
  results.founders = await addPropertiesToSource('Founders', sourceDatabases.founders, propertySchemas.founders);
  results.forum = await addPropertiesToSource('Forum', sourceDatabases.forum, propertySchemas.forum);
  results.votes = await addPropertiesToSource('Votes', sourceDatabases.votes, propertySchemas.votes);
  results.transactions = await addPropertiesToSource('Transactions', sourceDatabases.transactions, propertySchemas.transactions);
  results.announcements = await addPropertiesToSource('Announcements', sourceDatabases.announcements, propertySchemas.announcements);
  results.tasks = await addPropertiesToSource('Tasks', sourceDatabases.tasks, propertySchemas.tasks);
  results.documents = await addPropertiesToSource('Documents', sourceDatabases.documents, propertySchemas.documents);
  results.events = await addPropertiesToSource('Events', sourceDatabases.events, propertySchemas.events);
  results.groups = await addPropertiesToSource('Groups', sourceDatabases.groups, propertySchemas.groups);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(60));

  const successful = Object.entries(results).filter(([_, success]) => success).length;
  const failed = Object.entries(results).filter(([_, success]) => !success).length;

  console.log(`✅ Successful: ${successful}/${Object.keys(results).length}`);
  console.log(`❌ Failed: ${failed}/${Object.keys(results).length}`);

  if (successful > 0) {
    console.log('\n🎯 Testing if properties were actually added...');
    console.log('   node scripts/test-all-databases.js');
  } else {
    console.log('\n❌ Unfortunately, the API does not allow updating Source databases.');
    console.log('   You will need to add properties manually in Notion.');
    console.log('   See: NOTION-SETUP-COMPLETE-GUIDE.md');
  }
}

main();
