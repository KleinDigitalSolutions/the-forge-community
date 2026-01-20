'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, Mail, Instagram, Loader2 } from 'lucide-react';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/applicants');
      if (res.ok) {
        setApplicants(await res.json());
      }
    } catch (err) {
      console.error('Failed to load applicants', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/applicants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchApplicants();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  if (loading) return <div className="text-white p-10">Lade Daten...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-instrument-serif text-white">Bewerbungen</h2>
        <div className="text-sm text-white/40">Total: {applicants.length}</div>
      </div>

      <div className="grid gap-4">
        {applicants.map((app) => (
          <div key={app.id} className="glass-card p-6 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  app.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                  app.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {app.status}
                </span>
                <span className="text-xs text-white/40 font-mono">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{app.name}</h3>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <a href={`mailto:${app.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="w-3 h-3" /> {app.email}</a>
                {app.instagram && (
                  <span className="flex items-center gap-2"><Instagram className="w-3 h-3" /> {app.instagram}</span>
                )}
              </div>
              <div className="mt-4 p-4 bg-black/40 rounded-lg text-sm text-white/80 border border-white/5 italic">
                "{app.why}"
              </div>
              <div className="flex gap-4 text-xs text-white/40 mt-2">
                <span>Rolle: <strong className="text-white">{app.role}</strong></span>
                <span>Kapital: <strong className="text-white">{app.capital}</strong></span>
                <span>Skill: <strong className="text-white">{app.skill}</strong></span>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[140px]">
              {app.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => updateStatus(app.id, 'APPROVED')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button 
                    onClick={() => updateStatus(app.id, 'REJECTED')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {app.status === 'APPROVED' && (
                <div className="text-center p-3 border border-green-500/30 rounded-lg bg-green-500/5">
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Freigeschaltet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
