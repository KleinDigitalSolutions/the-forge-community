const databases = [
  { name: 'Announcements', id: '2ea69398-3794-8043-9fc0-e5817a7439b7' },
  { name: 'Tasks', id: '2ea69398-3794-8029-9e62-f76b588f1578' },
  { name: 'Documents', id: '2ea69398-3794-80dc-91a0-c07eb49e7952' },
  { name: 'Events', id: '2ea69398-3794-805c-a887-d4647cf7a3ea' },
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
