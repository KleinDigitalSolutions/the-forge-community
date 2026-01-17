import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFounders, updateFounderStatus, notion } from '@/lib/notion';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET() {
  const session = await auth();

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch only pending applicants
  const allFounders = await getFounders();
  const applicants = allFounders.filter(f => f.status === 'pending');

  // Also fetch groups for the assignment dropdown
  const groupsDbId = process.env.NOTION_GROUPS_DATABASE_ID;
  let groups = [];
  if (groupsDbId && process.env.NOTION_API_KEY) {
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${groupsDbId}/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sorts: [{ property: 'Name', direction: 'ascending' }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          groups = data.results.map((page: any) => ({
              id: page.id,
              name: page.properties.Name?.title?.[0]?.plain_text || 'Unnamed Group',
              currentCount: 0, // Todo: calculate
              target: page.properties['Target Capital']?.select?.name || '25k'
          }));
        }
      } catch (e) {
          console.error('Error fetching groups:', e);
      }
  }

  return NextResponse.json({ applicants, groups });
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { founderId, action, groupId } = body;

    if (action === 'approve') {
        // 1. Update Status to 'active'
        await updateFounderStatus(founderId, 'active');
        
        // 2. Assign to Group (if provided)
        if (groupId && process.env.NOTION_DATABASE_ID) {
            await notion.pages.update({
                page_id: founderId,
                properties: {
                    'Group': {
                        relation: [
                            { id: groupId }
                        ]
                    }
                }
            });
        }
    } else if (action === 'reject') {
        await updateFounderStatus(founderId, 'inactive');
    }

    return NextResponse.json({ success: true });
}
