'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, ChevronRight, Loader2, Sparkles, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIContext } from '@/app/context/AIContext';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ContextAwareAiSidebar() {
  const { isSidebarOpen, setSidebarOpen, context } = useAIContext();
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hallo! Ich sehe, du bist im Bereich "${context}". Wie kann ich dir hier helfen?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update welcome message when context changes
  useEffect(() => {
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: `Kontext gewechselt: ${context}. Bereit zur Unterstützung.` }
    ]);
  }, [context]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSidebarOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/contextual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          context: context,
          pathname: pathname
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Fehler bei der Verbindung zum AI-Service.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button (only visible if sidebar is closed) */}
      {!isSidebarOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-8 right-8 z-40 flex items-center gap-3 px-4 py-3 bg-[#D4AF37] text-black rounded-full shadow-lg hover:brightness-110 transition-all"
        >
          <Bot className="w-6 h-6" />
          <span className="font-bold text-xs uppercase tracking-widest hidden md:block">AI Assistant</span>
        </motion.button>
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-80 md:w-96 bg-[#0a0a0a] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Forge AI</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest truncate max-w-[150px]">
                    {context}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${ 
                      msg.role === 'user'
                        ? 'bg-[#D4AF37] text-black font-medium rounded-br-none'
                        : 'bg-white/10 text-white/80 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none">
                    <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Frag mich etwas..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#D4AF37] text-black rounded-lg hover:brightness-110 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
