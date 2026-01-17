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
  properties: Map<string, string>; // Name -> Type
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
      const properties = new Map<string, string>();
      Object.entries(dataSource.properties || {}).forEach(([name, prop]: [string, any]) => {
        properties.set(name, prop.type);
      });
      const resolved: NotionSource = {
        type: 'data_source',
        properties,
      };
      sourceCache.set(id, resolved);
      return resolved;
    }
  } catch (error) {
    // console.warn('Data source lookup failed, falling back to database ID.', error.message);
  }

  const database = await notion.databases.retrieve({ database_id: id });
  if (!('properties' in database)) {
    throw new Error('Database properties not found (partial response)');
  }
  
  const properties = new Map<string, string>();
  Object.entries(database.properties || {}).forEach(([name, prop]: [string, any]) => {
    properties.set(name, prop.type);
  });
  
  const resolved: NotionSource = {
    type: 'database',
    properties,
  };
  sourceCache.set(id, resolved);
  return resolved;
}

function selectPropertyName(available: Map<string, string>, candidates: string[]): string | null {
  return candidates.find((name) => available.has(name)) || null;
}

function getProperty(page: any, available: Map<string, string>, candidates: string[]): any {
  const name = selectPropertyName(available, candidates);
  return name ? page.properties[name] : null;
}

function getText(property: any): string {
  if (!property) return '';
  if (property.title) return property.title.map((t: any) => t.plain_text).join('');
  if (property.rich_text) return property.rich_text.map((t: any) => t.plain_text).join('');
  if (property.people) return property.people.map((p: any) => p.name || p.id).join(', ');
  if (property.email) return property.email;
  if (property.phone_number) return property.phone_number;
  if (property.url) return property.url;
  return '';
}

