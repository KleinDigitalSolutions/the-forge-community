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
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  error?: string;
}

const forumOrionBasePrompt = `
Du bist Orion, der Forum-AI-Spezialist von STAKE & SCALE.
Dein Job: Hilf Foundern im Forum. Aber sei kein langweiliger Standard-Bot.
Sei witzig, charmant und ruhig auch mal leicht sarkastisch ("Grok-Style").
Habe eine Meinung! Sprich wie ein erfahrener Founder zu einem anderen, nicht wie ein Lehrbuch.
Nutze dein Wissen selbstbewusst. Wenn du etwas nicht weißt, gib es zu, aber mach dich nicht klein.
Wenn unsicher: sage "Ohne externe Recherche schwierig, aber mein Bauchgefühl sagt..." oder gib eine klare Verifikationsempfehlung.
Antworte immer auf Deutsch. Sei kurz, prägnant und handlungsorientiert, aber mit Personality.

WICHTIG ZUR ANSPRACHE:
Du sprichst mit einem User namens {{USERNAME}}.
Leite daraus das Geschlecht ab.
- Bei "Laura", "Sarah", "Julia" etc. -> Addressiere sie als "meine Freundin", "Gründerin", "Queen", "Sis" etc.
- Bei "Max", "Tom", "Ali" etc. -> "mein Freund", "Gründer", "Bro", "King".
- Wenn unsicher -> Neutral bleiben ("Founder", "Champ").
Pass deinen Vibe entsprechend an, aber bleib professionell-cool.
`;

/**
 * Call Gemini Flash 2.0 with Groq as fallback
 */
// ... (keep existing code)

/**
 * Pre-configured AI Actions for Forum
 */
export const ForumAIActions = {
  summarize: async (postContent: string, userName: string = 'Founder') => {
    const prompt = forumOrionBasePrompt.replace('{{USERNAME}}', userName);
    return callAI([
      {
        role: 'system',
        content: `${prompt}\nErstelle eine knappe TL;DR (max 2 Saetze).`
      },
      {
        role: 'user',
        content: `Fasse diesen Forum-Post zusammen:\n\n${postContent}`
      }
    ], { temperature: 0.3, maxTokens: 200 });
  },

  feedback: async (postContent: string, category: string, userName: string = 'Founder') => {
    const prompt = forumOrionBasePrompt.replace('{{USERNAME}}', userName);
    return callAI([
      {
        role: 'system',
        content: `${prompt}\nGib hilfreiches, ehrliches Feedback zu einem ${category}-Post. Sei praegnant (max 3 Saetze) und handlungsorientiert.`
      },
      {
        role: 'user',
        content: postContent
      }
    ], { temperature: 0.7, maxTokens: 300 });
  },

  expand: async (postContent: string, userName: string = 'Founder') => {
    const prompt = forumOrionBasePrompt.replace('{{USERNAME}}', userName);
    return callAI([
      {
        role: 'system',
        content: `${prompt}\nErweitere die Idee mit 2-3 konkreten Vorschlaegen.`
      },
      {
        role: 'user',
        content: `Erweitere diese Idee:\n\n${postContent}`
      }
    ], { temperature: 0.9, maxTokens: 400 });
  },

  factCheck: async (postContent: string, userName: string = 'Founder') => {
    const prompt = forumOrionBasePrompt.replace('{{USERNAME}}', userName);
    return callAI([
      {
        role: 'system',
        content: `${prompt}\nPrüfe Aussagen auf Plausibilitaet und weise auf mögliche Ungenauigkeiten hin. Sei kurz (max 3 Saetze).`
      },
      {
        role: 'user',
        content: `Fact-Check:\n\n${postContent}`
      }
    ], { temperature: 0.2, maxTokens: 300 });
  },

  nextSteps: async (postContent: string, userName: string = 'Founder') => {
    const prompt = forumOrionBasePrompt.replace('{{USERNAME}}', userName);
    return callAI([
      {
        role: 'system',
        content: `${prompt}\nLeite 2-3 konkrete naechste Schritte ab. Kurz und klar.`
      },
      {
        role: 'user',
        content: `Was sind die nächsten Schritte basierend auf:\n\n${postContent}`
      }
    ], { temperature: 0.5, maxTokens: 300 });
  },

  mentionReply: async (question: string, context: string, userName: string = 'Founder') => {
    const prompt = forumOrionBasePrompt.replace('{{USERNAME}}', userName);
    return callAI([
      {
        role: 'system',
        content: `${prompt}\nKontext: Du bist Teil einer Community-Plattform für Founders, die gemeinsam Ventures bauen.\nBeantworte die Frage praegnant und konkret.`
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nFrage: ${question}`
      }
    ], { temperature: 0.6, maxTokens: 500 });
  }
};
