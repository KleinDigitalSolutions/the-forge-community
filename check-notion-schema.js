require('dotenv').config({ path: '.env.local' });

const databases = [
  { name: 'Founders', id: process.env.NOTION_DATABASE_ID },
  { name: 'Forum', id: process.env.NOTION_FORUM_DATABASE_ID },
  { name: 'Announcements', id: process.env.NOTION_ANNOUNCEMENTS_DATABASE_ID },
  { name: 'Tasks', id: process.env.NOTION_TASKS_DATABASE_ID },
  { name: 'Documents', id: process.env.NOTION_DOCUMENTS_DATABASE_ID },
  { name: 'Events', id: process.env.NOTION_EVENTS_DATABASE_ID },
  { name: 'Votes', id: process.env.NOTION_VOTES_DATABASE_ID },
  { name: 'Transactions', id: process.env.NOTION_TRANSACTIONS_DATABASE_ID },
];

async function checkSchema() {
  const apiKey = process.env.NOTION_API_KEY;

  for (const db of databases) {
    console.log(`\n=== ${db.name} ===`);
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${db.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`Error: ${data.message}`);
        continue;
      }

      console.log('Properties:');
      Object.keys(data.properties).forEach(key => {
        const prop = data.properties[key];
        console.log(`  - ${key} (${prop.type})`);
      });
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

checkSchema();