function getStatus(property: any): string {
  if (!property) return '';
  if (property.status) return property.status.name;
  if (property.select) return property.select.name;
  return '';
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
    const founderNumberProp = selectPropertyName(source.properties, ['Founder Number', 'Gründernummer']) || 'Name';
    
    const query = {
      sorts: [
        {
          property: founderNumberProp,
          direction: 'ascending' as const,
        },
      ],
    };
    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: databaseId, ...query })
        : await (notion as any).databases.query({ database_id: databaseId, ...query });

    return data.results.map((page: any) => {
      const props = source.properties;
      return {
        id: page.id,
        name: getText(getProperty(page, props, ['Name', 'Titel'])),
        email: getProperty(page, props, ['Email', 'E-Mail'])?.email || '',
        founderNumber: getProperty(page, props, ['Founder Number', 'Gründernummer'])?.number || 0,
        joinedDate: getProperty(page, props, ['Joined Date', 'Beitrittsdatum'])?.date?.start || '',
        status: getStatus(getProperty(page, props, ['Status'])) as any || 'pending',
        investmentPaid: getProperty(page, props, ['Investment Paid', 'Investment bezahlt'])?.checkbox || false,
        groupId: getProperty(page, props, ['Group', 'Gruppe'])?.relation?.[0]?.id || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching founders:', error);
    return [];
  }
}

export async function getFounderByEmail(email: string): Promise<Founder | null> {
  try {
    const source = await resolveNotionSource(databaseId);
    const emailProp = selectPropertyName(source.properties, ['Email', 'E-Mail']);
    
    if (!emailProp) {
        console.error('Email property not found in Founders database');
        return null;
    }

    const filter = {
        property: emailProp,
        email: {
          equals: email,
        },
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({
            data_source_id: databaseId,
            filter,
          })
        : await (notion as any).databases.query({
            database_id: databaseId,
            filter,
          });

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const page = data.results[0] as any;
    const props = source.properties;
    
    // Fetch group details if a relation exists
    let groupName = undefined;
    const groupProp = getProperty(page, props, ['Group', 'Gruppe']);
    const groupId = groupProp?.relation?.[0]?.id;
    
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
      name: getText(getProperty(page, props, ['Name', 'Titel'])),
      email: getProperty(page, props, ['Email', 'E-Mail'])?.email || '',
      founderNumber: getProperty(page, props, ['Founder Number', 'Gründernummer'])?.number || 0,
      joinedDate: getProperty(page, props, ['Joined Date', 'Beitrittsdatum'])?.date?.start || '',
      status: getStatus(getProperty(page, props, ['Status'])) as any || 'pending',
      investmentPaid: getProperty(page, props, ['Investment Paid', 'Investment bezahlt'])?.checkbox || false,
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
    const nameProperty = selectPropertyName(source.properties, ['Name', 'Titel']) || 'Name';
    const emailProperty = selectPropertyName(source.properties, ['Email', 'E-Mail']) || 'Email';
    const numberProperty = selectPropertyName(source.properties, ['Founder Number', 'Gründernummer']) || 'Founder Number';
    const dateProperty = selectPropertyName(source.properties, ['Joined Date', 'Beitrittsdatum']) || 'Joined Date';
    const statusProperty = selectPropertyName(source.properties, ['Status']) || 'Status';
    const investmentProperty = selectPropertyName(source.properties, ['Investment Paid', 'Investment bezahlt']) || 'Investment Paid';

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

    const statusPropType = statusProperty ? source.properties.get(statusProperty) : 'select';

    const properties: Record<string, any> = {
      [nameProperty]: {
        title: [
          {
            text: {
              content: data.name,
            },
          },
        ],
      },
      [emailProperty]: {
        email: data.email,
      },
      [numberProperty]: {
        number: nextFounderNumber,
      },
      [dateProperty]: {
        date: {
          start: new Date().toISOString(),
        },
      },
      [statusProperty]: {
        [statusPropType === 'status' ? 'status' : 'select']: {
          name: 'pending',
        },
      },
      [investmentProperty]: {
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
    const statusProperty = selectPropertyName(source.properties, ['Status']) || 'Status';
    const statusPropType = source.properties.get(statusProperty) || 'select';

    const properties: any = {
      [statusProperty]: {
        [statusPropType === 'status' ? 'status' : 'select']: {
          name: status,
        },
      },
    };

    if (plan) {
      const planProp = selectPropertyName(source.properties, ['Plan']);
      if (planProp) {
        properties[planProp] = {
          select: {
            name: plan.charAt(0).toUpperCase() + plan.slice(1), // Capitalize (starter -> Starter)
          },
        };
      }
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

    const source = await resolveNotionSource(votesDatabaseId);
    const props = source.properties;
    const votesProp = selectPropertyName(props, ['Votes', 'Stimmen']) || 'Votes';

    const query = {
      sorts: [
        {
          property: votesProp,
          direction: 'descending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: votesDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: votesDatabaseId, ...query });

    return data.results.map((page: any) => {
      const metricsRaw = getText(getProperty(page, props, ['Metrics', 'Kennzahlen']));
      const highlightsRaw = getText(getProperty(page, props, ['Highlights', 'Glanzlichter']));
      const timelineRaw = getText(getProperty(page, props, ['Timeline', 'Zeitplan']));

      return {
        id: page.id,
        name: getText(getProperty(page, props, ['Name', 'Titel'])),
        description: getText(getProperty(page, props, ['Description', 'Beschreibung'])),
        votes: getProperty(page, props, ['Votes', 'Stimmen'])?.number || 0,
        status: getStatus(getProperty(page, props, ['Status'])) as any || 'active',
        createdDate: page.created_time || '',
        metrics: parseMetrics(metricsRaw),
        highlights: splitLines(highlightsRaw),
        timeline: splitLines(timelineRaw),
        startDate: getProperty(page, props, ['Start Date', 'Startdatum'])?.date?.start || '',
        endDate: getProperty(page, props, ['End Date', 'Enddatum'])?.date?.start || '',
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
    const props = (page as any).properties;
    const votesPropName = Object.keys(props).find(key => key.toLowerCase() === 'votes' || key === 'Stimmen') || 'Votes';
    const currentVotes = props[votesPropName]?.number || 0;
    const nextVotes = Math.max(0, currentVotes + delta);

    await notion.pages.update({
      page_id: id,
      properties: {
        [votesPropName]: {
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

    const source = await resolveNotionSource(transactionsDatabaseId);
    const props = source.properties;
    const dateProp = selectPropertyName(props, ['Date', 'Datum']) || 'Date';

    const query = {
      sorts: [
        {
          property: dateProp,
          direction: 'descending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: transactionsDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: transactionsDatabaseId, ...query });

    return data.results.map((page: any) => ({
      id: page.id,
      description: getText(getProperty(page, props, ['Description', 'Beschreibung'])),
      amount: getProperty(page, props, ['Amount', 'Betrag'])?.number || 0,
      category: getStatus(getProperty(page, props, ['Category', 'Kategorie'])) as any || 'Other',
      type: getStatus(getProperty(page, props, ['Type', 'Typ'])) as any || 'Expense',
      date: getProperty(page, props, ['Date', 'Datum'])?.date?.start || '',
      status: getStatus(getProperty(page, props, ['Status'])) as any || 'Pending',
      receiptUrl: getProperty(page, props, ['Receipt URL', 'Beleg-URL'])?.url || '',
      notes: getText(getProperty(page, props, ['Notes', 'Notizen'])),
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

    const source = await resolveNotionSource(transactionsDatabaseId);
    const props = source.properties;
    
    const descProp = selectPropertyName(props, ['Description', 'Beschreibung']) || 'Description';
    const amountProp = selectPropertyName(props, ['Amount', 'Betrag']) || 'Amount';
    const categoryProp = selectPropertyName(props, ['Category', 'Kategorie']) || 'Category';
    const typeProp = selectPropertyName(props, ['Type', 'Typ']) || 'Type';
    const dateProp = selectPropertyName(props, ['Date', 'Datum']) || 'Date';
    const statusProp = selectPropertyName(props, ['Status']) || 'Status';
    const receiptProp = selectPropertyName(props, ['Receipt URL', 'Beleg-URL']) || 'Receipt URL';
    const notesProp = selectPropertyName(props, ['Notes', 'Notizen']) || 'Notes';

    const properties: Record<string, any> = {
      [descProp]: {
        title: [
          {
            text: {
              content: data.description,
            },
          },
        ],
      },
      [amountProp]: {
        number: data.amount,
      },
      [categoryProp]: {
        select: {
          name: data.category,
        },
      },
      [typeProp]: {
        select: {
          name: data.type,
        },
      },
      [dateProp]: {
        date: {
          start: data.date,
        },
      },
      [statusProp]: {
        select: {
          name: data.status || 'Pending',
        },
      },
    };

    if (data.receiptUrl) {
      properties[receiptProp] = {
        url: data.receiptUrl,
      };
    }

    if (data.notes) {
      properties[notesProp] = {
        rich_text: [
          {
            text: {
              content: data.notes,
            },
          },
        ],
      };
    }

    const response = await notion.pages.create({
      parent: {
        database_id: transactionsDatabaseId,
      },
      properties,
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

    const source = await resolveNotionSource(forumDatabaseId);
    const props = source.properties;

    const query = {
      sorts: [
        {
          timestamp: 'created_time',
          direction: 'descending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: forumDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: forumDatabaseId, ...query });

    return data.results.map((page: any) => ({
      id: page.id,
      author: getText(getProperty(page, props, ['Author', 'Autor'])),
      founderNumber: getProperty(page, props, ['Founder Number', 'Gründernummer'])?.number || 0,
      content: getText(getProperty(page, props, ['Content', 'Inhalt'])),
      category: getStatus(getProperty(page, props, ['Category', 'Kategorie'])) || 'General',
      likes: getProperty(page, props, ['Likes'])?.number || 0,
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

    const source = await resolveNotionSource(forumDatabaseId);
    const props = source.properties;
    
    const nameProp = selectPropertyName(props, ['Name', 'Titel']) || 'Name';
    const contentProp = selectPropertyName(props, ['Content', 'Inhalt']) || 'Content';
    const authorProp = selectPropertyName(props, ['Author', 'Autor']) || 'Author';
    const numberProp = selectPropertyName(props, ['Founder Number', 'Gründernummer']) || 'Founder Number';
    const categoryProp = selectPropertyName(props, ['Category', 'Kategorie']) || 'Category';
    const likesProp = selectPropertyName(props, ['Likes']) || 'Likes';

    const title = data.content.trim().slice(0, 80);

    const properties: Record<string, any> = {
      [nameProp]: {
        title: [
          {
            text: {
              content: title || 'Forum Post',
            },
          },
        ],
      },
      [contentProp]: {
        rich_text: [
          {
            text: {
              content: data.content,
            },
          },
        ],
      },
      [authorProp]: {
        rich_text: [
          {
            text: {
              content: data.author,
            },
          },
        ],
      },
      [numberProp]: {
        number: data.founderNumber || 0,
      },
      [categoryProp]: {
        select: {
          name: data.category,
        },
      },
      [likesProp]: {
        number: 0,
      },
    };

    const response = await notion.pages.create({
      parent: {
        database_id: forumDatabaseId,
      },
      properties,
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
    const props = (page as any).properties;
    const likesPropName = Object.keys(props).find(key => key.toLowerCase() === 'likes') || 'Likes';
    const currentLikes = props[likesPropName]?.number || 0;
    const nextLikes = Math.max(0, currentLikes + delta);

    await notion.pages.update({
      page_id: id,
      properties: {
        [likesPropName]: {
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

    const source = await resolveNotionSource(announcementsDatabaseId);
    const props = source.properties;
    const dateProp = selectPropertyName(props, ['Veröffentlichungsdatum', 'Published Date', 'Date']) || 'Date';

    const query = {
      sorts: [
        {
          property: dateProp,
          direction: 'descending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: announcementsDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: announcementsDatabaseId, ...query });

    return data.results.map((page: any) => ({
      id: page.id,
      title: getText(getProperty(page, props, ['Titel', 'Title', 'Name'])),
      content: getText(getProperty(page, props, ['Inhalt', 'Content', 'Description'])),
      category: getStatus(getProperty(page, props, ['Kategorie', 'Category'])) as any || 'General',
      priority: getStatus(getProperty(page, props, ['Priorität', 'Priority'])) as any || 'Medium',
      publishedDate: getProperty(page, props, ['Veröffentlichungsdatum', 'Published Date', 'Date'])?.date?.start || '',
      author: getText(getProperty(page, props, ['Autor', 'Author'])),
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

    const source = await resolveNotionSource(announcementsDatabaseId);
    const props = source.properties;
    
    const titleProp = selectPropertyName(props, ['Titel', 'Title', 'Name']) || 'Title';
    const contentProp = selectPropertyName(props, ['Inhalt', 'Content', 'Description']) || 'Content';
    const categoryProp = selectPropertyName(props, ['Kategorie', 'Category']) || 'Category';
    const priorityProp = selectPropertyName(props, ['Priorität', 'Priority']) || 'Priority';
    const dateProp = selectPropertyName(props, ['Veröffentlichungsdatum', 'Published Date', 'Date']) || 'Date';
    const authorProp = selectPropertyName(props, ['Autor', 'Author']) || 'Author';

    const properties: Record<string, any> = {
      [titleProp]: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
      [contentProp]: {
        rich_text: [
          {
            text: {
              content: data.content,
            },
          },
        ],
      },
      [categoryProp]: {
        select: {
          name: data.category,
        },
      },
      [priorityProp]: {
        select: {
          name: data.priority,
        },
      },
      [dateProp]: {
        date: {
          start: new Date().toISOString(),
        },
      },
      [authorProp]: {
        rich_text: [
          {
            text: {
              content: data.author,
            },
          },
        ],
      },
    };

    const response = await notion.pages.create({
      parent: {
        database_id: announcementsDatabaseId,
      },
      properties,
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

    const source = await resolveNotionSource(tasksDatabaseId);
    const props = source.properties;
    const dateProp = selectPropertyName(props, ['Due Date', 'Fälligkeitsdatum', 'Date']) || 'Due Date';

    const query = {
      sorts: [
        {
          property: dateProp,
          direction: 'ascending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: tasksDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: tasksDatabaseId, ...query });

    return data.results.map((page: any) => ({
      id: page.id,
      task: getText(getProperty(page, props, ['Task', 'Aufgabe', 'Name'])),
      description: getText(getProperty(page, props, ['Description', 'Beschreibung'])),
      assignedTo: getText(getProperty(page, props, ['Assigned To', 'Zugewiesen an'])),
      status: getStatus(getProperty(page, props, ['Status'])) as any || 'To Do',
      priority: getStatus(getProperty(page, props, ['Priority', 'Priorität', 'Priority Level'])) as any || 'Medium',
      dueDate: getProperty(page, props, ['Due Date', 'Fälligkeitsdatum', 'Date'])?.date?.start || '',
      category: getStatus(getProperty(page, props, ['Category', 'Kategorie'])) as any || 'Operations',
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

    const source = await resolveNotionSource(tasksDatabaseId);
    const props = source.properties;
    
    const taskProp = selectPropertyName(props, ['Task', 'Aufgabe', 'Name']) || 'Task';
    const descProp = selectPropertyName(props, ['Description', 'Beschreibung']) || 'Description';
    const assignProp = selectPropertyName(props, ['Assigned To', 'Zugewiesen an']) || 'Assigned To';
    const statusProp = selectPropertyName(props, ['Status']) || 'Status';
    const priorityProp = selectPropertyName(props, ['Priority', 'Priorität', 'Priority Level']) || 'Priority';
    const dateProp = selectPropertyName(props, ['Due Date', 'Fälligkeitsdatum', 'Date']) || 'Due Date';
    const catProp = selectPropertyName(props, ['Category', 'Kategorie']) || 'Category';

    const properties: Record<string, any> = {
      [taskProp]: {
        title: [
          {
            text: {
              content: data.task,
            },
          },
        ],
      },
      [descProp]: {
        rich_text: [
          {
            text: {
              content: data.description,
            },
          },
        ],
      },
      [assignProp]: {
        rich_text: [
          {
            text: {
              content: data.assignedTo,
            },
          },
        ],
      },
      [statusProp]: {
        select: {
          name: data.status || 'To Do',
        },
      },
      [priorityProp]: {
        select: {
          name: data.priority,
        },
      },
      [dateProp]: {
        date: {
          start: data.dueDate,
        },
      },
      [catProp]: {
        select: {
          name: data.category,
        },
      },
    };

    const response = await notion.pages.create({
      parent: {
        database_id: tasksDatabaseId,
      },
      properties,
    });

    return response;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<any> {
  try {
    const page = await notion.pages.retrieve({ page_id: id });
    const props = (page as any).properties;
    const statusPropName = Object.keys(props).find(key => key.toLowerCase() === 'status') || 'Status';

    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [statusPropName]: {
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

    const source = await resolveNotionSource(documentsDatabaseId);
    const props = source.properties;
    const dateProp = selectPropertyName(props, ['Upload Date', 'Hochladedatum', 'Date']) || 'Upload Date';

    const query = {
      sorts: [
        {
          property: dateProp,
          direction: 'descending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: documentsDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: documentsDatabaseId, ...query });

    return data.results.map((page: any) => ({
      id: page.id,
      name: getText(getProperty(page, props, ['Name', 'Titel'])),
      description: getText(getProperty(page, props, ['Description', 'Beschreibung'])),
      category: getStatus(getProperty(page, props, ['Category', 'Kategorie'])) as any || 'Guide',
      url: getProperty(page, props, ['URL'])?.url || '',
      uploadDate: getProperty(page, props, ['Upload Date', 'Hochladedatum', 'Date'])?.date?.start || '',
      accessLevel: getStatus(getProperty(page, props, ['Access Level', 'Zugriffsebene'])) as any || 'All Founders',
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

    const source = await resolveNotionSource(documentsDatabaseId);
    const props = source.properties;
    
    const nameProp = selectPropertyName(props, ['Name', 'Titel']) || 'Name';
    const descProp = selectPropertyName(props, ['Description', 'Beschreibung']) || 'Description';
    const catProp = selectPropertyName(props, ['Category', 'Kategorie']) || 'Category';
    const urlProp = selectPropertyName(props, ['URL']) || 'URL';
    const dateProp = selectPropertyName(props, ['Upload Date', 'Hochladedatum', 'Date']) || 'Upload Date';
    const accessProp = selectPropertyName(props, ['Access Level', 'Zugriffsebene']) || 'Access Level';

    const properties: Record<string, any> = {
      [nameProp]: {
        title: [
          {
            text: {
              content: data.name,
            },
          },
        ],
      },
      [descProp]: {
        rich_text: [
          {
            text: {
              content: data.description,
            },
          },
        ],
      },
      [catProp]: {
        select: {
          name: data.category,
        },
      },
      [urlProp]: {
        url: data.url,
      },
      [dateProp]: {
        date: {
          start: new Date().toISOString(),
        },
      },
      [accessProp]: {
        select: {
          name: data.accessLevel,
        },
      },
    };

    const response = await notion.pages.create({
      parent: {
        database_id: documentsDatabaseId,
      },
      properties,
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

    const source = await resolveNotionSource(eventsDatabaseId);
    const props = source.properties;
    const dateProp = selectPropertyName(props, ['Date', 'Datum']) || 'Date';

    const query = {
      sorts: [
        {
          property: dateProp,
          direction: 'ascending' as const,
        },
      ],
    };

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: eventsDatabaseId, ...query })
        : await (notion as any).databases.query({ database_id: eventsDatabaseId, ...query });

    return data.results.map((page: any) => ({
      id: page.id,
      eventName: getText(getProperty(page, props, ['Event Name', 'Event-Name', 'Name'])),
      description: getText(getProperty(page, props, ['Description', 'Beschreibung'])),
      date: getProperty(page, props, ['Date', 'Datum'])?.date?.start || '',
      type: getStatus(getProperty(page, props, ['Type', 'Typ'])) as any || 'Meeting',
      locationLink: getProperty(page, props, ['Location/Link', 'Ort/Link'])?.url || '',
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

    const source = await resolveNotionSource(eventsDatabaseId);
    const props = source.properties;
    
    const nameProp = selectPropertyName(props, ['Event Name', 'Event-Name', 'Name']) || 'Event Name';
    const descProp = selectPropertyName(props, ['Description', 'Beschreibung']) || 'Description';
    const dateProp = selectPropertyName(props, ['Date', 'Datum']) || 'Date';
    const typeProp = selectPropertyName(props, ['Type', 'Typ']) || 'Type';
    const locProp = selectPropertyName(props, ['Location/Link', 'Ort/Link']) || 'Location/Link';

    const properties: Record<string, any> = {
      [nameProp]: {
        title: [
          {
            text: {
              content: data.eventName,
            },
          },
        ],
      },
      [descProp]: {
        rich_text: [
          {
            text: {
              content: data.description,
            },
          },
        ],
      },
      [dateProp]: {
        date: {
          start: data.date,
        },
      },
      [typeProp]: {
        select: {
          name: data.type,
        },
      },
    };

    if (data.locationLink) {
      properties[locProp] = {
        url: data.locationLink,
      };
    }

    const response = await notion.pages.create({
      parent: {
        database_id: eventsDatabaseId,
      },
      properties,
    });

    return response;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

// ========================================
// GROUPS (SQUADS)
// ========================================

const groupsDatabaseId = process.env.NOTION_GROUPS_DATABASE_ID || '';

export interface Group {
  id: string;
  name: string;
  targetCapital: string;
  status: string;
  maxFounders: number;
  startDate: string;
}

export async function getGroups(): Promise<Group[]> {
  try {
    if (!groupsDatabaseId) {
      console.error('NOTION_GROUPS_DATABASE_ID not set');
      return [];
    }

    const source = await resolveNotionSource(groupsDatabaseId);
    const props = source.properties;

    const data =
      source.type === 'data_source'
        ? await (notion as any).dataSources.query({ data_source_id: groupsDatabaseId })
        : await (notion as any).databases.query({ database_id: groupsDatabaseId });

    return data.results.map((page: any) => ({
      id: page.id,
      name: getText(getProperty(page, props, ['Name', 'Titel'])),
      targetCapital: getStatus(getProperty(page, props, ['Target Capital', 'Zielkapital'])) || '25k',
      status: getStatus(getProperty(page, props, ['Status'])) || 'Recruiting',
      maxFounders: getProperty(page, props, ['Max Founders', 'Maximale Gründer'])?.number || 0,
      startDate: getProperty(page, props, ['Start Date', 'Startdatum'])?.date?.start || '',
    }));
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

export { notion };
