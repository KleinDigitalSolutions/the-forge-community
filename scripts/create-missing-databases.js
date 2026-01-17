const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const parentPageId = process.env.NOTION_PARENT_PAGE_ID;

async function createDatabase(title, properties) {
  try {
    console.log(`Creating ${title}...`);
    const database = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      title: [
        {
          type: 'text',
          text: {
            content: `THE FORGE - ${title}`,
          },
        },
      ],
      properties,
    });
    console.log(`✅ Created ${title} (ID: ${database.id})`);
    return database.id;
  } catch (error) {
    console.error(`❌ Error creating ${title}:`, error.message);
    return null;
  }
}

async function createAll() {
  if (!parentPageId) {
    console.error('NOTION_PARENT_PAGE_ID missing');
    return;
  }

  // Announcements
  const announcementsId = await createDatabase('Announcements', {
    Titel: { title: {} },
    Inhalt: { rich_text: {} },
    Kategorie: {
      select: {
        options: [
          { name: 'Milestone', color: 'blue' },
          { name: 'Deadline', color: 'red' },
          { name: 'General', color: 'gray' },
        ],
      },
    },
    Priorität: {
      select: {
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'gray' },
        ],
      },
    },
    Veröffentlichungsdatum: { date: {} },
    Autor: { rich_text: {} },
  });

  // Tasks
  const tasksId = await createDatabase('Tasks', {
    Task: { title: {} },
    Description: { rich_text: {} },
    'Assigned To': { rich_text: {} },
    Status: {
      select: {
        options: [
          { name: 'To Do', color: 'gray' },
          { name: 'In Progress', color: 'blue' },
          { name: 'Done', color: 'green' },
        ],
      },
    },
    Priority: {
      select: {
        options: [
          { name: 'High', color: 'red' },
          { name: 'Medium', color: 'yellow' },
          { name: 'Low', color: 'gray' },
        ],
      },
    },
    'Due Date': { date: {} },
    Category: {
      select: {
        options: [
          { name: 'Legal', color: 'red' },
          { name: 'WMS', color: 'blue' },
          { name: 'Marketing', color: 'pink' },
          { name: 'Operations', color: 'orange' },
        ],
      },
    },
  });

  // Documents
  const documentsId = await createDatabase('Documents', {
    Name: { title: {} },
    Description: { rich_text: {} },
    Category: {
      select: {
        options: [
          { name: 'Contract', color: 'red' },
          { name: 'Guide', color: 'blue' },
          { name: 'Template', color: 'green' },
          { name: 'Process', color: 'orange' },
        ],
      },
    },
    URL: { url: {} },
    'Upload Date': { date: {} },
    'Access Level': {
      select: {
        options: [
          { name: 'All Founders', color: 'green' },
          { name: 'Core Team', color: 'red' },
        ],
      },
    },
  });

  // Events
  const eventsId = await createDatabase('Events', {
    'Event Name': { title: {} },
    Description: { rich_text: {} },
    Date: { date: {} },
    Type: {
      select: {
        options: [
          { name: 'Call', color: 'blue' },
          { name: 'Deadline', color: 'red' },
          { name: 'Launch', color: 'green' },
          { name: 'Meeting', color: 'yellow' },
        ],
      },
    },
    'Location/Link': { url: {} },
  });

  console.log('\nCopy these to your .env.local:');
  if (announcementsId) console.log(`NOTION_ANNOUNCEMENTS_DATABASE_ID=${announcementsId}`);
  if (tasksId) console.log(`NOTION_TASKS_DATABASE_ID=${tasksId}`);
  if (documentsId) console.log(`NOTION_DOCUMENTS_DATABASE_ID=${documentsId}`);
  if (eventsId) console.log(`NOTION_EVENTS_DATABASE_ID=${eventsId}`);
}

createAll();
