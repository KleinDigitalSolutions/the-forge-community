'use client';

import { useMemo, useState } from 'react';
import { Lock, SendHorizontal, Sparkles, User, Bot, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

type ProviderOption = {
  id: string;
  label: string;
  description: string;
  status: 'active' | 'disabled';
};

const providerOptions: ProviderOption[] = [
  {
    id: 'forge-gemini',
    label: 'Forge AI (Jarvis Mode)',
    description: 'Dein persönlicher Assistent mit Langzeitgedächtnis.',
    status: 'active',
  },
  {
    id: 'custom-api',
    label: 'Eigene API (bald)',
    description: 'Verbinde deinen eigenen Key, sobald freigeschaltet.',
    status: 'disabled',
  },
];

export default function CommunicationClient() {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/communication/chat',
    }),
  });

  const [input, setInput] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const currentInput = input;
    setInput('');
    await sendMessage({ text: currentInput });
  };

  const [selectedProvider, setSelectedProvider] = useState(providerOptions[0].id);
  const isLocked = useMemo(
    () => providerOptions.find((p) => p.id === selectedProvider)?.status === 'disabled',
    [selectedProvider]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const form = (event.target as HTMLTextAreaElement).form;
      if (form) form.requestSubmit();
    }
  };

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {providerOptions.map((option) => {
          const isDisabled = option.status === 'disabled';
          const isActive = selectedProvider === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !isDisabled && setSelectedProvider(option.id)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                isDisabled
                  ? 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed'
                  : isActive
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/30'
              )}
            >
              {isDisabled ? <Lock className="h-3.5 w-3.5" /> : <Brain className={cn("h-3.5 w-3.5", isActive && "text-[#D4AF37]")} />}
              <div className="text-left">
                <div>{option.label}</div>
                <div className="text-[10px] text-white/40">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 space-y-6">
        {messages.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-white/2 px-6 py-16 text-center">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20">
              <Brain className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Bereit, Founder.</h3>
            <p className="text-sm text-white/40 max-w-sm mx-auto">
              Stell mir eine Frage zu deinen Projekten, Squads oder sag mir, was ich mir merken soll.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4 p-6 rounded-[2rem] transition-all',
                  message.role === 'user'
                    ? 'bg-white/5 border border-white/10 ml-12'
                    : 'bg-[#0F1113] border border-[#D4AF37]/20 mr-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]'
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                  message.role === 'user' ? "bg-white/5 border-white/10" : "bg-[#D4AF37]/10 border-[#D4AF37]/20"
                )}>
                  {message.role === 'user' ? <User className="w-5 h-5 text-white/40" /> : <Bot className="w-5 h-5 text-[#D4AF37]" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    {message.role === 'user' ? 'Operator' : 'Orion AI'}
                  </div>
                  <div className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                    {message.parts.map((part, i) => (
                      part.type === 'text' ? part.text : null
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 sticky bottom-6">
        <form onSubmit={handleSubmit} className="relative rounded-[2.5rem] border border-white/10 bg-[#0B0C0E]/80 backdrop-blur-2xl p-2 shadow-[0_30px_100px_-20px_rgba(0,0,0,1)]">
          <textarea
            value={input || ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Schreib Orion... (z.B. 'Merk dir, dass ich Kaffee hasse')"
            className="min-h-[80px] w-full resize-none bg-transparent px-6 py-4 text-sm text-white/90 placeholder:text-white/20 focus:outline-none custom-scrollbar"
          />
          <div className="flex items-center justify-between px-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-3 py-1 rounded-full border border-white/5">
                Shift + Enter für Zeile
              </span>
              {isLoading && (
                <span className="flex items-center gap-2 text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  Orion verarbeitet...
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!input?.trim() || isLoading || isLocked}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black transition hover:bg-[#F0C05A] active:scale-90 disabled:cursor-not-allowed disabled:opacity-20 shadow-xl shadow-[#D4AF37]/10"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
