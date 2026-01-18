import { NextResponse } from 'next/server';
import { getForumPosts, addForumPost, getFounderByEmail } from '@/lib/notion';
import { auth } from '@/auth';
import { Client } from '@notionhq/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const posts = await getForumPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let authorName = session.user.name || 'Anonymous Founder';
    let founderNumber = 0;

    try {
      const founder = await getFounderByEmail(session.user.email);
      if (founder) {
        authorName = founder.name;
        founderNumber = founder.founderNumber;
      }
    } catch (e) {
      console.warn('API: Founder lookup failed, using session defaults');
    }

    const body = await request.json();
    const { content, category } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Missing content or category' }, { status: 400 });
    }

    // Erstelle den Post
    const response = await addForumPost({
      author: authorName,
      founderNumber: founderNumber,
      content,
      category,
    });
    
    // AI Response (bleibt als nettes Feature)
    if (process.env.GROQ_API_KEY) {
        try {
            const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `Du bist ein hilfreicher Community-Bot für 'The Forge'. Ein Founder hat gerade eine Frage oder Idee gepostet.
                            Gib eine kurze, motivierende und fachlich fundierte erste Einschätzung oder Antwort (max 2-3 Sätze).
                            Biete an, dass andere Founder sicher noch mehr dazu sagen können.
                            Unterschreibe mit '🤖 Forge AI'.`
                        },
                        { role: 'user', content: `Kategorie: ${category}\nInhalt: ${content}` },
                    ],
                    model: 'llama-3.3-70b-versatile',
                }),
            });

            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                const botText = aiData.choices[0]?.message?.content || '';

                if (botText && response.id) {
                    const notion = new Client({ auth: process.env.NOTION_API_KEY });
                    await notion.blocks.children.append({
                        block_id: response.id,
                        children: [
                            { object: 'block', type: 'divider', divider: {} },
                            {
                                object: 'block',
                                type: 'callout',
                                callout: {
                                    icon: { emoji: '🤖' },
                                    color: 'gray_background',
                                    rich_text: [{ type: 'text', text: { content: botText } }]
                                }
                            }
                        ]
                    });
                }
            }
        } catch (aiError) {
            console.error('AI Reply failed:', aiError);
        }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error adding forum post:', error);
    return NextResponse.json(
      { error: 'Failed to add forum post', details: error.message },
      { status: 500 }
    );
  }
}