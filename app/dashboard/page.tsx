'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PricingTable } from '@/app/components/PricingTable';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl font-semibold text-gray-900">THE FORGE</div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-900 font-medium">
              Dashboard
            </Link>
            <Link href="/transparency" className="text-sm text-gray-600 hover:text-gray-900">
              Transparency
            </Link>
            <Link href="/forum" className="text-sm text-gray-600 hover:text-gray-900">
              Forum
            </Link>
            <Link href="/updates" className="text-sm text-gray-600 hover:text-gray-900">
              Updates
            </Link>
            <Link href="/tasks" className="text-sm text-gray-600 hover:text-gray-900">
              Tasks
            </Link>
            <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900">
              Resources
            </Link>
            <Link href="/calendar" className="text-sm text-gray-600 hover:text-gray-900">
              Calendar
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {paymentStatus === 'success' && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4 animate-fade-in">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Zahlung erfolgreich!</h3>
              <p className="text-green-700">Willkommen im Inner Circle. Dein Status ist jetzt aktiv.</p>
            </div>
          </div>
        )}

        {paymentStatus === 'cancelled' && (
           <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Zahlung abgebrochen</h3>
              <p className="text-red-700">Der Vorgang wurde nicht abgeschlossen. Bitte versuche es erneut.</p>
            </div>
          </div>
        )}

        {currentUser && currentUser.status === 'pending' && paymentStatus !== 'success' && (
          <div className="mb-12">
             <div className="text-center mb-10">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">Wähle dein Membership-Modell</h2>
               <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                 Faire Preise, die mit deinem Erfolg wachsen. Starte klein oder skaliere direkt.
                 Jeder Plan beinhaltet vollen Zugriff auf die Community & Votes.
               </p>
             </div>
             <PricingTable onSelectPlan={handlePlanSelect} isLoading={isCheckoutLoading} />
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Founder Dashboard</h1>
          <p className="text-lg text-gray-600">
            Willkommen zurück! Hier siehst du alle wichtigen Updates.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Founders</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {foundersCount}/{MAX_GROUP_SIZE}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Max. {MAX_GROUP_SIZE} pro Gruppe · {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze offen
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Kapital</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              €{capitalRaised.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 mt-1">von €{capitalTarget.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Aktive Votes</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{activeVotesCount}</div>
            <p className="text-sm text-gray-500 mt-1">{votingStatusLabel}</p>
          </div>
        </div>

        {/* Product Voting */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Projekt-Voting #1</h2>
              <p className="text-sm text-gray-600">
                Erstes echtes Projekt: SmartStore (Community Fulfillment Hub)
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {votingStatusLabel}
            </span>
          </div>

          {visibleVotes.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              Kein Voting aktiv. Lege ein Voting in Notion an, um es hier zu sehen.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleVotes.map(vote => {
                const totalVotes = Math.max(1, foundersCount || 0);
                const percentage = totalVotes ? (vote.votes / totalVotes) * 100 : 0;
                return (
                  <div
                    key={vote.id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{vote.name}</h3>
                        <p className="text-sm text-gray-600">{vote.description}</p>
                      </div>
                      <button
                        onClick={() => handleVote(vote.id)}
                        className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          vote.isVoted
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {vote.isVoted ? 'Voted' : 'Vote'}
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 mb-4">
                      {vote.metrics.map(metric => (
                        <div
                          key={metric.label}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                          <div className="text-xs text-gray-500">{metric.label}</div>
                          <div className="text-sm font-semibold text-gray-900">{metric.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Highlights
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                          {vote.highlights.map(item => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Roadmap 0–6 Monate
                        </div>
                        <ol className="space-y-2 text-sm text-gray-600 list-decimal pl-5">
                          {vote.timeline.map(item => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-20 text-right">
                        {vote.votes} Votes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              Hast du eine eigene Projektidee? Reiche sie ein!
            </p>
            <Link
              href="/forum#new-post"
              className="inline-flex items-center gap-2 text-sm text-gray-900 font-medium hover:text-gray-700"
            >
              Projekt vorschlagen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Founders List */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Alle Founders</h2>
              <p className="text-sm text-gray-600">{foundersCount} Founders bereits dabei</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {founders.map(founder => (
              <div
                key={founder.founderNumber}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">
                        #{founder.founderNumber}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{founder.name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(founder.joinedDate).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  {founder.status === 'active' && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {foundersCount < MAX_GROUP_SIZE && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Noch {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze bis zur Maximalgröße. Lade Freunde ein!
              </p>
              <button
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Einladungslink kopieren
              </button>
              {inviteStatus && (
                <p className="text-xs text-gray-500 mt-2">{inviteStatus}</p>
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-display text-sm tracking-widest text-gray-500 uppercase">Lade Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}