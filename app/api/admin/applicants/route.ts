import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFounders, updateFounderStatus, getGroups, notion } from '@/lib/notion';

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
  const groups = await getGroups();
  
  const mappedGroups = groups.map(g => ({
      id: g.id,
      name: g.name,
      currentCount: 0, // Todo: calculate
      target: g.targetCapital
  }));

  return NextResponse.json({ applicants, groups: mappedGroups });
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
            // Find the correct property name for Group relation
            const response = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
            
            let groupPropName = 'Group';
            if ('properties' in response) {
                const props = response.properties as Record<string, any>;
                groupPropName = Object.keys(props).find(key => 
                    key.toLowerCase() === 'group' || key === 'Gruppe' || props[key].type === 'relation'
                ) || 'Group';
            }

            await notion.pages.update({
                page_id: founderId,
                properties: {
                    [groupPropName]: {
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
