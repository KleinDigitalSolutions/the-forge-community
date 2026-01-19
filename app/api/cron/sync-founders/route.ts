import { NextResponse } from 'next/server';
import { getFounders } from '@/lib/notion';
import { prisma } from '@/lib/prisma';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export async function GET(request: Request) {
  // Simple protection via secret query param or header (for Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow if running locally in dev
    if (process.env.NODE_ENV !== 'development') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const founders = await getFounders();
    let syncedCount = 0;

    for (const founder of founders) {
      if (!founder.email) continue;

      // 1. Sync Squad if exists
      let squadId = null;
      if (founder.groupId && founder.groupName) {
        try {
          const squad = await prisma.squad.upsert({
            where: { id: founder.groupId }, // Use Notion ID as DB ID for Squads if possible, or we rely on slug? 
            // Notion IDs are UUIDs, fitting generic String @id. 
            // But if we used cuid() in schema, we might want to let Prisma generate it? 
            // Better: use Notion ID as the ID to keep sync stable.
            // My schema says id @default(cuid()). I can override it on creation.
            create: {
              id: founder.groupId,
              name: founder.groupName,
              slug: slugify(founder.groupName),
            },
            update: {
              name: founder.groupName,
              slug: slugify(founder.groupName), // Update slug if name changes
            }
          });
          squadId = squad.id;
        } catch (e) {
          console.error(`Failed to sync squad for founder ${founder.email}`, e);
        }
      }

      // 2. Sync User
      // We match by Email because that's our Auth key.
      await prisma.user.upsert({
        where: { email: founder.email },
        create: {
          email: founder.email,
          name: founder.name,
          notionId: founder.id,
          role: (founder.status === 'active' ? 'FOUNDER' : 'USER') as any,
        },
        update: {
          name: founder.name,
          notionId: founder.id,
          role: (founder.status === 'active' ? 'FOUNDER' : 'USER') as any,
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      synced: syncedCount, 
      totalNotion: founders.length 
    });

  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
