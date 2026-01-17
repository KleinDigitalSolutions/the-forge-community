import { Client } from '@notionhq/client';

const apiKey = process.env.NOTION_API_KEY;
if (!apiKey) {
  console.warn("WARNUNG: NOTION_API_KEY fehlt in den Environment Variables. Notion-Funktionen werden fehlschlagen.");
}

const notion = new Client({
  auth: apiKey || 'dummy-key-to-prevent-crash',
});

const databaseId = process.env.NOTION_DATABASE_ID || '';

type NotionSource = {
  type: 'database' | 'data_source';
  properties: Set<string>;
};

const sourceCache = new Map<string, NotionSource>();

async function resolveNotionSource(id: string): Promise<NotionSource> {
  const cached = sourceCache.get(id);
  if (cached) {
    return cached;
  }

  if (!id) {
    throw new Error('NOTION_DATABASE_ID not set');
  }

  try {
    const dataSource = await (notion as any).dataSources.retrieve({ data_source_id: id });
    if (dataSource && 'properties' in dataSource) {
      const resolved: NotionSource = {
        type: 'data_source',
        properties: new Set(Object.keys(dataSource.properties || {})),
      };
      sourceCache.set(id, resolved);
      return resolved;
    }
  } catch (error) {
    console.warn('Data source lookup failed, falling back to database ID.', error);
  }

  const database = await notion.databases.retrieve({ database_id: id });
  if (!('properties' in database)) {
    throw new Error('Database properties not found (partial response)');
  }
  const resolved: NotionSource = {
    type: 'database',
    properties: new Set(Object.keys(database.properties || {})),
  };
  sourceCache.set(id, resolved);
  return resolved;
}

function selectPropertyName(available: Set<string>, candidates: string[]): string | null {
  return candidates.find((name) => available.has(name)) || null;
}

export interface Founder {
  id: string;
  name: string;
  email: string;
  founderNumber: number;
  joinedDate: string;
  status: 'pending' | 'active' | 'inactive';
  investmentPaid: boolean;
  groupId?: string;
  groupName?: string;
}

export async function getFounders(): Promise<Founder[]> {
  try {
    const source = await resolveNotionSource(databaseId);
    const query = {
      sorts: [
        {
          property: 'Founder Number',
          direction: 'ascending' as const,
        },
      ],
    };
    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: databaseId, ...query })
        : await (notion as any).databases.query({ database_id: databaseId, ...query });

    return data.results.map((page: {
      id: string;
      properties: {
        Name: { title: { plain_text: string }[] };
        Email: { email: string };
        'Founder Number': { number: number };
        'Joined Date': { date: { start: string } };
        Status: { select: { name: 'pending' | 'active' | 'inactive' } };
        'Investment Paid': { checkbox: boolean };
        Group?: { relation: { id: string }[] }; 
      };
    }) => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || '',
      email: page.properties.Email?.email || '',
      founderNumber: page.properties['Founder Number']?.number || 0,
      joinedDate: page.properties['Joined Date']?.date?.start || '',
      status: page.properties.Status?.select?.name || 'pending',
      investmentPaid: page.properties['Investment Paid']?.checkbox || false,
      groupId: page.properties.Group?.relation?.[0]?.id || undefined,
    }));
  } catch (error) {
    console.error('Error fetching founders:', error);
    return [];
  }
}

