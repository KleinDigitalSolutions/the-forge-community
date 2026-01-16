const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const foundersDatabaseId = process.env.NOTION_DATABASE_ID;
const transactionsDatabaseId = process.env.NOTION_TRANSACTIONS_DATABASE_ID;

if (!foundersDatabaseId || !transactionsDatabaseId) {
  console.error('Missing NOTION_DATABASE_ID or NOTION_TRANSACTIONS_DATABASE_ID');
  process.exit(1);
}

const parseArg = (prefix) => {
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
};

const monthArg = parseArg('--month=');
const amountArg = parseArg('--amount=');
const feeAmount = Number(amountArg || '99');

const now = new Date();
const [year, month] = monthArg ? monthArg.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];

if (!year || !month || month < 1 || month > 12) {
  console.error('Invalid month. Use --month=YYYY-MM');
  process.exit(1);
}

if (!Number.isFinite(feeAmount) || feeAmount <= 0) {
  console.error('Invalid amount. Use --amount=99');
  process.exit(1);
}

const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
const monthEndDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
const monthEnd = monthEndDate.toISOString();
const monthLabel = `${year}-${String(month).padStart(2, '0')}`;

async function fetchActiveFounders() {
  const results = [];
  let cursor = undefined;

  while (true) {
    const response = await notion.databases.query({
      database_id: foundersDatabaseId,
      start_cursor: cursor,
      filter: {
        property: 'Status',
        select: {
          equals: 'active',
        },
      },
      sorts: [
        {
          property: 'Founder Number',
          direction: 'ascending',
        },
      ],
    });

    results.push(...response.results);
    if (!response.has_more) {
      break;
    }
    cursor = response.next_cursor;
  }

  return results.map((page) => ({
    id: page.id,
    name: page.properties?.Name?.title?.[0]?.plain_text || '',
    founderNumber: page.properties?.['Founder Number']?.number || 0,
    email: page.properties?.Email?.email || '',
  }));
}

async function fetchExistingMembershipFees() {
  const results = [];
  let cursor = undefined;

  while (true) {
    const response = await notion.databases.query({
      database_id: transactionsDatabaseId,
      start_cursor: cursor,
      filter: {
        and: [
          {
            property: 'Category',
            select: {
              equals: 'Membership Fee',
            },
          },
          {
            property: 'Date',
            date: {
              on_or_after: monthStart,
            },
          },
          {
            property: 'Date',
            date: {
              on_or_before: monthEnd,
            },
          },
        ],
      },
    });

    results.push(...response.results);
    if (!response.has_more) {
      break;
    }
    cursor = response.next_cursor;
  }

  const existingKeys = new Set();
  results.forEach((page) => {
    const title = page.properties?.Description?.title?.[0]?.plain_text || '';
    if (title) {
      existingKeys.add(title);
    }
  });

  return existingKeys;
}

async function createMembershipFee(founder) {
  const description = `Membership Fee - Founder #${founder.founderNumber} - ${monthLabel}`;
  await notion.pages.create({
    parent: {
      database_id: transactionsDatabaseId,
    },
    properties: {
      Description: {
        title: [
          {
            text: {
              content: description,
            },
          },
        ],
      },
      Amount: {
        number: feeAmount,
      },
      Category: {
        select: {
          name: 'Membership Fee',
        },
      },
      Type: {
        select: {
          name: 'Income',
        },
      },
      Date: {
        date: {
          start: monthStart,
        },
      },
      Status: {
        select: {
          name: 'Pending',
        },
      },
      Notes: {
        rich_text: [
          {
            text: {
              content: `Auto-generated monthly membership fee for ${founder.name || 'Founder'} (${founder.email || 'no email'})`,
            },
          },
        ],
      },
    },
  });
}

async function run() {
  console.log(`Generating membership fees for ${monthLabel}...`);
  const founders = await fetchActiveFounders();
  const existing = await fetchExistingMembershipFees();

  if (!founders.length) {
    console.log('No active founders found.');
    return;
  }

  let created = 0;
  for (const founder of founders) {
    if (!founder.founderNumber) {
      continue;
    }
    const description = `Membership Fee - Founder #${founder.founderNumber} - ${monthLabel}`;
    if (existing.has(description)) {
      continue;
    }
    await createMembershipFee(founder);
    created += 1;
  }

  console.log(`Done. Created ${created} membership fee entries.`);
}

run().catch((error) => {
  console.error('Error generating membership fees:', error.message || error);
  process.exit(1);
});
