'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Flame, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Topic {
  topic: string;
  description: string;
  heat: number; // 0-100
  posts_count: number;
  category: string;
}

interface TrendingData {
  topics: Topic[];
  analyzed_posts: number;
  period: string;
  provider?: string;
  generated_at: string;
}

export function TrendingTopics() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrends();
  }, []);

  async function loadTrends() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/forum/trending');
      if (!response.ok) throw new Error('Failed to load trends');

      const data = await response.json();
      setData(data);
    } catch (err: any) {
      console.error('Trending topics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getHeatColor(heat: number) {
    if (heat >= 80) return 'from-red-500 to-orange-500';
    if (heat >= 60) return 'from-orange-500 to-yellow-500';
    if (heat >= 40) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-blue-500';
  }

  function getHeatIcon(heat: number) {
    if (heat >= 80) return <Flame className="w-4 h-4 text-red-400" />;
    if (heat >= 60) return <TrendingUp className="w-4 h-4 text-orange-400" />;
    return <Activity className="w-4 h-4 text-yellow-400" />;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          <span className="text-sm text-white/40">Analysiere Trends mit AI...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-6 border border-white/5">
        <div className="text-center py-8">
          <p className="text-sm text-white/40">Trends konnten nicht geladen werden</p>
          <button
            onClick={loadTrends}
            className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)] glass-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--foreground)] text-lg">Trending Topics</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              {data.analyzed_posts} Posts analysiert
              {data.provider && ` · AI: ${data.provider}`}
            </p>
          </div>
        </div>

        <button
          onClick={loadTrends}
          disabled={loading}
          className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest bg-[var(--surface-muted)] hover:bg-[var(--surface-muted)]/80 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
        >
          Aktualisieren
        </button>
      </div>

      {/* Topics List */}
      {data.topics.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-white/40">
            Noch nicht genug Daten für Trend-Analyse
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.topics.map((topic, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              {/* Rank Badge */}
              <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center z-10">
                <span className="text-[10px] font-bold text-white/60">
                  {index + 1}
                </span>
              </div>

              {/* Topic Card */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 p-4 hover:border-white/10 transition-all">
                {/* Heat Bar Background */}
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getHeatColor(topic.heat)} opacity-5`}
                  style={{ width: `${topic.heat}%` }}
                />

                <div className="relative flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getHeatIcon(topic.heat)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h4 className="font-bold text-white text-sm">
                        {topic.topic}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold text-white/40">
                          {topic.posts_count} Posts
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-white/50 mb-2">
                      {topic.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                          Heat
                        </span>
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getHeatColor(topic.heat)} transition-all duration-500`}
                            style={{ width: `${topic.heat}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white/50">
                          {topic.heat}%
                        </span>
                      </div>

                      <div className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40">
                        {topic.category}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[9px] text-white/30 text-center">
          Letzte Aktualisierung: {new Date(data.generated_at).toLocaleString('de-DE')}
        </p>
      </div>
    </div>
  );
}