export async function getFounderByEmail(email: string): Promise<Founder | null> {
  try {
    const source = await resolveNotionSource(databaseId);
    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({
            data_source_id: databaseId,
            filter: {
              property: 'Email',
              email: {
                equals: email,
              },
            },
          })
        : await (notion as any).databases.query({
            database_id: databaseId,
            filter: {
              property: 'Email',
              email: {
                equals: email,
              },
            },
          });

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const page = data.results[0] as any;
    
    // Fetch group details if a relation exists
    let groupName = undefined;
    const groupId = page.properties.Group?.relation?.[0]?.id;
    
    if (groupId) {
        try {
            const groupPage = await notion.pages.retrieve({ page_id: groupId });
            groupName = (groupPage as any).properties?.Name?.title?.[0]?.plain_text;
        } catch (e) {
            console.error('Error fetching group details:', e);
        }
    }

    return {
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || '',
      email: page.properties.Email?.email || '',
      founderNumber: page.properties['Founder Number']?.number || 0,
      joinedDate: page.properties['Joined Date']?.date?.start || '',
      status: page.properties.Status?.select?.name || 'pending',
      investmentPaid: page.properties['Investment Paid']?.checkbox || false,
      groupId,
      groupName
    };
  } catch (error) {
    console.error('Error fetching founder by email:', error);
    return null;
  }
}

export async function addFounder(data: {
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  why?: string;
  role?: 'investor' | 'builder';
  capital?: string;
  skill?: string;
}): Promise<any> {
  try {
    const founders = await getFounders();
    const nextFounderNumber = founders.length + 1;

    const source = await resolveNotionSource(databaseId);
    const phoneProperty = selectPropertyName(source.properties, ['Phone', 'Telefon']);
    const instagramProperty = selectPropertyName(source.properties, ['Instagram', 'Instagram Handle']);
    const whyProperty = selectPropertyName(source.properties, ['Why Join', 'Why do you want to join?']);
    const roleProperty = selectPropertyName(source.properties, ['Role', 'Rolle']);
    const capitalProperty = selectPropertyName(source.properties, ['Capital', 'Kapital']);
    const skillProperty = selectPropertyName(source.properties, ['Skill', 'Skills']);
    const parent =
      source.type === 'data_source'
        ? { data_source_id: databaseId }
        : { database_id: databaseId };

    const properties: Record<string, any> = {
      Name: {
        title: [
          {
            text: {
              content: data.name,
            },
          },
        ],
      },
      Email: {
        email: data.email,
      },
      'Founder Number': {
        number: nextFounderNumber,
      },
      'Joined Date': {
        date: {
          start: new Date().toISOString(),
        },
      },
      Status: {
        select: {
          name: 'pending',
        },
      },
      'Investment Paid': {
        checkbox: false,
      },
    };

    if (phoneProperty) {
      properties[phoneProperty] = {
        phone_number: data.phone || '',
      };
    }

    if (instagramProperty) {
      properties[instagramProperty] = {
        rich_text: [
          {
            text: {
              content: data.instagram || '',
            },
          },
        ],
      };
    }

    if (whyProperty) {
      properties[whyProperty] = {
        rich_text: [
          {
            text: {
              content: data.why || '',
            },
          },
        ],
      };
    }

    if (roleProperty && data.role) {
      properties[roleProperty] = {
        select: {
          name: data.role === 'investor' ? 'Investor' : 'Builder',
        },
      };
    }

    if (capitalProperty && data.capital) {
      properties[capitalProperty] = {
        rich_text: [
          {
            text: {
              content: data.capital,
            },
          },
        ],
      };
    }

    if (skillProperty && data.skill) {
      properties[skillProperty] = {
        rich_text: [
          {
            text: {
              content: data.skill,
            },
          },
        ],
      };
    }

    const response = await notion.pages.create({
      parent,
      properties,
    });

    return response;
  } catch (error) {
    console.error('Error adding founder:', error);
    throw error;
  }
}

export async function updateFounderStatus(
  id: string, 
  status: 'pending' | 'active' | 'inactive',
  plan?: string
): Promise<any> {
  try {
    const source = await resolveNotionSource(databaseId);
    const properties: any = {
      Status: {
        select: {
          name: status,
        },
      },
    };

    if (plan && source.properties.has('Plan')) {
      properties['Plan'] = {
        select: {
          name: plan.charAt(0).toUpperCase() + plan.slice(1), // Capitalize (starter -> Starter)
        },
      };
    }

    const response = await notion.pages.update({
      page_id: id,
      properties: properties,
    });
    return response;
  } catch (error) {
    console.error('Error updating founder status:', error);
    throw error;
  }
}

