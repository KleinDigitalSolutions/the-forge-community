'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { motion } from 'framer-motion';
import {
  Users, Crown, Calendar, TrendingUp, Wallet, ArrowLeft,
  Settings, UserPlus, Target, Zap, MessageSquare, FileText,
  ArrowUpRight, Sparkles, Shield, Lock, Globe, X
} from 'lucide-react';
import Link from 'next/link';

interface Squad {
  id: string;
  name: string;
  mission?: string;
  status: string;
  squad_type: string;
  current_members: number;
  max_members: number;
  lead_id: string;
  lead_name?: string;
  created_at: string;
  is_public: boolean;
  is_accepting_members: boolean;
  is_member: boolean;
  user_role?: string;
  members: Member[];
}

interface Member {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  equity_share: number;
  hours_contributed: number;
  tasks_completed: number;
  joined_at: string;
}

interface Venture {
  id: string;
  name?: string;
  status: string;
  current_phase: number;
}

interface Wallet {
  balance: number;
  budget_total: number;
}

export default function SquadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const squadId = params.id as string;

  const [squad, setSquad] = useState<Squad | null>(null);
  const [venture, setVenture] = useState<Venture | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchSquadDetails();
  }, [squadId]);

  async function fetchSquadDetails() {
    try {
      const res = await fetch(`/api/squads/${squadId}`);
      if (!res.ok) throw new Error('Squad not found');

      const data = await res.json();
      setSquad(data.squad);
      setVenture(data.venture);
      setWallet(data.wallet);
    } catch (err) {
      console.error('Error fetching squad:', err);
      router.push('/squads');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSquad() {
    setJoining(true);
    try {
      const res = await fetch('/api/squads/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ squad_id: squadId })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to join squad');
        return;
      }

      setShowJoinModal(false);
      fetchSquadDetails(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Failed to join squad');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <PageShell>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold">Loading Squad...</p>
            </div>
          </div>
        </PageShell>
      </AuthGuard>
    );
  }

  if (!squad) return null;

  const isLead = squad.user_role === 'lead';

  return (
    <AuthGuard>
      <PageShell>
        {/* Header */}
        <div className="mb-12">
          <Link href="/squads">
            <button className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all mb-6 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs uppercase tracking-widest font-bold">Zurück zum Markt</span>
            </button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-4">
                <Shield className="w-3 h-3" />
                Squad Command Center
              </div>

              <h1 className="text-5xl md:text-6xl font-instrument-serif text-white mb-3">{squad.name}</h1>

              <p className="text-white/60 text-lg mb-6 max-w-2xl">
                {squad.mission || 'Keine Mission definiert.'}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={squad.status} />
                <TypeBadge type={squad.squad_type} />
                {squad.is_public ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest">
                    <Globe className="w-3 h-3" />
                    Öffentlich
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest">
                    <Lock className="w-3 h-3" />
                    Privat
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {!squad.is_member && squad.is_accepting_members && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowJoinModal(true)}
                  className="btn-shimmer bg-[var(--accent)] text-[var(--accent-foreground)] px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[var(--accent)]/20"
                >
                  <UserPlus className="w-5 h-5" />
                  Squad Beitreten
                </motion.button>
              )}

              {isLead && (
                <Link href={`/squads/${squadId}/settings`}>
                  <button className="px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all">
                    <Settings className="w-5 h-5" />
                    Einstellungen
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={Users}
            label="Team Size"
            value={`${squad.current_members}/${squad.max_members}`}
            trend={`${Math.round((squad.current_members / squad.max_members) * 100)}% besetzt`}
          />
          <StatCard
            icon={Wallet}
            label="Budget"
            value={wallet?.balance ? `€${wallet.balance.toLocaleString()}` : '€0'}
            trend={wallet?.budget_total ? `von €${wallet.budget_total.toLocaleString()}` : 'Kein Budget'}
          />
          <StatCard
            icon={Target}
            label="Phase"
            value={venture?.current_phase ? `Phase ${venture.current_phase}/6` : 'Keine'}
            trend={venture?.status || 'Kein Venture'}
          />
          <StatCard
            icon={TrendingUp}
            label="Progress"
            value={venture ? `${Math.round((venture.current_phase / 6) * 100)}%` : '0%'}
            trend={venture?.name || 'Not started'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Team & Activity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Team Members */}
            <div className="glass-card rounded-[2rem] border border-white/10 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-instrument-serif text-white">Team Members</h2>
                <span className="text-xs uppercase tracking-widest font-bold text-white/40">
                  {squad.members?.length || 0} Active
                </span>
              </div>

              <div className="space-y-4">
                {squad.members?.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <QuickActionCard
                icon={MessageSquare}
                label="Squad Forum"
                description="Private Diskussionen"
                href={`/forum?squad=${squadId}`}
              />
              <QuickActionCard
                icon={FileText}
                label="Documents"
                description="Shared Resources"
                href={`/resources?squad=${squadId}`}
              />
            </div>
          </div>

          {/* Right Column - Info & Actions */}
          <div className="space-y-8">
            {/* Venture Info */}
            {venture ? (
              <div className="glass-card rounded-[2rem] border border-white/10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{venture.name || 'Unnamed Venture'}</h3>
                    <p className="text-xs uppercase tracking-widest text-white/40">Active Venture</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Phase</span>
                    <span className="text-sm font-bold text-white">{venture.current_phase}/6</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(venture.current_phase / 6) * 100}%` }}
                      className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
                    />
                  </div>

                  <Link href={`/ventures/${venture.id}`}>
                    <button className="w-full mt-4 bg-white text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[var(--accent)] transition-all flex items-center justify-center gap-2 group">
                      Venture öffnen
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-[2rem] border border-dashed border-white/10 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Kein Venture</h3>
                <p className="text-sm text-white/40 mb-6">Starte euer erstes Venture-Projekt</p>
                {isLead && (
                  <Link href={`/ventures/new?squad=${squadId}`}>
                    <button className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest">
                      Venture erstellen
                    </button>
                  </Link>
                )}
              </div>
            )}

            {/* Squad Info */}
            <div className="glass-card rounded-[2rem] border border-white/10 p-8">
              <h3 className="text-lg font-bold text-white mb-6">Squad Info</h3>
              <div className="space-y-4 text-sm">
                <InfoRow label="Gegründet" value={new Date(squad.created_at).toLocaleDateString('de-DE')} />
                <InfoRow label="Lead" value={squad.lead_name || 'Unknown'} />
                <InfoRow label="Type" value={squad.squad_type} />
                <InfoRow label="Status" value={squad.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Join Modal */}
        {showJoinModal && (
          <JoinModal
            squad={squad}
            onClose={() => setShowJoinModal(false)}
            onJoin={handleJoinSquad}
            joining={joining}
          />
        )}
      </PageShell>
    </AuthGuard>
  );
}

// ===== COMPONENTS =====

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    forming: { color: 'emerald', label: 'Rekrutierung' },
    planning: { color: 'blue', label: 'Planung' },
    building: { color: 'orange', label: 'Execution' },
    launched: { color: 'purple', label: 'Live' },
  };

  const { color, label } = config[status] || { color: 'gray', label: status };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 text-xs font-bold uppercase tracking-widest`}>
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest capitalize">
      {type}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, trend }: any) {
  return (
    <div className="glass-card rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--accent)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{label}</span>
      </div>
      <div className="text-3xl font-instrument-serif text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{trend}</div>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'lead': return Crown;
      case 'co-founder': return Users;
      default: return Users;
    }
  };

  const Icon = getRoleIcon(member.role);

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] font-bold text-lg">
          {member.user_name?.charAt(0) || 'F'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white">{member.user_name}</h4>
            <Icon className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest">{member.role}</p>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-bold text-white">{member.equity_share.toFixed(1)}%</div>
        <div className="text-xs text-white/40">Equity</div>
      </div>
    </motion.div>
  );
}

function QuickActionCard({ icon: Icon, label, description, href }: any) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -4 }}
        className="glass-card rounded-2xl border border-white/10 p-6 hover:border-[var(--accent)]/30 transition-all cursor-pointer group"
      >
        <Icon className="w-8 h-8 text-[var(--accent)] mb-4 group-hover:scale-110 transition-transform" />
        <h3 className="font-bold text-white mb-1">{label}</h3>
        <p className="text-xs text-white/40">{description}</p>
      </motion.div>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/60">{label}</span>
      <span className="font-bold text-white capitalize">{value}</span>
    </div>
  );
}

function JoinModal({ squad, onClose, onJoin, joining }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] w-full max-w-lg p-10 glass-card"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-6 text-[var(--accent)] text-4xl font-instrument-serif">
            {squad.name.charAt(0)}
          </div>
          <h2 className="text-3xl font-instrument-serif text-white mb-2">Squad beitreten?</h2>
          <p className="text-white/60">
            Du wirst Mitglied von <strong>{squad.name}</strong>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">Equity Share</div>
            <div className="text-2xl font-bold text-white">
              {(100 / (squad.current_members + 1)).toFixed(1)}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-white/60">
            <p className="mb-2">Als Mitglied erhältst du:</p>
            <ul className="space-y-1 text-xs">
              <li>• Zugriff auf Squad Forum & Resources</li>
              <li>• Mitbestimmungsrecht bei Entscheidungen</li>
              <li>• Anteil am Venture (bei Launch)</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest text-white/40 hover:text-white border border-white/10 hover:border-white/20 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={onJoin}
            disabled={joining}
            className="flex-1 bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
          >
            {joining ? 'Beitrete...' : 'Jetzt beitreten'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
