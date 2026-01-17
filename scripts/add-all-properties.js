const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Database IDs
const databases = {
  founders: process.env.NOTION_DATABASE_ID,
  forum: process.env.NOTION_FORUM_DATABASE_ID,
  votes: process.env.NOTION_VOTES_DATABASE_ID,
  transactions: process.env.NOTION_TRANSACTIONS_DATABASE_ID,
  announcements: process.env.NOTION_ANNOUNCEMENTS_DATABASE_ID,
  tasks: process.env.NOTION_TASKS_DATABASE_ID,
  documents: process.env.NOTION_DOCUMENTS_DATABASE_ID,
  events: process.env.NOTION_EVENTS_DATABASE_ID,
  groups: process.env.NOTION_GROUPS_DATABASE_ID,
};

// Property schemas for each database
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

async function addPropertiesToDatabase(dbName, dbId, properties) {
  if (!dbId) {
    console.log(`❌ ${dbName}: No database ID found in .env.local`);
    return false;
  }

  try {
    console.log(`\n🔧 Adding properties to ${dbName}...`);

    // Try to update the database with new properties
    const response = await notion.databases.update({
      database_id: dbId,
      properties: properties,
    });

    console.log(`✅ ${dbName}: Successfully added ${Object.keys(properties).length} properties`);
    return true;
  } catch (error) {
    console.log(`❌ ${dbName}: Failed - ${error.message}`);

    // Try alternative approach: use fetch API directly
    try {
      console.log(`   🔄 Trying alternative method for ${dbName}...`);

      const fetchResponse = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      if (fetchResponse.ok) {
        console.log(`✅ ${dbName}: Successfully added properties (via fetch)`);
        return true;
      } else {
        const errorData = await fetchResponse.json();
        console.log(`❌ ${dbName}: Fetch also failed - ${errorData.message}`);
        return false;
      }
    } catch (fetchError) {
      console.log(`❌ ${dbName}: Both methods failed`);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Starting property addition for all databases...\n');
  console.log('⏳ This may take a minute...\n');

  const results = {};

  // Add properties to each database
  results.founders = await addPropertiesToDatabase('Founders', databases.founders, propertySchemas.founders);
  results.forum = await addPropertiesToDatabase('Forum', databases.forum, propertySchemas.forum);
  results.votes = await addPropertiesToDatabase('Votes', databases.votes, propertySchemas.votes);
  results.transactions = await addPropertiesToDatabase('Transactions', databases.transactions, propertySchemas.transactions);
  results.announcements = await addPropertiesToDatabase('Announcements', databases.announcements, propertySchemas.announcements);
  results.tasks = await addPropertiesToDatabase('Tasks', databases.tasks, propertySchemas.tasks);
  results.documents = await addPropertiesToDatabase('Documents', databases.documents, propertySchemas.documents);
  results.events = await addPropertiesToDatabase('Events', databases.events, propertySchemas.events);
  results.groups = await addPropertiesToDatabase('Groups', databases.groups, propertySchemas.groups);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(60));

  const successful = Object.entries(results).filter(([_, success]) => success).length;
  const failed = Object.entries(results).filter(([_, success]) => !success).length;

  console.log(`✅ Successful: ${successful}/${Object.keys(results).length}`);
  console.log(`❌ Failed: ${failed}/${Object.keys(results).length}`);

  if (successful > 0) {
    console.log('\n🎯 Next step: Run verification script to check properties:');
    console.log('   node scripts/test-all-databases.js');
  }

  if (successful === Object.keys(results).length) {
    console.log('\n🎉 ALL PROPERTIES ADDED! You can now create Squad Alpha:');
    console.log('   node scripts/seed-squad-alpha.js');
  } else {
    console.log('\n⚠️  Some databases failed. You may need to add properties manually in Notion.');
    console.log('   See: NOTION-SETUP-COMPLETE-GUIDE.md for manual instructions');
  }
}

main();