export interface Vote {
  id: string;
  name: string;
  description: string;
  votes: number;
  status: 'active' | 'closed' | 'winner';
  createdDate: string;
  metrics: { label: string; value: string }[];
  highlights: string[];
  timeline: string[];
  startDate?: string;
  endDate?: string;
}

const votesDatabaseId = process.env.NOTION_VOTES_DATABASE_ID || '';

function getRichTextValue(property: any): string {
  return property?.rich_text?.map((item: any) => item.plain_text).join('') || '';
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map(line => line.replace(/^[\s•-]+/, '').trim())
    .filter(Boolean);
}

function parseMetrics(value: string): { label: string; value: string }[] {
  return splitLines(value).map(line => {
    const [label, ...rest] = line.split(':');
    if (!rest.length) {
      return { label: line, value: '' };
    }
    return {
      label: label.trim(),
      value: rest.join(':').trim(),
    };
  });
}

export async function getVotes(): Promise<Vote[]> {
  try {
    if (!votesDatabaseId) {
      console.error('NOTION_VOTES_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${votesDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Votes',
            direction: 'descending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => {
      const metricsRaw = getRichTextValue(page.properties.Metrics);
      const highlightsRaw = getRichTextValue(page.properties.Highlights);
      const timelineRaw = getRichTextValue(page.properties.Timeline);

      return {
        id: page.id,
        name: page.properties.Name?.title?.[0]?.plain_text || '',
        description: getRichTextValue(page.properties.Description),
        votes: page.properties.Votes?.number || 0,
        status: page.properties.Status?.select?.name || 'active',
        createdDate: page.created_time || '',
        metrics: parseMetrics(metricsRaw),
        highlights: splitLines(highlightsRaw),
        timeline: splitLines(timelineRaw),
        startDate: page.properties['Start Date']?.date?.start || '',
        endDate: page.properties['End Date']?.date?.start || '',
      };
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return [];
  }
}

export async function updateVoteCount(id: string, delta: number): Promise<number> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const currentVotes = (page as any).properties?.Votes?.number || 0;
    const nextVotes = Math.max(0, currentVotes + delta);

    await notion.pages.update({
      page_id: id,
      properties: {
        Votes: {
          number: nextVotes,
        },
      },
    });

    return nextVotes;
  } catch (error) {
    console.error('Error updating vote count:', error);
    throw error;
  }
}

// ========================================
// TRANSACTIONS
// ========================================

