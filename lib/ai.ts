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

const forumOrionBasePrompt = `
Du bist Orion, der Forum-AI-Spezialist von STAKE & SCALE.
Dein Job: Hilf Foundern im Forum mit klaren, ehrlichen Antworten.
Wenn dir Infos fehlen, sag das offen. Keine Halluzinationen.
Wenn externe Recherche nötig waere, sag das und gib eine kurze Empfehlung, wie man es pruefen kann.
Antworte immer auf Deutsch, kurz und handlungsorientiert.
`;

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
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Gemini failed, falling back to Groq:', message);
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
let resolvedGeminiModel: string | null = null;
let resolvedGeminiApiVersion: string | null = null;
const badGeminiModels = new Set<string>();

async function callGemini(
  messages: AIMessage[],
  options: { temperature: number; maxTokens: number }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const modelCandidates = Array.from(new Set([
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro'
  ].filter(Boolean))) as string[];

  const apiVersionCandidates = Array.from(new Set([
    process.env.GEMINI_API_VERSION || 'v1',
    'v1beta'
  ]));

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

  const versionsToTry = resolvedGeminiApiVersion ? [resolvedGeminiApiVersion] : apiVersionCandidates;
  const modelsToTry = resolvedGeminiModel ? [resolvedGeminiModel] : modelCandidates;

  for (const apiVersion of versionsToTry) {
    for (const model of modelsToTry) {
      if (!model || badGeminiModels.has(model)) continue;

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
        const errorText = await response.text();
        if (response.status === 404) {
          badGeminiModels.add(model);
          continue;
        }
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const data = await response.json();
      resolvedGeminiModel = model;
      resolvedGeminiApiVersion = apiVersion;
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  }

  throw new Error('Gemini API error: No supported model found');
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
        content: `${forumOrionBasePrompt}\nErstelle eine knappe TL;DR (max 2 Saetze).`
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
        content: `${forumOrionBasePrompt}\nGib hilfreiches, ehrliches Feedback zu einem ${category}-Post. Sei praegnant (max 3 Saetze) und handlungsorientiert.`
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
        content: `${forumOrionBasePrompt}\nErweitere die Idee mit 2-3 konkreten Vorschlaegen.`
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
        content: `${forumOrionBasePrompt}\nPruefe Aussagen auf Plausibilitaet und weise auf moegliche Ungenauigkeiten hin. Sei kurz (max 3 Saetze).`
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
        content: `${forumOrionBasePrompt}\nLeite 2-3 konkrete naechste Schritte ab. Kurz und klar.`
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
        content: `${forumOrionBasePrompt}\nKontext: Du bist Teil einer Community-Plattform fuer Founders, die gemeinsam Ventures bauen.\nBeantworte die Frage praegnAnt und konkret.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nFrage: ${question}`
      }
    ], { temperature: 0.6, maxTokens: 500 });
  }
};
