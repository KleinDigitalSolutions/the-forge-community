'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Factory, Globe, Check, Plus, AlertCircle } from 'lucide-react';

interface AISuggestion {
  companyName: string;
  country: string;
  category: string;
  specialization: string;
  moq: string;
  notes: string;
}

interface AISourcingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventureId: string;
  onSuccess: () => void;
}

export function AISourcingModal({ isOpen, onClose, ventureId, onSuccess }: AISourcingModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const startAISearch = async () => {
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/sourcing/ai-search`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data.suppliers);
        setExplanation(data.explanation || null);
      } else {
        setError(data.error || 'KI-Recherche fehlgeschlagen');
      }
    } catch (err) {
      setError('Netzwerkfehler bei der KI-Suche');
    } finally {
      setLoading(false);
    }
  };

  const saveSupplier = async (suggestion: AISuggestion) => {
    setSaving(suggestion.companyName);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/sourcing/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: suggestion.companyName,
          country: suggestion.country,
          category: suggestion.category,
          specialization: suggestion.specialization,
          notes: suggestion.notes,
          moq: parseInt(suggestion.moq) || 0,
          tags: ['AI-Suggested']
        }),
      });

      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.companyName !== suggestion.companyName));
        onSuccess();
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-3xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#D4AF37]/10 to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-instrument-serif text-white">Sourcing Match</h2>
                <p className="text-sm text-white/40">Matcht echte Lieferanten aus deiner Datenbank auf Basis deiner Brand DNA</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-white/40" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#D4AF37] animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-white">Analysiere globale Märkte...</p>
                  <p className="text-sm text-white/40 italic">Wir suchen nach Herstellern, die zu deiner Brand DNA passen.</p>
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid gap-4">
                {suggestions.map((s, idx) => (
                  <motion.div
                    key={s.companyName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-white/5 border border-white/5 p-6 rounded-2xl hover:border-[#D4AF37]/30 transition-all flex justify-between items-center"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">{s.companyName}</h3>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold uppercase tracking-widest text-white/40">{s.category}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-[#D4AF37]" /> {s.country}</div>
                        <div className="flex items-center gap-1.5"><Factory className="w-4 h-4 text-[#D4AF37]" /> MOQ: {s.moq}</div>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">{s.notes}</p>
                    </div>
                    <button
                      onClick={() => saveSupplier(s)}
                      disabled={saving === s.companyName}
                      className="ml-6 px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-[#D4AF37] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving === s.companyName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Übernehmen
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-white/20" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-medium text-white mb-2">Bereit für die KI-Suche?</h3>
                  <p className="text-white/40 text-sm">
                    Wir matchen deine Brand DNA (Kategorie, Zielmarkt, Werte) mit echten Lieferanten aus deinem Netzwerk.
                  </p>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm justify-center">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                <button
                  onClick={startAISearch}
                  className="px-10 py-4 bg-[#D4AF37] text-black rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all flex items-center gap-3 mx-auto group"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Matching starten
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {suggestions.length > 0 && (
            <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/20">
                {explanation || 'Ergebnisse basieren auf deinem Forge Lieferanten-Directory.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