const transactionsDatabaseId = process.env.NOTION_TRANSACTIONS_DATABASE_ID || '';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category:
    | 'Supplier'
    | 'Marketing'
    | 'Legal'
    | 'Operations'
    | 'Investment'
    | 'Membership Fee'
    | 'Service Fee'
    | 'Platform Fee'
    | 'Other';
  type: 'Income' | 'Expense';
  date: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  receiptUrl?: string;
  notes?: string;
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    if (!transactionsDatabaseId) {
      console.error('NOTION_TRANSACTIONS_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${transactionsDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => ({
      id: page.id,
      description: page.properties.Description?.title?.[0]?.plain_text || '',
      amount: page.properties.Amount?.number || 0,
      category: page.properties.Category?.select?.name || 'Other',
      type: page.properties.Type?.select?.name || 'Expense',
      date: page.properties.Date?.date?.start || '',
      status: page.properties.Status?.select?.name || 'Pending',
      receiptUrl: page.properties['Receipt URL']?.url || '',
      notes: page.properties.Notes?.rich_text?.[0]?.plain_text || '',
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function addTransaction(data: {
  description: string;
  amount: number;
  category: Transaction['category'];
  type: Transaction['type'];
  date: string;
  status?: Transaction['status'];
  receiptUrl?: string;
  notes?: string;
}): Promise<any> {
  try {
    if (!transactionsDatabaseId) {
      throw new Error('NOTION_TRANSACTIONS_DATABASE_ID not set');
    }

    const response = await notion.pages.create({
      parent: {
        database_id: transactionsDatabaseId,
      },
      properties: {
        Description: {
          title: [
            {
              text: {
                content: data.description,
              },
            },
          ],
        },
        Amount: {
          number: data.amount,
        },
        Category: {
          select: {
            name: data.category,
          },
        },
        Type: {
          select: {
            name: data.type,
          },
        },
        Date: {
          date: {
            start: data.date,
          },
        },
        Status: {
          select: {
            name: data.status || 'Pending',
          },
        },
        ...(data.receiptUrl && {
          'Receipt URL': {
            url: data.receiptUrl,
          },
        }),
        ...(data.notes && {
          Notes: {
            rich_text: [
              {
                text: {
                  content: data.notes,
                },
              },
            ],
          },
        }),
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

export async function getFinancialSummary() {
  try {
    const transactions = await getTransactions();

    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = Math.abs(
      transactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const available = totalIncome - totalExpenses;
    const targetTiers = [25000, 50000, 100000];
    const targetCapital =
      targetTiers.find((tier) => totalIncome <= tier) ?? targetTiers[targetTiers.length - 1];
    const progressPercentage = Math.min((totalIncome / targetCapital) * 100, 100);

    // Group by category
    const expensesByCategory = transactions
      .filter(t => t.type === 'Expense')
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return {
      totalIncome,
      totalExpenses,
      available,
      targetCapital,
      targetTiers,
      progressPercentage,
      expensesByCategory,
      transactionCount: transactions.length,
    };
  } catch (error) {
    console.error('Error calculating financial summary:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      available: 0,
      targetCapital: 25000,
      targetTiers: [25000, 50000, 100000],
      progressPercentage: 0,
      expensesByCategory: {},
      transactionCount: 0,
    };
  }
}

// ========================================
// FORUM
// ========================================

const forumDatabaseId = process.env.NOTION_FORUM_DATABASE_ID || '';

export interface ForumPost {
  id: string;
  author: string;
  founderNumber: number;
  content: string;
  category: string;
  likes: number;
  createdTime: string;
}

export async function getForumPosts(): Promise<ForumPost[]> {
  try {
    if (!forumDatabaseId) {
      console.error('NOTION_FORUM_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${forumDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => ({
      id: page.id,
      author: getRichTextValue(page.properties.Author),
      founderNumber: page.properties['Founder Number']?.number || 0,
      content: getRichTextValue(page.properties.Content),
      category: page.properties.Category?.select?.name || 'General',
      likes: page.properties.Likes?.number || 0,
      createdTime: page.created_time || '',
    }));
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return [];
  }
}

export async function addForumPost(data: {
  author: string;
  founderNumber?: number;
  content: string;
  category: string;
}): Promise<any> {
  try {
    if (!forumDatabaseId) {
      throw new Error('NOTION_FORUM_DATABASE_ID not set');
    }

    const title = data.content.trim().slice(0, 80);

    const response = await notion.pages.create({
      parent: {
        database_id: forumDatabaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: title || 'Forum Post',
              },
            },
          ],
        },
        Content: {
          rich_text: [
            {
              text: {
                content: data.content,
              },
            },
          ],
        },
        Author: {
          rich_text: [
            {
              text: {
                content: data.author,
              },
            },
          ],
        },
        'Founder Number': {
          number: data.founderNumber || 0,
        },
        Category: {
          select: {
            name: data.category,
          },
        },
        Likes: {
          number: 0,
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding forum post:', error);
    throw error;
  }
}

export async function updateForumPostLikes(id: string, delta: number): Promise<number> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const currentLikes = (page as any).properties?.Likes?.number || 0;
    const nextLikes = Math.max(0, currentLikes + delta);

    await notion.pages.update({
      page_id: id,
      properties: {
        Likes: {
          number: nextLikes,
        },
      },
    });

    return nextLikes;
  } catch (error) {
    console.error('Error updating forum likes:', error);
    throw error;
  }
}

// ========================================
// ANNOUNCEMENTS
// ========================================

const announcementsDatabaseId = process.env.NOTION_ANNOUNCEMENTS_DATABASE_ID || '';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'Milestone' | 'Deadline' | 'Decision' | 'General';
  priority: 'High' | 'Medium' | 'Low';
  publishedDate: string;
  author: string;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    if (!announcementsDatabaseId) {
      console.error('NOTION_ANNOUNCEMENTS_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${announcementsDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Veröffentlichungsdatum',
            direction: 'descending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => ({
      id: page.id,
      title: page.properties.Titel?.title?.[0]?.plain_text || '',
      content: getRichTextValue(page.properties.Inhalt),
      category: page.properties.Kategorie?.select?.name || 'General',
      priority: page.properties.Priorität?.select?.name || 'Medium',
      publishedDate: page.properties.Veröffentlichungsdatum?.date?.start || '',
      author: getRichTextValue(page.properties.Autor),
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

export async function addAnnouncement(data: {
  title: string;
  content: string;
  category: Announcement['category'];
  priority: Announcement['priority'];
  author: string;
}): Promise<any> {
  try {
    if (!announcementsDatabaseId) {
      throw new Error('NOTION_ANNOUNCEMENTS_DATABASE_ID not set');
    }

    const response = await notion.pages.create({
      parent: {
        database_id: announcementsDatabaseId,
      },
      properties: {
        Titel: {
          title: [
            {
              text: {
                content: data.title,
              },
            },
          ],
        },
        Inhalt: {
          rich_text: [
            {
              text: {
                content: data.content,
              },
            },
          ],
        },
        Kategorie: {
          select: {
            name: data.category,
          },
        },
        Priorität: {
          select: {
            name: data.priority,
          },
        },
        Veröffentlichungsdatum: {
          date: {
            start: new Date().toISOString(),
          },
        },
        Autor: {
          rich_text: [
            {
              text: {
                content: data.author,
              },
            },
          ],
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding announcement:', error);
    throw error;
  }
}

// ========================================
// TASKS
// ========================================

const tasksDatabaseId = process.env.NOTION_TASKS_DATABASE_ID || '';

export interface Task {
  id: string;
  task: string;
  description: string;
  assignedTo: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  category: 'Legal' | 'WMS' | 'Marketing' | 'Operations';
}

export async function getTasks(): Promise<Task[]> {
  try {
    if (!tasksDatabaseId) {
      console.error('NOTION_TASKS_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${tasksDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Due Date',
            direction: 'ascending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => ({
      id: page.id,
      task: page.properties.Task?.title?.[0]?.plain_text || '',
      description: getRichTextValue(page.properties.Description),
      assignedTo: getRichTextValue(page.properties['Assigned To']),
      status: page.properties.Status?.select?.name || 'To Do',
      priority: page.properties.Priority?.select?.name || 'Medium',
      dueDate: page.properties['Due Date']?.date?.start || '',
      category: page.properties.Category?.select?.name || 'Operations',
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function addTask(data: {
  task: string;
  description: string;
  assignedTo: string;
  status?: Task['status'];
  priority: Task['priority'];
  dueDate: string;
  category: Task['category'];
}): Promise<any> {
  try {
    if (!tasksDatabaseId) {
      throw new Error('NOTION_TASKS_DATABASE_ID not set');
    }

    const response = await notion.pages.create({
      parent: {
        database_id: tasksDatabaseId,
      },
      properties: {
        Task: {
          title: [
            {
              text: {
                content: data.task,
              },
            },
          ],
        },
        Description: {
          rich_text: [
            {
              text: {
                content: data.description,
              },
            },
          ],
        },
        'Assigned To': {
          rich_text: [
            {
              text: {
                content: data.assignedTo,
              },
            },
          ],
        },
        Status: {
          select: {
            name: data.status || 'To Do',
          },
        },
        Priority: {
          select: {
            name: data.priority,
          },
        },
        'Due Date': {
          date: {
            start: data.dueDate,
          },
        },
        Category: {
          select: {
            name: data.category,
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<any> {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        Status: {
          select: {
            name: status,
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// ========================================
// DOCUMENTS
// ========================================

const documentsDatabaseId = process.env.NOTION_DOCUMENTS_DATABASE_ID || '';

export interface Document {
  id: string;
  name: string;
  description: string;
  category: 'Contract' | 'Guide' | 'Template' | 'Process';
  url: string;
  uploadDate: string;
  accessLevel: 'All Founders' | 'Core Team';
}

export async function getDocuments(): Promise<Document[]> {
  try {
    if (!documentsDatabaseId) {
      console.error('NOTION_DOCUMENTS_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${documentsDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Upload Date',
            direction: 'descending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || '',
      description: getRichTextValue(page.properties.Description),
      category: page.properties.Category?.select?.name || 'Guide',
      url: page.properties.URL?.url || '',
      uploadDate: page.properties['Upload Date']?.date?.start || '',
      accessLevel: page.properties['Access Level']?.select?.name || 'All Founders',
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

export async function addDocument(data: {
  name: string;
  description: string;
  category: Document['category'];
  url: string;
  accessLevel: Document['accessLevel'];
}): Promise<any> {
  try {
    if (!documentsDatabaseId) {
      throw new Error('NOTION_DOCUMENTS_DATABASE_ID not set');
    }

    const response = await notion.pages.create({
      parent: {
        database_id: documentsDatabaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: data.name,
              },
            },
          ],
        },
        Description: {
          rich_text: [
            {
              text: {
                content: data.description,
              },
            },
          ],
        },
        Category: {
          select: {
            name: data.category,
          },
        },
        URL: {
          url: data.url,
        },
        'Upload Date': {
          date: {
            start: new Date().toISOString(),
          },
        },
        'Access Level': {
          select: {
            name: data.accessLevel,
          },
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

// ========================================
// EVENTS
// ========================================

const eventsDatabaseId = process.env.NOTION_EVENTS_DATABASE_ID || '';

export interface Event {
  id: string;
  eventName: string;
  description: string;
  date: string;
  type: 'Call' | 'Deadline' | 'Launch' | 'Meeting';
  locationLink: string;
}

export async function getEvents(): Promise<Event[]> {
  try {
    if (!eventsDatabaseId) {
      console.error('NOTION_EVENTS_DATABASE_ID not set');
      return [];
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${eventsDatabaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Date',
            direction: 'ascending',
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message}`);
    }

    return data.results.map((page: any) => ({
      id: page.id,
      eventName: page.properties['Event Name']?.title?.[0]?.plain_text || '',
      description: getRichTextValue(page.properties.Description),
      date: page.properties.Date?.date?.start || '',
      type: page.properties.Type?.select?.name || 'Meeting',
      locationLink: page.properties['Location/Link']?.url || '',
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function addEvent(data: {
  eventName: string;
  description: string;
  date: string;
  type: Event['type'];
  locationLink?: string;
}): Promise<any> {
  try {
    if (!eventsDatabaseId) {
      throw new Error('NOTION_EVENTS_DATABASE_ID not set');
    }

    const response = await notion.pages.create({
      parent: {
        database_id: eventsDatabaseId,
      },
      properties: {
        'Event Name': {
          title: [
            {
              text: {
                content: data.eventName,
              },
            },
          ],
        },
        Description: {
          rich_text: [
            {
              text: {
                content: data.description,
              },
            },
          ],
        },
        Date: {
          date: {
            start: data.date,
          },
        },
        Type: {
          select: {
            name: data.type,
          },
        },
        ...(data.locationLink && {
          'Location/Link': {
            url: data.locationLink,
          },
        }),
      },
    });

    return response;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

export { notion };
