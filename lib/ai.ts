/**
 * Unified AI Helper with Gemini Flash Primary + Groq Fallback
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  provider: 'gemini' | 'groq';
  error?: string;
}

/**
 * Call Gemini Flash 2.0 with Groq as fallback
 */
export async function callAI(
  messages: AIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<AIResponse> {
  const { temperature = 0.7, maxTokens = 1000 } = options;

  // Try Gemini Flash first
  try {
    const geminiResponse = await callGemini(messages, { temperature, maxTokens });
    if (geminiResponse) {
      return { content: geminiResponse, provider: 'gemini' };
    }
  } catch (error) {
    console.warn('Gemini failed, falling back to Groq:', error);
  }

  // Fallback to Groq
  try {
    const groqResponse = await callGroq(messages, { temperature, maxTokens });
    return { content: groqResponse, provider: 'groq' };
  } catch (error) {
    console.error('Both AI providers failed:', error);
    throw new Error('AI service unavailable');
  }
}

/**
 * Gemini Flash 2.0 API Call
 */
async function callGemini(
  messages: AIMessage[],
  options: { temperature: number; maxTokens: number }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  // Format messages for Gemini
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages.filter(m => m.role !== 'system');

  const geminiMessages = userMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add system message as first user message if exists
  if (systemMsg) {
    geminiMessages.unshift({
      role: 'user',
      parts: [{ text: `[SYSTEM CONTEXT]\n${systemMsg}\n\n[USER REQUEST]` }]
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
  const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Groq API Call (Fallback)
 */
async function callGroq(
  messages: AIMessage[],
  options: { temperature: number; maxTokens: number }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Pre-configured AI Actions for Forum
 */
export const ForumAIActions = {
  summarize: async (postContent: string) => {
    return callAI([
      {
        role: 'system',
        content: 'Du bist ein präziser Zusammenfassungs-Assistent. Erstelle eine knappe TL;DR (max 2 Sätze) auf Deutsch.'
      },
      {
        role: 'user',
        content: `Fasse diesen Forum-Post zusammen:\n\n${postContent}`
      }
    ], { temperature: 0.3, maxTokens: 200 });
  },

  feedback: async (postContent: string, category: string) => {
    return callAI([
      {
        role: 'system',
        content: `Du bist ein konstruktiver Mentor für Founders. Gib hilfreiches, ehrliches Feedback zu einem ${category}-Post. Sei prägnant (max 3 Sätze) und handlungsorientiert.`
      },
      {
        role: 'user',
        content: postContent
      }
    ], { temperature: 0.7, maxTokens: 300 });
  },

  expand: async (postContent: string) => {
    return callAI([
      {
        role: 'system',
        content: 'Du bist ein kreativer Brainstorming-Partner. Erweitere die Idee mit 2-3 konkreten Vorschlägen auf Deutsch.'
      },
      {
        role: 'user',
        content: `Erweitere diese Idee:\n\n${postContent}`
      }
    ], { temperature: 0.9, maxTokens: 400 });
  },

  factCheck: async (postContent: string) => {
    return callAI([
      {
        role: 'system',
        content: 'Du bist ein Fact-Checker. Prüfe Aussagen auf Plausibilität und weise auf mögliche Ungenauigkeiten hin. Sei kurz (max 3 Sätze).'
      },
      {
        role: 'user',
        content: `Fact-Check:\n\n${postContent}`
      }
    ], { temperature: 0.2, maxTokens: 300 });
  },

  nextSteps: async (postContent: string) => {
    return callAI([
      {
        role: 'system',
        content: 'Du bist ein Action-Coach. Leite 2-3 konkrete nächste Schritte ab, die der Founder umsetzen kann. Kurz und klar auf Deutsch.'
      },
      {
        role: 'user',
        content: `Was sind die nächsten Schritte basierend auf:\n\n${postContent}`
      }
    ], { temperature: 0.5, maxTokens: 300 });
  },

  mentionReply: async (question: string, context: string) => {
    return callAI([
      {
        role: 'system',
        content: `Du bist der Forge AI Assistant. Beantworte Fragen prägnant und hilfreich. Bleib auf Deutsch und sei konkret. Wenn du dir nicht sicher bist, sag es ehrlich.

        Context: Du bist Teil einer Community-Plattform für Founders die gemeinsam Ventures bauen.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nFrage: ${question}`
      }
    ], { temperature: 0.6, maxTokens: 500 });
  }
};
