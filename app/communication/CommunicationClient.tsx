'use client';

import { useMemo, useState } from 'react';
import { Lock, SendHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ProviderOption = {
  id: string;
  label: string;
  description: string;
  status: 'active' | 'disabled';
};

const providerOptions: ProviderOption[] = [
  {
    id: 'forge-gemini',
    label: 'Forge AI (Gemini)',
    description: 'Unsere Standard-API fuer schnelle Antworten.',
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [selectedProvider, setSelectedProvider] = useState(providerOptions[0].id);
  const isLocked = useMemo(
    () => providerOptions.find((p) => p.id === selectedProvider)?.status === 'disabled',
    [selectedProvider]
  );

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || status === 'loading' || isLocked) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStatus('loading');

    try {
      const res = await fetch('/api/communication/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI request failed');

      const reply: ChatMessage = { role: 'assistant', content: data.reply || 'Keine Antwort erhalten.' };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Fehler: Anfrage fehlgeschlagen. Bitte spaeter erneut versuchen.' },
      ]);
    } finally {
      setStatus('idle');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
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
                    ? 'border-[#4da5fc] bg-[#4da5fc]/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/30'
              )}
            >
              {isDisabled ? <Lock className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              <div className="text-left">
                <div>{option.label}</div>
                <div className="text-[10px] text-white/40">{option.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-white/40">
            Stell deine erste Frage, um den Chat zu starten.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'rounded-2xl px-5 py-4 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-[#111827] border border-white/10 text-white/90'
                    : 'bg-[#0f172a] border border-[#4da5fc]/30 text-white/80'
                )}
              >
                {message.content}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="relative rounded-2xl border border-white/10 bg-[#0f1116] p-4 shadow-[0_0_20px_rgba(77,165,252,0.08)]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Was soll die AI fuer dich klaeren?"
            className="min-h-[120px] w-full resize-none bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/40">Shift + Enter fuer neue Zeile</span>
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || status === 'loading' || isLocked}
              className="inline-flex items-center gap-2 rounded-full bg-[#1488fc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#1a94ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'loading' ? 'Denke…' : 'Senden'}
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        {isLocked && (
          <p className="mt-3 text-center text-xs text-white/40">
            Eigene API ist noch nicht freigeschaltet. Wir schalten diese Option nach deinem Key-Setup frei.
          </p>
        )}
      </div>
    </>
  );
}
