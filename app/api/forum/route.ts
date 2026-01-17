import { NextResponse } from 'next/server';
import { getForumPosts, addForumPost } from '@/lib/notion';
import { Client } from '@notionhq/client';

export const dynamic = 'force-dynamic';

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
  try {
    const body = await request.json();
    const { author, founderNumber, content, category } = body;

    if (!author || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Create the post in Notion
    const response = await addForumPost({
      author,
      founderNumber,
      content,
      category,
    });
    
    // 2. Generate AI Response (Fire & Forget style mostly, but we await here for simplicity)
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
                    // 3. Append AI answer to the Notion Page content
                    const notion = new Client({ auth: process.env.NOTION_API_KEY });
                    await notion.blocks.children.append({
                        block_id: response.id,
                        children: [
                            {
                                object: 'block',
                                type: 'divider',
                                divider: {}
                            },
                            {
                                object: 'block',
                                type: 'callout',
                                callout: {
                                    icon: { emoji: '🤖' },
                                    color: 'gray_background',
                                    rich_text: [
                                        {
                                            type: 'text',
                                            text: {
                                                content: botText
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    });
                }
            }
        } catch (aiError) {
            console.error('AI Reply failed (non-critical):', aiError);
            // We do not fail the request if AI fails
        }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding forum post:', error);
    return NextResponse.json(
      { error: 'Failed to add forum post' },
      { status: 500 }
    );
  }
}
