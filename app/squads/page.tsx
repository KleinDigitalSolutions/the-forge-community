'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import AuthGuard from '@/app/components/AuthGuard';
import { Users, Target, Calendar, ArrowUpRight } from 'lucide-react';

interface Squad {
  id: string;
  name: string;
  targetCapital: string;
  status: string;
  maxFounders: number;
  startDate: string;
  currentCount?: number; // Will be calculated later or fetched
}

const statusColors: Record<string, string> = {
  'Recruiting': 'bg-yellow-100 text-yellow-800',
  'Building': 'bg-blue-100 text-blue-800',
  'Live': 'bg-green-100 text-green-800',
  'Exit': 'bg-purple-100 text-purple-800',
};

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSquads() {
      try {
        const res = await fetch('/api/squads');
        if (res.ok) {
          const data = await res.json();
          setSquads(data);
        }
      } catch (e) {
        console.error('Error fetching squads:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSquads();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f8f4f0]">
        <Header />
        
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="mb-12">
            <h1 className="text-4xl font-display text-[var(--foreground)] mb-2">Squads</h1>
            <p className="text-lg text-[var(--secondary)]">
              Die operativen Einheiten von The Forge. Finde dein Team.
            </p>
          </div>

          {loading ? (
             <div className="bg-white rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--secondary)]">
                Lade Squads...
             </div>
          ) : squads.length === 0 ? (
            <div className="bg-white rounded-xl border border-[var(--border)] p-8 text-center text-sm text-[var(--secondary)]">
                Noch keine Squads aktiv.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {squads.map((squad) => (
                <div key={squad.id} className="bg-white rounded-2xl border border-[var(--border)] p-6 hover:border-[var(--accent-soft)] transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-display text-[var(--foreground)]">{squad.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[squad.status] || 'bg-gray-100 text-gray-800'}`}>
                        {squad.status}
                      </span>
                    </div>
                    {/* Placeholder icon or action */}
                    <div className="h-10 w-10 bg-[var(--surface-muted)] rounded-full flex items-center justify-center group-hover:bg-[var(--accent-glow)] transition-colors">
                        <Users className="w-5 h-5 text-[var(--secondary)] group-hover:text-[var(--accent)]" />
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-[var(--secondary)]" />
                      <div>
                        <div className="text-xs text-[var(--secondary)]">Target Capital</div>
                        <div className="text-sm font-medium">{squad.targetCapital}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[var(--secondary)]" />
                      <div>
                        <div className="text-xs text-[var(--secondary)]">Start Date</div>
                        <div className="text-sm font-medium">
                            {squad.startDate ? new Date(squad.startDate).toLocaleDateString('de-DE') : 'TBA'}
                        </div>
                      </div>
                    </div>
                    
                     <div className="pt-4 border-t border-[var(--border)]">
                        <div className="flex justify-between text-xs text-[var(--secondary)] mb-1">
                            <span>Founders</span>
                            <span>Max {squad.maxFounders}</span>
                        </div>
                         {/* Progress bar placeholder - ideally fetch real count */}
                        <div className="h-1.5 w-full bg-[var(--surface-muted)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent)] w-1/3" /> 
                        </div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
