'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { Users, Target, Calendar, ArrowUpRight, TrendingUp, Lock, Unlock, Shield, Rocket, Plus, Search, Sparkles, Globe, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Squad {
  id: string;
  name: string;
  mission?: string;
  status: string;
  squad_type: string;
  current_members: number;
  max_members: number;
  lead_name?: string;
  created_at: string;
  is_public: boolean;
  is_accepting_members: boolean;
  slots_available?: number;
}

const statusConfig: Record<string, { color: string, label: string, icon: any }> = {
  'forming': { color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10', label: 'Rekrutierung', icon: Unlock },
  'planning': { color: 'text-blue-500 border-blue-500/20 bg-blue-500/10', label: 'Planung', icon: Target },
  'building': { color: 'text-orange-500 border-orange-500/20 bg-orange-500/10', label: 'Execution', icon: Zap },
  'launched': { color: 'text-purple-500 border-purple-500/20 bg-purple-500/10', label: 'Live', icon: TrendingUp },
};

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'my-squads'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchSquads();
  }, [filter]);

  async function fetchSquads() {
    setLoading(true);
    try {
      const res = await fetch(`/api/squads?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setSquads(data.squads || []);
      }
    } catch (e) {
      console.error('Error fetching squads:', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredSquads = squads.filter(squad =>
    squad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    squad.mission?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8 relative">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-6">
              <Sparkles className="w-3 h-3" />
              Verfügbare Operationen
            </div>
            <h1 className="text-5xl md:text-6xl font-instrument-serif text-white tracking-tight mb-4">Squad Markt</h1>
            <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">Investiere Zeit & Kapital in High-Performance Teams.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="glass-card px-8 py-6 rounded-3xl border border-white/10 flex gap-12 relative z-10">
              <div>
                <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Gesamtwert</div>
                <div className="text-3xl font-instrument-serif text-white tracking-tight">€ 75.000</div>
              </div>
              <div>
                <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Aktive Squads</div>
                <div className="text-3xl font-instrument-serif text-white tracking-tight">{squads.length}</div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="btn-shimmer bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl shadow-[var(--accent)]/20"
            >
              <Plus className="w-5 h-5" />
              Squad Gründen
            </motion.button>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="flex gap-2 bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)]">
            {(['open', 'all', 'my-squads'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                  filter === f
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f === 'open' && 'Offen'}
                {f === 'all' && 'Alle'}
                {f === 'my-squads' && 'Meine'}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Squad suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="h-[450px] bg-white/5 rounded-[2.5rem] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredSquads.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-24 text-center">
            <p className="text-white/20 font-black uppercase tracking-[0.4em] text-sm mb-8">
              {filter === 'my-squads' && 'Du bist noch in keinem Squad.'}
              {filter === 'open' && 'Der Markt ist gerade ruhig.'}
              {filter === 'all' && 'Noch keine Squads.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Erstes Squad Gründen
            </motion.button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredSquads.map((squad, idx) => {
                const config = statusConfig[squad.status] || statusConfig['forming'];
                const Icon = config.icon;
                const fillPercent = Math.min((squad.current_members / squad.max_members) * 100, 100);

                return (
                  <motion.div
                    key={squad.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative glass-card rounded-[2.5rem] border border-white/10 hover:border-[var(--accent)]/30 transition-all duration-700 overflow-hidden flex flex-col shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="p-10 pb-0 relative z-10 flex justify-between items-start">
                      <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[var(--accent)] text-3xl font-instrument-serif shadow-2xl group-hover:border-[var(--accent)]/50 transition-all duration-700">
                        {squad.name.charAt(0)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color}`}>
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                        {squad.is_public ? (
                          <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-white/40" />
                        )}
                      </div>
                    </div>

                    <div className="p-10 pb-6 relative z-10 flex-1">
                      <h3 className="text-3xl font-instrument-serif text-white mb-2 group-hover:text-[var(--accent)] transition-colors duration-700">{squad.name}</h3>
                      <p className="text-sm text-white/50 mb-6 line-clamp-2 min-h-[40px]">
                        {squad.mission || 'Keine Mission definiert.'}
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                          <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Squad Type</div>
                          <div className="text-lg font-instrument-serif text-white capitalize">{squad.squad_type}</div>
                        </div>
                        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                          <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Lead</div>
                          <div className="text-lg font-instrument-serif text-white truncate">
                            {squad.lead_name || 'TBD'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                          <span>Founders Board</span>
                          <span className="text-[var(--accent)]">{squad.current_members} / {squad.max_members} Plätze</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]`}
                          />
                        </div>
                        <div className="flex -space-x-3 mt-6">
                          {[...Array(squad.max_members)].map((_, i) => (
                            <div key={i} className={`w-9 h-9 rounded-full border-2 border-[#08090A] flex items-center justify-center text-[10px] font-black shadow-xl transition-transform hover:scale-110 relative ${
                              i < squad.current_members ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white/10'
                            }`}>
                              {i < squad.current_members ? 'F' : '+'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-10 pt-0 relative z-10 mt-auto">
                      <Link href={`/squads/${squad.id}`}>
                        <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[var(--accent)] transition-all duration-500 shadow-2xl active:scale-[0.98] flex justify-center items-center gap-3 group/btn">
                          {squad.is_accepting_members && (squad.slots_available || 0) > 0 ? 'Platz anfordern' : 'Details ansehen'}
                          <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Create Modal */}
        <CreateSquadModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchSquads();
          }}
        />
      </PageShell>
    </AuthGuard>
  );
}

function CreateSquadModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    mission: '',
    squad_type: 'venture',
    max_members: 5,
    is_public: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/squads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create squad');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[2.5rem] w-full max-w-2xl p-10 glass-card shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-instrument-serif text-white mb-2">Squad Gründen</h2>
            <p className="text-white/40 text-xs uppercase tracking-[0.3em]">Baue dein High-Performance Team</p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-2">
              Squad Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] transition-all"
              placeholder="z.B. EcoWear Collective"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-2">
              Mission Statement
            </label>
            <textarea
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              rows={3}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
              placeholder="Woran arbeitet dein Squad? Was ist das Ziel?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-2">
                Squad Type
              </label>
              <select
                value={formData.squad_type}
                onChange={(e) => setFormData({ ...formData, squad_type: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[var(--accent)] transition-all"
              >
                <option value="venture">Venture (Brand Building)</option>
                <option value="project">Project (One-Time)</option>
                <option value="experiment">Experiment (Testing)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-2">
                Max. Members
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={formData.max_members}
                onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <div>
              <div className="text-sm font-bold text-white mb-1">Öffentlich</div>
              <div className="text-xs text-white/40">Andere Founder können beitreten</div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
              className={`relative w-14 h-8 rounded-full transition-all ${
                formData.is_public ? 'bg-[var(--accent)]' : 'bg-white/20'
              }`}
            >
              <motion.div
                animate={{ x: formData.is_public ? 24 : 0 }}
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
              />
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-shimmer bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
            >
              {loading ? 'Gründe...' : 'Squad Gründen'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
