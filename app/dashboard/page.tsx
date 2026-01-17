'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PricingTable } from '@/app/components/PricingTable';
import MarginCalculator from '@/app/components/MarginCalculator';
import {
  Users,
  Vote,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface Founder {
  founderNumber: number;
  name: string;
  joinedDate: string;
  status: string;
}

interface ProductVote {
  id: string;
  name: string;
  description: string;
  votes: number;
  isVoted: boolean;
  metrics: { label: string; value: string }[];
  highlights: string[];
  timeline: string[];
  status?: 'active' | 'closed' | 'winner';
  startDate?: string;
  endDate?: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  
  const [currentUser, setCurrentUser] = useState<Founder | null>(null);
  const [founders, setFounders] = useState<Founder[]>([]);
  const [foundersCount, setFoundersCount] = useState(0);
  const [productVotes, setProductVotes] = useState<ProductVote[]>([]);
  const [capitalRaised, setCapitalRaised] = useState(0);
  const [capitalTarget, setCapitalTarget] = useState(25000);
  const [inviteStatus, setInviteStatus] = useState('');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const voteStorageKey = 'forge_votes_v1';
  const MAX_GROUP_SIZE = 25;

  const handlePlanSelect = async (plan: 'starter' | 'growth' | 'premium') => {
    setIsCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert('Fehler beim Starten des Checkouts.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (e) {
        console.error('Error fetching current user:', e);
      }
    }
    fetchMe();
  }, []);

  useEffect(() => {
    async function fetchFounders() {
      try {
        const response = await fetch('/api/founders');
        if (response.ok) {
          const data = await response.json();
          const foundersArray = Array.isArray(data) ? data : data.founders || [];
          setFounders(foundersArray);
          const activeCount = typeof data.count === 'number'
            ? data.count
            : foundersArray.filter((f: Founder) => f.status === 'active').length;
          setFoundersCount(activeCount);
        }
      } catch (error) {
        console.error('Error fetching founders:', error);
      }
    }

    fetchFounders();
  }, []);

  useEffect(() => {
    async function fetchCapitalSummary() {
      try {
        const response = await fetch('/api/transactions/summary');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setCapitalRaised(typeof data.totalIncome === 'number' ? data.totalIncome : 0);
        setCapitalTarget(typeof data.targetCapital === 'number' ? data.targetCapital : 25000);
      } catch (error) {
        console.error('Error fetching capital summary:', error);
      }
    }

    fetchCapitalSummary();
  }, []);

  useEffect(() => {
    async function fetchVotes() {
      try {
        const response = await fetch('/api/votes');
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          return;
        }

        let storedVotes: Record<string, boolean> = {};
        if (typeof window !== 'undefined') {
          try {
            storedVotes = JSON.parse(localStorage.getItem(voteStorageKey) || '{}');
          } catch (error) {
            console.error('Error reading stored votes:', error);
          }
        }

        const mappedVotes = data.map((vote: any) => ({
          ...vote,
          metrics: vote.metrics || [],
          highlights: vote.highlights || [],
          timeline: vote.timeline || [],
          isVoted: Boolean(storedVotes[vote.id]),
        }));

        setProductVotes(mappedVotes);
      } catch (error) {
        console.error('Error fetching votes:', error);
      }
    }

    fetchVotes();
  }, []);

  const activeVotes = productVotes.filter(vote => vote.status === 'active');
  const activeVote = activeVotes[0];
  const activeVotesCount = activeVotes.length;
  const visibleVotes = activeVotes.length ? activeVotes : [];

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const votingStatusLabel = isMounted ? (() => {
    if (activeVote?.endDate) {
      const endTime = new Date(activeVote.endDate).getTime();
      const now = new Date().getTime();
      const daysLeft = Math.max(0, Math.ceil((endTime - now) / (1000 * 60 * 60 * 24)));
      return daysLeft === 0 ? 'Endet heute' : `Laeuft noch ${daysLeft} Tage`;
    }
    return activeVote ? 'Voting aktiv' : 'Kein Voting aktiv';
  })() : 'Lade...';

  const handleVote = (id: string) => {
    const currentVote = productVotes.find(vote => vote.id === id);
    if (!currentVote) {
      return;
    }

    const nextIsVoted = !currentVote.isVoted;
    const delta = currentVote.isVoted ? -1 : 1;

    setProductVotes(
      productVotes.map(vote =>
        vote.id === id
          ? { ...vote, votes: vote.votes + delta, isVoted: nextIsVoted }
          : vote
      )
    );

    if (typeof window !== 'undefined') {
      try {
        const storedVotes = JSON.parse(localStorage.getItem(voteStorageKey) || '{}');
        if (nextIsVoted) {
          storedVotes[id] = true;
        } else {
          delete storedVotes[id];
        }
        localStorage.setItem(voteStorageKey, JSON.stringify(storedVotes));
      } catch (error) {
        console.error('Error storing vote:', error);
      }
    }

    const isNotionId = /^[0-9a-f-]{32,36}$/i.test(id);
    if (isNotionId) {
      fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, delta }),
      }).catch(error => {
        console.error('Error updating vote:', error);
      });
    }
  };

  const handleCopyInvite = async () => {
    if (typeof window === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      const inviteLink = `${window.location.origin}/?ref=founder`;
      await navigator.clipboard.writeText(inviteLink);
      setInviteStatus('Link kopiert.');
      setTimeout(() => setInviteStatus(''), 2000);
    } catch (error) {
      console.error('Error copying invite link:', error);
      setInviteStatus('Kopieren fehlgeschlagen.');
      setTimeout(() => setInviteStatus(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#f8f4f0]/90 backdrop-blur-md border-b border-[var(--border)] z-50">
        <div className="w-full px-8 md:px-12 lg:px-16 py-2 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full border border-[var(--border)] bg-white/70 flex items-center justify-center font-display text-[0.6rem] tracking-[0.32em] text-[var(--foreground)]">
              S&S
            </div>
            <div className="leading-tight">
              <div className="text-[0.7rem] uppercase tracking-[0.4em] text-[var(--secondary)]">
                Stake &amp; Scale
              </div>
              <div className="text-xs text-[var(--secondary)]">Dashboard</div>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6 items-center text-[0.7rem] uppercase tracking-[0.28em] text-[var(--secondary)]">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </Link>
            <Link href="/transparency" className="hover:text-[var(--foreground)] transition-colors">
              Transparenz
            </Link>
            <Link href="/forum" className="hover:text-[var(--foreground)] transition-colors">
              Forum
            </Link>
            <Link href="/tasks" className="hover:text-[var(--foreground)] transition-colors">
              Tasks
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[0.6rem]">Status: {currentUser?.status || 'Active'}</span>
            </div>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        
        {paymentStatus === 'success' && (
          <div className="mb-8 bg-[var(--accent-glow)] border border-[var(--accent-soft)] rounded-2xl p-6 flex items-start gap-4 animate-fade-in">
            <CheckCircle className="w-6 h-6 text-[var(--accent)] mt-1" />
            <div>
              <h3 className="text-lg font-display text-[var(--accent)]">Zahlung erfolgreich!</h3>
              <p className="text-sm text-[var(--secondary)]">Willkommen im Inner Circle. Dein Status ist jetzt aktiv.</p>
            </div>
          </div>
        )}

        {paymentStatus === 'cancelled' && (
           <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="text-lg font-display text-red-800">Zahlung abgebrochen</h3>
              <p className="text-sm text-red-700">Der Vorgang wurde nicht abgeschlossen. Bitte versuche es erneut.</p>
            </div>
          </div>
        )}

        {currentUser && currentUser.status === 'pending' && paymentStatus !== 'success' && (
          <div className="mb-12">
             <div className="text-center mb-10">
               <h2 className="text-3xl font-display text-[var(--foreground)] mb-4">Wähle dein Membership-Modell</h2>
               <p className="text-lg text-[var(--secondary)] max-w-2xl mx-auto">
                 Faire Preise, die mit deinem Erfolg wachsen. Starte klein oder skaliere direkt.
               </p>
             </div>
             <PricingTable onSelectPlan={handlePlanSelect} isLoading={isCheckoutLoading} />
          </div>
        )}

        {/* Welcome */}
        <div className="mb-12">
          <div className="flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--secondary)] mb-2">
            <span className="h-px w-8 bg-[var(--border)]" />
            Venture Hub
          </div>
          <h1 className="text-4xl font-display text-[var(--foreground)] mb-2">Founder Dashboard</h1>
          <p className="text-lg text-[var(--secondary)]">
            Willkommen zurück{currentUser ? `, ${currentUser.name}` : ''}. Dein Projekt-Fortschritt auf einen Blick.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Founders</span>
            </div>
            <div className="text-4xl font-display text-[var(--foreground)]">
              {foundersCount}<span className="text-xl text-[var(--secondary)] opacity-50">/{MAX_GROUP_SIZE}</span>
            </div>
            <p className="text-xs text-[var(--secondary)] mt-2">
              {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze verfügbar
            </p>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Kapital</span>
            </div>
            <div className="text-4xl font-display text-[var(--foreground)]">
              €{capitalRaised.toLocaleString()}
            </div>
            <p className="text-xs text-[var(--secondary)] mt-2">Ziel: €{capitalTarget.toLocaleString()}</p>
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center">
                <Vote className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Status</span>
            </div>
            <div className="text-xl font-display text-[var(--foreground)]">
              {votingStatusLabel}
            </div>
            <p className="text-xs text-[var(--secondary)] mt-2">{activeVotesCount} aktive Abstimmungen</p>
          </div>
        </div>

        {/* Product Voting */}
        <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-8 md:p-12 mb-12 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-[var(--accent-glow)] text-[var(--accent)] px-3 py-1 rounded-full text-[0.6rem] uppercase tracking-[0.2em] mb-3 font-medium">
                Voting #1
              </div>
              <h2 className="text-3xl font-display text-[var(--foreground)]">Projekt-Auswahl</h2>
              <p className="text-[var(--secondary)]">
                SmartStore: Unser erstes Community Fulfillment Hub
              </p>
            </div>
          </div>

          {visibleVotes.length === 0 ? (
            <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center">
              <p className="text-sm text-[var(--secondary)]">Kein aktives Voting vorhanden.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {visibleVotes.map(vote => {
                const totalVotes = Math.max(1, foundersCount || 0);
                const percentage = totalVotes ? (vote.votes / totalVotes) * 100 : 0;
                return (
                  <div
                    key={vote.id}
                    className="group border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent-soft)] transition-all bg-white/50"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-display text-[var(--foreground)] mb-2">{vote.name}</h3>
                        <p className="text-sm text-[var(--secondary)] leading-relaxed">{vote.description}</p>
                      </div>
                      <button
                        onClick={() => handleVote(vote.id)}
                        className={`w-full md:w-auto px-8 py-3 rounded-full text-[0.7rem] uppercase tracking-[0.25em] transition-all ${
                          vote.isVoted
                            ? 'bg-[var(--accent)] text-white'
                            : 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white'
                        }`}
                      >
                        {vote.isVoted ? 'Bestätigt' : 'Stimme abgeben'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      {vote.metrics.map(metric => (
                        <div
                          key={metric.label}
                          className="bg-[var(--surface-muted)] rounded-xl p-4"
                        >
                          <div className="text-[0.6rem] uppercase tracking-[0.15em] text-[var(--secondary)] mb-1">{metric.label}</div>
                          <div className="text-sm font-medium text-[var(--foreground)]">{metric.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">
                        <span>Zustimmung</span>
                        <span>{vote.votes} Founder</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Brand Tools - Margin Calculator */}
        <div className="mb-12">
          <MarginCalculator />
        </div>

        {/* Founders List */}
        <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-8 md:p-12 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-display text-[var(--foreground)] mb-2">The Circle</h2>
              <p className="text-sm text-[var(--secondary)]">{foundersCount} aktive Partner im Studio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {founders.map(founder => (
              <div
                key={founder.founderNumber}
                className="group border border-[var(--border)] rounded-2xl p-6 hover:bg-[var(--surface-muted)] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-[var(--border)] bg-white flex items-center justify-center font-display text-xs text-[var(--secondary)]">
                    #{founder.founderNumber}
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)] text-sm">{founder.name}</div>
                    <div className="text-[0.6rem] uppercase tracking-[0.1em] text-[var(--secondary)]">
                      Dabei seit {new Date(founder.joinedDate).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                {founder.status === 'active' && (
                  <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                )}
              </div>
            ))}
          </div>

          {foundersCount < MAX_GROUP_SIZE && (
            <div className="mt-12 pt-12 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--secondary)] mb-6">
                Noch {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze offen. Hilf uns zu wachsen.
              </p>
              <button
                onClick={handleCopyInvite}
                className="bg-[var(--accent)] text-white px-8 py-3 rounded-full text-[0.7rem] uppercase tracking-[0.3em] hover:bg-[#0b2f24] transition-colors"
              >
                Einladungslink kopieren
              </button>
              {inviteStatus && (
                <p className="text-xs text-[var(--accent)] mt-3 font-medium">{inviteStatus}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center font-display text-sm tracking-[0.4em] text-[var(--secondary)] uppercase">Lade Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}