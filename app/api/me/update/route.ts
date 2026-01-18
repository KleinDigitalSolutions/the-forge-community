import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { notion } from '@/lib/notion';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const data = await request.json();
    const email = session.user.email;

    // 1. In Postgres speichern (für die App-Performance)
    await sql`
      UPDATE "User"
      SET
        name = ${data.name},
        phone = ${data.phone},
        birthday = ${data.birthday},
        address_street = ${data.address_street},
        address_city = ${data.address_city},
        address_zip = ${data.address_zip},
        address_country = ${data.address_country},
        instagram = ${data.instagram},
        linkedin = ${data.linkedin},
        bio = ${data.bio},
        skills = ${data.skills},
        goal = ${data.goal}
      WHERE email = ${email};
    `;

    // 2. In Notion spiegeln (für dein Admin-Panel)
    const dbId = (process.env.NOTION_DATABASE_ID || '').trim();
    
    // Wir nutzen search() statt query(), da das SDK hier Probleme macht
    const search = await (notion as any).search({
      query: email,
      filter: { property: 'object', value: 'page' }
    });

    if (search.results.length > 0) {
      const pageId = search.results[0].id;
      await notion.pages.update({
        page_id: pageId,
        properties: {
          'Name': { title: [{ text: { content: data.name } }] },
          'Phone': { phone_number: data.phone },
          'Instagram': { rich_text: [{ text: { content: data.instagram || '' } }] },
          'Bio': { rich_text: [{ text: { content: data.bio || '' } }] }
          // Weitere Felder müssten in Notion existieren (Spaltennamen beachten!)
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
