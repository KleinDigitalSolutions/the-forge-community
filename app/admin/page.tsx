'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Zap, 
  Plus, 
  LayoutGrid,
  Shield,
  Loader2
} from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  email: string;
  status: string;
  role?: 'investor' | 'builder'; // We need to add this to notion read mapping
  capital?: string;
  skill?: string;
  why?: string;
}

interface Group {
  id: string;
  name: string;
  target: string;
  currentCount: number;
}

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/applicants');
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applicants || []);
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (founderId: string, groupId: string) => {
    if (!groupId) {
      alert('Bitte wähle zuerst einen Squad aus.');
      return;
    }
    setProcessingId(founderId);
    try {
      await fetch('/api/admin/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founderId, action: 'approve', groupId }),
      });
      // Remove from list locally
      setApplicants(prev => prev.filter(a => a.id !== founderId));
    } catch (e) {
      alert('Fehler beim Zuweisen.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (founderId: string) => {
    if (!confirm('Sicher ablehnen?')) return;
    setProcessingId(founderId);
    try {
      await fetch('/api/admin/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founderId, action: 'reject' }),
      });
      setApplicants(prev => prev.filter(a => a.id !== founderId));
    } catch (e) {
      alert('Fehler.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-wide text-sm">CONTROL CENTER</h1>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Stake & Scale Admin</div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-xs font-medium hover:text-white transition-colors">
              User View
            </Link>
            <div className="w-px h-4 bg-slate-700" />
            <div className="text-xs text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Systems Online
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        
        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Pending Applicants</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              {applicants.length}
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Action required</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Active Squads</div>
            <div className="text-2xl font-bold text-white">{groups.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Founders</div>
            <div className="text-2xl font-bold text-white">42</div> {/* Dummy */}
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Assets under Mgmt</div>
            <div className="text-2xl font-bold text-green-400">€125.000</div> {/* Dummy */}
          </div>
        </div>

        {/* INBOX */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Applicant Inbox
              </h2>
              <span className="text-xs text-slate-500">Last updated: Just now</span>
            </div>

            {applicants.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
                All cleared. No pending applications.
              </div>
            ) : (
              <div className="space-y-4">
                {applicants.map(app => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{app.name}</h3>
                        <div className="text-sm text-slate-400">{app.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700">
                          Pending
                        </span>
                        {/* We could detect role based on props later */}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div className="bg-slate-950 p-3 rounded-lg">
                        <div className="text-slate-500 text-[10px] uppercase">Pitch</div>
                        <div className="text-slate-300 mt-1 line-clamp-3 italic">
                           "Ich will unbedingt bauen. Habe Erfahrung in..."
                           {/* Fetch 'Why' from notion later */}
                        </div>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg">
                        <div className="text-slate-500 text-[10px] uppercase">Potential</div>
                        <div className="text-slate-300 mt-1">
                           Kapital-stark oder High-Skill
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                      <div className="flex-1">
                        <select 
                          id={`group-select-${app.id}`}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                        >
                          <option value="">Select Squad...</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name} ({g.target})</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                            const select = document.getElementById(`group-select-${app.id}`) as HTMLSelectElement;
                            handleApprove(app.id, select.value);
                        }}
                        disabled={!!processingId}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {processingId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(app.id)}
                        disabled={!!processingId}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SQUADS */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-purple-500" />
                Active Squads
              </h2>
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>

            <div className="space-y-4">
              {groups.length === 0 && (
                  <div className="text-slate-500 text-sm text-center py-8">
                      No squads initialized yet.
                  </div>
              )}
              {groups.map(group => (
                <div key={group.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-white">{group.name}</div>
                    <div className="text-xs text-purple-400 font-mono">{group.target}</div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-2">
                    <div 
                        className="bg-purple-600 h-full rounded-full" 
                        style={{ width: '40%' }} // Dummy
                    /> 
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-wider">
                    <span>10 / 25 Founders</span>
                    <span>Recruiting</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
