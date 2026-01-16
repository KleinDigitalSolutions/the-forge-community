'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { PricingTable } from '@/app/components/PricingTable';
import {
  ArrowRight,
  Check,
  Users,
  TrendingUp,
  Vote,
  MessageSquare,
  FileText,
  Calendar,
  Sparkles,
  Shield,
  Target,
  Zap,
  Menu,
  X,
} from 'lucide-react';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export default function Home() {
  const [foundersCount, setFoundersCount] = useState(0);
  const MAX_GROUP_SIZE = 25;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content:
        'Ich bin Orion, dein AI-Concierge für STAKE & SCALE. Frag mich alles zu unserem Modell, Projekten, Voting oder Transparenz.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'loading'>('idle');
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    why: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');

  const refreshFoundersCount = useCallback(async () => {
    try {
      const response = await fetch('/api/founders');
      if (response.ok) {
        const data = await response.json();
        const founders = Array.isArray(data) ? data : data.founders || [];
        const activeCount =
          typeof data.count === 'number'
            ? data.count
            : founders.filter((f: { status?: string }) => f.status === 'active').length;
        setFoundersCount(activeCount);
      }
    } catch (error) {
      console.error('Error fetching founders count:', error);
    }
  }, []);

  useEffect(() => {
    refreshFoundersCount();
  }, [refreshFoundersCount]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isChatOpen) {
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isChatOpen]);

  const handleOpenMenu = () => {
    setIsMenuOpen(true);
    setIsChatOpen(false);
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleFormChange =
    (field: keyof typeof formData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim() || chatStatus === 'loading') {
      return;
    }

    const message = chatInput.trim();
    const history = chatMessages.slice(-6).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatInput('');
    setChatStatus('loading');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.details) {
          console.error('Groq error details:', data.details);
        }
        throw new Error(data?.error || 'Chat request failed');
      }

      const reply =
        typeof data.message === 'string' && data.message.trim()
          ? data.message.trim()
          : 'Danke dir. Kannst du deine Frage etwas präziser stellen?';

      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, ich hatte gerade einen Fehler. Versuch es bitte nochmal.',
        },
      ]);
    } finally {
      setChatStatus('idle');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormMessage('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormStatus('error');
      setFormMessage('Bitte Name und E-Mail ausfüllen.');
      return;
    }

    setFormStatus('loading');
    try {
      const response = await fetch('/api/founders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          instagram: formData.instagram.trim(),
          why: formData.why.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setFormStatus('success');
      setFormMessage('Danke! Deine Bewerbung ist eingegangen. Wir melden uns in Kürze.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        instagram: '',
        why: '',
      });
      refreshFoundersCount();
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus('error');
      setFormMessage('Bewerbung konnte nicht gesendet werden. Bitte versuche es erneut.');
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
              <div className="text-xs text-[var(--secondary)]">Community Venture Studio</div>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6 items-center text-[0.7rem] uppercase tracking-[0.28em] text-[var(--secondary)]">
            <Link
              href="/dashboard"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/transparency"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Transparenz
            </Link>
            <Link href="/forum" className="hover:text-[var(--foreground)] transition-colors">
              Forum
            </Link>
            <a
              href="#apply"
              className="bg-[var(--accent)] text-white px-4 py-2 rounded-full hover:bg-[#0b2f24] transition-colors text-[0.65rem] tracking-[0.3em] uppercase"
            >
              Founder werden
            </a>
          </nav>
          <button
            type="button"
            onClick={handleOpenMenu}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--border)] text-[var(--foreground)] hover:bg-white/70 transition-colors"
            aria-label="Menue oeffnen"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      <div
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-[78%] max-w-xs bg-[var(--surface)] z-50 border-l border-[var(--border)] shadow-2xl transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[var(--secondary)]">
            Navigation
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-[var(--border)] text-[var(--foreground)] hover:bg-white/70 transition-colors"
            aria-label="Menue schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6 flex flex-col gap-4 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--secondary)]">
          <Link
            href="/dashboard"
            onClick={() => setIsMenuOpen(false)}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/transparency"
            onClick={() => setIsMenuOpen(false)}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Transparenz
          </Link>
          <Link
            href="/forum"
            onClick={() => setIsMenuOpen(false)}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Forum
          </Link>
          <a
            href="#apply"
            onClick={() => setIsMenuOpen(false)}
            className="mt-2 inline-flex items-center justify-center bg-[var(--accent)] text-white px-4 py-3 rounded-full hover:bg-[#0b2f24] transition-colors text-[0.65rem] tracking-[0.3em] uppercase"
          >
            Founder werden
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-24 pb-14 px-5 sm:pt-32 sm:pb-20 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-5 flex flex-col items-center gap-2 sm:mb-6 sm:gap-3">
            <div className="flex items-center gap-3 text-[0.6rem] uppercase tracking-[0.3em] text-[var(--secondary)] sm:gap-4 sm:text-[0.7rem] sm:tracking-[0.45em]">
              <span className="h-px w-8 bg-[var(--border)] sm:w-10" />
              Stake &amp; Scale
              <span className="h-px w-8 bg-[var(--border)] sm:w-10" />
            </div>
            <div className="flex items-center gap-2 text-[0.65rem] text-[var(--secondary)] tracking-[0.14em] uppercase sm:gap-3 sm:text-[0.8rem] sm:tracking-[0.18em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              {foundersCount} Founders bereits dabei
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-[var(--foreground)] mb-5 leading-[1.1] tracking-[-0.02em] sm:mb-6 sm:leading-[1.05]">
            Baue echte Projekte.
            <br />
            In flexiblen Gruppen.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[var(--secondary)] mb-6 max-w-2xl mx-auto sm:mb-8 sm:max-w-3xl">
            STAKE & SCALE verbindet Founder-Gruppen, die gemeinsam profitable Projekte bauen.
            Flexible Startkapital-Tiers, professionelle Infrastruktur, klare Prozesse.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
            <a
            href="#apply"
              className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-[var(--accent)] text-white px-5 py-3 sm:px-6 rounded-full hover:bg-[#0b2f24] transition-colors text-[0.65rem] sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase w-full sm:w-auto"
            >
              Jetzt Founder werden
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
            <Link
              href="/transparency"
              className="inline-flex items-center justify-center gap-2 sm:gap-3 border border-[var(--accent)] text-[var(--accent)] px-5 py-3 sm:px-6 rounded-full hover:bg-[var(--accent)] hover:text-white transition-colors text-[0.65rem] sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase w-full sm:w-auto"
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Transparenz ansehen
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-display text-[var(--foreground)] mb-1">
                Flexibel
              </div>
              <div className="text-[0.6rem] sm:text-[0.7rem] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--secondary)]">
                Startkapital
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-display text-[var(--foreground)] mb-1">
                Gleich
              </div>
              <div className="text-[0.6rem] sm:text-[0.7rem] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--secondary)]">
                Anteile
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-display text-[var(--foreground)] mb-1">
                Klar
              </div>
              <div className="text-[0.6rem] sm:text-[0.7rem] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--secondary)]">
                Struktur
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Was ist STAKE & SCALE? */}
      <section className="py-14 px-5 sm:py-20 sm:px-6 bg-[var(--surface-muted)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-[var(--foreground)] mb-4">
              So funktioniert's
            </h2>
            <p className="text-base sm:text-lg text-[var(--secondary)] max-w-2xl mx-auto">
              Drei Start-Tiers: 25k / 50k / 100k. Maximal 25 Founder pro Gruppe. Beitrag =
              Zielkapital ÷ Mitgliederzahl.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)]" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[var(--foreground)] mb-3">
                Gleichberechtigt
              </h3>
              <p className="text-sm sm:text-base text-[var(--secondary)]">
                Jeder zahlt den gleichen Beitrag in der Gruppe. Anteile werden gleich verteilt
                (Anteil = 1 ÷ Mitgliederzahl). Keine komplexen Cap Tables, keine Hierarchien.
              </p>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center mb-4">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)]" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[var(--foreground)] mb-3">
                Demokratisch
              </h3>
              <p className="text-sm sm:text-base text-[var(--secondary)]">
                Alle stimmen ab, welches Projekt gebaut wird. Die besten Ideen gewinnen.
                Jeder kann mitmachen – von Marketing bis Entwicklung.
              </p>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 sm:p-8 shadow-sm">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)]" />
              </div>
              <h3 className="text-lg sm:text-xl font-display text-[var(--foreground)] mb-3">
                Transparent
              </h3>
              <p className="text-sm sm:text-base text-[var(--secondary)]">
                Jeder Euro ist nachvollziehbar. Live-Dashboard zeigt Einnahmen, Ausgaben und Progress.
                Kein Verstecken, keine Überraschungen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Erstes Projekt: SmartStore */}
      <section className="py-14 px-5 sm:py-20 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-[var(--accent-glow)] text-[var(--accent)] px-4 py-2 rounded-full text-[0.6rem] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] mb-4 font-medium">
              <Sparkles className="w-4 h-4" />
              Aktuelles Projekt – Voting läuft jetzt
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-[var(--foreground)] mb-4">
              SmartStore: Dein erster Exit wartet
            </h2>
            <p className="text-base sm:text-lg text-[var(--secondary)] max-w-2xl mx-auto">
              Ein profitables 3PL Fulfillment Business. Echte Kunden, echte Revenue, echtes Wachstum.
              Das ist kein Hobby-Projekt – das wird dein erster erfolgreicher Exit.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[var(--accent)] to-[#0b2f24] rounded-2xl p-6 sm:p-8 md:p-12 text-white shadow-xl">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-display mb-3 sm:mb-4">Warum das funktioniert</h3>
                <p className="text-sm sm:text-base text-white/80">
                  Kleine Brands zahlen 3PLs ein Vermögen für schlechten Service. Wir bieten
                  professionelles Fulfillment zu fairen Preisen. Keine Mindestabnahme, keine versteckten Kosten.
                </p>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-display mb-3 sm:mb-4">Der Plan</h3>
                <p className="text-sm sm:text-base text-white/80">
                  10 Kunden in 6 Monaten. 1.200+ Orders/Monat. Profitabel ab Monat 4.
                  Das ist kein "vielleicht" – das ist ein klarer Path to Revenue.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
                <div className="text-xl sm:text-2xl font-display mb-1">10 Kunden</div>
                <div className="text-[0.55rem] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">
                  Ziel in 6 Monaten
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
                <div className="text-xl sm:text-2xl font-display mb-1">1.200+</div>
                <div className="text-[0.55rem] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">
                  Orders/Monat geplant
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10">
                <div className="text-xl sm:text-2xl font-display mb-1">25k / 50k / 100k</div>
                <div className="text-[0.55rem] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">
                  Startkapital je Gruppe
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 sm:gap-3 bg-[#f8f4f0] text-[var(--accent)] px-5 py-3 sm:px-6 rounded-full hover:bg-white transition-colors text-[0.65rem] sm:text-sm tracking-[0.2em] sm:tracking-[0.25em] uppercase"
              >
                Zum Voting
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Features */}
      <section className="py-14 px-5 sm:py-20 sm:px-6 bg-[var(--surface-muted)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-[var(--foreground)] mb-4">
              Alles was du brauchst, an einem Ort
            </h2>
            <p className="text-base sm:text-lg text-[var(--secondary)] max-w-2xl mx-auto">
              Von Voting über Finanzen bis Forum – die komplette Infrastruktur ist ready.
              Du fokussierst dich aufs Bauen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Vote className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display text-[var(--foreground)] mb-2">
                    Projekt Voting
                  </h3>
                  <p className="text-[var(--secondary)] text-sm sm:text-base">
                    Stimme über neue Projekte ab. Jeder Founder hat eine Stimme. Demokratisch und
                    transparent.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display text-[var(--foreground)] mb-2">Community Forum</h3>
                  <p className="text-[var(--secondary)] text-sm sm:text-base">
                    Teile Ideen, stelle Fragen, diskutiere Strategien. Kategorisiert und
                    durchsuchbar.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display text-[var(--foreground)] mb-2">
                    Finanz-Transparenz
                  </h3>
                  <p className="text-[var(--secondary)] text-sm sm:text-base">
                    Jede Transaktion öffentlich einsehbar. Live-Tracking von Einnahmen, Ausgaben und
                    Kapital-Progress.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display text-[var(--foreground)] mb-2">Task Management</h3>
                  <p className="text-[var(--secondary)] text-sm sm:text-base">
                    Klare Aufgabenverteilung, Deadlines und Status-Tracking für alle Founder.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display text-[var(--foreground)] mb-2">Events & Termine</h3>
                  <p className="text-[var(--secondary)] text-sm sm:text-base">
                    Founder Calls, Deadlines, Launch-Dates – alles an einem Ort.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--accent-glow)] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display text-[var(--foreground)] mb-2">
                    Dokumente & Verträge
                  </h3>
                  <p className="text-[var(--secondary)] text-sm sm:text-base">
                    Zentrale Ablage für alle wichtigen Dokumente, Verträge und Guides.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership / Pricing */}
      <section className="py-20 px-6 bg-[var(--background)]">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display text-[var(--foreground)] mb-4">
                Wähle deinen Einstieg
              </h2>
              <p className="text-lg text-[var(--secondary)] max-w-2xl mx-auto">
                Egal ob du gerade startest oder schon skalierst – wir haben das passende Modell für maximalen Erfolg.
              </p>
            </div>
            
            <PricingTable 
              isLoading={false} 
              onSelectPlan={() => {
                // Scroll to application form as they are not logged in yet
                document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
              }} 
            />
         </div>
      </section>

      {/* Wie es funktioniert */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display text-[var(--foreground)] mb-4">
              So funktioniert&apos;s
            </h2>
            <p className="text-lg text-[var(--secondary)] max-w-2xl mx-auto">
              In 4 einfachen Schritten vom Bewerbung zum Founder
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Bewerbung',
                description: 'Füll das Formular aus und erzähl uns warum du dabei sein willst.',
              },
              {
                step: '2',
                title: 'Review',
                description: 'Wir prüfen deine Bewerbung und melden uns innerhalb von 48h.',
              },
              {
                step: '3',
                title: 'Investment',
                description:
                  'Investment: Beitrag richtet sich nach Zielkapital und Gruppengröße (gleich verteilt).',
              },
              {
                step: '4',
                title: 'Build',
                description:
                  'Stimme ab, diskutiere, baue mit. Du bist jetzt gleichberechtigter Founder.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-lg font-display mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-display text-[var(--foreground)] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-[var(--surface-muted)]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 md:p-12 shadow-sm">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-display text-[var(--foreground)] mb-4">
                  Warum das anders ist
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">Keine Solo-Gründung</div>
                      <div className="text-sm text-[var(--secondary)]">
                        Du bist nicht allein. Andere Founder pushen das Projekt mit dir.
                        Mehr Skills, mehr Energie, mehr Erfolg.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">Kein Inkubator-Bullshit</div>
                      <div className="text-sm text-[var(--secondary)]">
                        Keine Workshops, keine "Mentoren", kein Theater. Nur echtes Building,
                        echte Revenue, echte Exits.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">Skin in the Game</div>
                      <div className="text-sm text-[var(--secondary)]">
                        Jeder zahlt den gleichen Beitrag. Jeder hat echtes Ownership. Keine Free-Rider,
                        keine Talker – nur Doers.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-[var(--foreground)]">100% Transparent</div>
                      <div className="text-sm text-[var(--secondary)]">
                        Jeder Euro wird getrackt. Keine versteckten Fees, keine Überraschungen.
                        Du weißt immer, was läuft.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[var(--accent)] to-[#0b2f24] rounded-xl p-8 text-white shadow-lg">
                <div className="text-xs uppercase tracking-[0.25em] text-white/70 mb-2">
                  Dein ROI
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="text-3xl font-display mb-1">Beitrag</div>
                    <div className="text-xs uppercase tracking-[0.25em] text-white/70">
                      Variabel je Gruppe
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-display mb-1">1/N</div>
                    <div className="text-xs uppercase tracking-[0.25em] text-white/70">
                      Anteil je Founder
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-display mb-1">€???</div>
                    <div className="text-xs uppercase tracking-[0.25em] text-white/70">
                      Exit Value (du entscheidest)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="apply" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display text-[var(--foreground)] mb-4">
              Noch {Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze bis zur Maximalgröße
            </h2>
            <p className="text-lg text-[var(--secondary)]">
              Bewirb dich jetzt. Wenn du reinkommst, zahlst du deinen Beitrag und bist Teil der ersten Gruppe.
              Let's build something real.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm"
          >
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-[var(--secondary)] mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange('name')}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none bg-white/80"
                  placeholder="Dein vollständiger Name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--secondary)] mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange('email')}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none bg-white/80"
                  placeholder="deine@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--secondary)] mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleFormChange('phone')}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none bg-white/80"
                  placeholder="+49 123 456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--secondary)] mb-2">Instagram</label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={handleFormChange('instagram')}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none bg-white/80"
                  placeholder="@deinusername"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--secondary)] mb-2">
                Warum willst du dabei sein?
              </label>
              <textarea
                value={formData.why}
                onChange={handleFormChange('why')}
                rows={4}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none resize-none bg-white/80"
                placeholder="Erzähl uns kurz, warum du Teil von STAKE & SCALE werden möchtest..."
              />
            </div>

            {formMessage && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  formStatus === 'success'
                    ? 'bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent-soft)]'
                    : 'bg-[#f7e3e1] text-[#7d2b20] border border-[#e7b9b2]'
                }`}
              >
                {formMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={formStatus === 'loading'}
              className="w-full bg-[var(--accent)] text-white py-3 rounded-full hover:bg-[#0b2f24] transition-colors text-sm tracking-[0.3em] uppercase disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {formStatus === 'loading' ? 'Wird gesendet...' : 'Bewerbung absenden'}
            </button>

            <p className="text-xs text-[var(--secondary)] mt-4 text-center">
              Mit der Bewerbung akzeptierst du unsere{' '}
              <Link href="/legal/agb" className="underline hover:text-[var(--accent)]">
                AGB
              </Link>{' '}
              und{' '}
              <Link href="/legal/datenschutz" className="underline hover:text-[var(--accent)]">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--surface-muted)] border-t border-[var(--border)] py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-display text-[var(--foreground)] mb-4">STAKE & SCALE</div>
              <p className="text-sm text-[var(--secondary)]">
                Die Plattform die Gruppen von Foundern verbindet. Mehrere Gruppen, mehrere Projekte,
                eine Infrastruktur.
              </p>
            </div>

            <div>
              <div className="font-medium text-[var(--foreground)] mb-4">Community</div>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard" className="block text-[var(--secondary)] hover:text-[var(--accent)]">
                  Dashboard
                </Link>
                <Link href="/forum" className="block text-[var(--secondary)] hover:text-[var(--accent)]">
                  Forum
                </Link>
                <Link href="/transparency" className="block text-[var(--secondary)] hover:text-[var(--accent)]">
                  Transparenz
                </Link>
              </div>
            </div>

            <div>
              <div className="font-medium text-[var(--foreground)] mb-4">Legal</div>
              <div className="space-y-2 text-sm">
                <Link href="/legal/impressum" className="block text-[var(--secondary)] hover:text-[var(--accent)]">
                  Impressum
                </Link>
                <Link
                  href="/legal/datenschutz"
                  className="block text-[var(--secondary)] hover:text-[var(--accent)]"
                >
                  Datenschutz
                </Link>
                <Link href="/legal/agb" className="block text-[var(--secondary)] hover:text-[var(--accent)]">
                  AGB
                </Link>
              </div>
            </div>

            <div>
              <div className="font-medium text-[var(--foreground)] mb-4">Status</div>
              <div className="space-y-2 text-sm text-[var(--secondary)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--accent)] rounded-full" />
                  Recruiting aktiv
                </div>
                <div>Flexible Gruppengrößen</div>
                <div>{foundersCount} Total Founders</div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--secondary)]">
            © 2026 STAKE & SCALE. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {isChatOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={handleCloseChat}
        />
      )}

      <button
        type="button"
        onClick={isChatOpen ? handleCloseChat : handleOpenChat}
        className="fixed bottom-5 right-4 md:bottom-6 md:right-6 z-40 h-10 w-10 md:h-12 md:w-12 rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[#0b2f24] transition-colors flex items-center justify-center"
        aria-label="Chat mit Orion"
      >
        {isChatOpen ? <X className="h-4 w-4 md:h-5 md:w-5" /> : <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />}
      </button>

      <div
        className={`fixed bottom-20 right-4 md:bottom-24 md:right-6 z-50 w-[88vw] max-w-[19rem] md:max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-all duration-300 ${
          isChatOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Orion Chat"
        aria-hidden={!isChatOpen}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-display text-[0.6rem] md:text-xs tracking-[0.25em]">
              O
            </div>
            <div>
              <div className="text-[0.6rem] md:text-[0.65rem] uppercase tracking-[0.3em] md:tracking-[0.35em] text-[var(--secondary)]">
                Orion
              </div>
              <div className="text-[0.65rem] md:text-xs text-[var(--secondary)]">AI Concierge</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseChat}
            className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full border border-[var(--border)] text-[var(--foreground)] hover:bg-white/70 transition-colors"
            aria-label="Chat schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3 md:px-5 md:py-4 space-y-3 md:space-y-4 max-h-[45vh] md:max-h-[52vh] overflow-y-auto">
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)]'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {chatStatus === 'loading' && (
            <div className="flex justify-start">
              <div className="rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 text-[0.55rem] md:text-[0.6rem] uppercase tracking-[0.25em] md:tracking-[0.3em] text-[var(--secondary)] border border-[var(--border)] bg-[var(--surface-muted)]">
                Orion schreibt...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleChatSubmit}
          className="px-4 py-3 md:px-5 md:py-4 border-t border-[var(--border)] flex items-center gap-2 md:gap-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Frag Orion..."
            className="flex-1 px-3 py-2 md:px-4 border border-[var(--border)] rounded-full focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none text-xs md:text-sm bg-white/80"
          />
          <button
            type="submit"
            disabled={chatStatus === 'loading'}
            className="bg-[var(--accent)] text-white px-3 py-2 md:px-4 rounded-full hover:bg-[#0b2f24] transition-colors text-[0.55rem] md:text-[0.65rem] tracking-[0.25em] md:tracking-[0.3em] uppercase disabled:opacity-60"
          >
            Senden
          </button>
        </form>
      </div>
    </div>
  );
}
