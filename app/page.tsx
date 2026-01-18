'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header';
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
  X,
} from 'lucide-react';

type ChatMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export default function Home() {
  const [foundersCount, setFoundersCount] = useState(0);
  const MAX_GROUP_SIZE = 25;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState<'investor' | 'builder' | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    why: '',
    capital: '',
    commitment: '',
    skill: '',
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
    if (!isChatOpen) {
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages, isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSelectRole = (selectedRole: 'investor' | 'builder') => {
    setRole(selectedRole);
    setFormData(prev => ({ ...prev, capital: selectedRole === 'builder' ? '0€ (Sweat Equity)' : '' }));
    handleNextStep();
  };

  const handleFormChange =
    (field: keyof typeof formData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          ...formData,
          role, // Send the role too
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setFormStatus('success');
      setFormMessage('Danke! Deine Bewerbung ist eingegangen. Wir melden uns in Kürze.');
      // Reset form after delay or show success screen
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormStatus('error');
      setFormMessage('Bewerbung konnte nicht gesendet werden. Bitte versuche es erneut.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Smart Header */}
      <Header />

      {/* Hero Section - Clean Professional */}
      <section className="pt-32 pb-20 px-6 sm:pt-40 sm:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-[var(--foreground)] mb-8 leading-tight tracking-tight">
              Baue echte Projekte.<br />
              In flexiblen Gruppen.
            </h1>

            <p className="text-xl sm:text-2xl text-[var(--muted-foreground)] mb-12 max-w-3xl mx-auto leading-relaxed">
              STAKE & SCALE verbindet Founder-Gruppen, die gemeinsam profitable Businesses bauen. Flexible Startkapital-Tiers, professionelle Infrastruktur, klare Prozesse.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#apply"
                className="inline-flex items-center justify-center gap-2 bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Jetzt Founder werden
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/transparency"
                className="inline-flex items-center justify-center gap-2 border border-[var(--border)] text-[var(--foreground)] px-8 py-4 rounded-lg hover:bg-[var(--surface-muted)] transition-colors font-medium"
              >
                Transparenz ansehen
              </Link>
            </div>
          </div>

          {/* Trust Indicators - Simple */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t border-[var(--border)]">
            <div className="text-center">
              <div className="text-3xl font-semibold text-[var(--foreground)] mb-2">Flexibel</div>
              <div className="text-sm text-[var(--muted-foreground)]">Startkapital</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-[var(--foreground)] mb-2">Gleich</div>
              <div className="text-sm text-[var(--muted-foreground)]">Anteile</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-semibold text-[var(--foreground)] mb-2">Klar</div>
              <div className="text-sm text-[var(--muted-foreground)]">Struktur</div>
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
            <p className="text-base sm:text-lg text-[var(--secondary)] max-w-2xl mx-auto leading-relaxed">
              Drei Start-Tiers: 25k / 50k / 100k.<br />
              Maximal 25 Founder pro Gruppe.<br />
              <span className="font-medium text-[var(--foreground)]">Beitrag = Zielkapital ÷ Mitgliederzahl.</span>
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

      {/* Erstes Projekt: SmartStore - Clean */}
      <section className="py-24 px-6 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <div className="inline-block px-4 py-2 bg-[var(--surface-muted)] rounded-full text-sm font-medium mb-6">
              Erstes Projekt
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-[var(--foreground)] mb-6">
              SmartStore: The 3PL Revolution
            </h2>
            <p className="text-xl text-[var(--muted-foreground)] max-w-3xl">
              Wir lösen ein echtes Problem: Kleine E-Commerce Brands werden von großen Logistikern ignoriert oder überbezahlt. SmartStore ist das Boutique-Fulfillment, das mitskaliert.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Key Metrics</h3>
              <div className="space-y-4">
                <div className="border border-[var(--border)] rounded-lg p-6">
                  <div className="text-3xl font-semibold mb-2">€12k+ MRR</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Target nach 6 Monaten</div>
                </div>
                <div className="border border-[var(--border)] rounded-lg p-6">
                  <div className="text-3xl font-semibold mb-2">2.5x Multiple</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Estimated Exit</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-6">Path to Exit</h3>
              <div className="space-y-6">
                {[
                  { month: '01-02', title: 'Infrastructure', desc: 'Setup Warehouse & Software-Integration' },
                  { month: '03-04', title: 'Beta Launch', desc: 'Onboarding der ersten 5 Ankerkunden' },
                  { month: '05-06', title: 'Scaling', desc: 'Automatisierung & Expansion auf 15+ Kunden' }
                ].map((step, i) => (
                  <div key={i} className="border-l-2 border-[var(--border)] pl-6">
                    <div className="text-sm text-[var(--muted-foreground)] mb-1">Monat {step.month}</div>
                    <div className="text-lg font-semibold mb-2">{step.title}</div>
                    <div className="text-sm text-[var(--muted-foreground)]">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'High Margin', desc: 'Über 35% Marge durch optimierte Prozesse und dezentrale Lagerhaltung' },
              { title: 'Asset Light', desc: 'Bestehende Infrastruktur-Partner minimieren Risiko und gebundenes Kapital' },
              { title: 'Ready to Scale', desc: 'Blaupausen-fähiges Modell für schnelle Expansion in weitere Städte' }
            ].map((item, i) => (
              <div key={i} className="border border-[var(--border)] rounded-lg p-6 hover:border-[var(--foreground)] transition-colors hover-lift">
                <h4 className="text-lg font-semibold mb-3">{item.title}</h4>
                <p className="text-sm text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Business Case ansehen
              <ArrowRight className="h-5 w-5" />
            </Link>
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
      <section id="apply" className="py-24 px-6 bg-[var(--background)] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-[var(--accent)] mb-4">
              <Shield className="w-5 h-5" />
              <span className="text-[0.65rem] uppercase tracking-[0.4em]">Limited Partnership</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display text-[var(--foreground)] mb-6">
              Werde Teil des Circles.
            </h2>
            <p className="text-lg text-[var(--secondary)] max-w-2xl mx-auto leading-relaxed">
              Wir suchen keine passiven Investoren. Wir suchen Macher, Visionäre und Experten, die Skin in the Game wollen. Aktuell sind noch <span className="text-[var(--foreground)] font-semibold">{Math.max(0, MAX_GROUP_SIZE - foundersCount)} von {MAX_GROUP_SIZE} Plätzen</span> in der aktuellen Gruppe verfügbar.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-b from-[var(--border)] to-transparent rounded-[2.5rem] opacity-50" />
            <form
              onSubmit={handleSubmit}
              className="relative bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 md:p-12 shadow-xl min-h-[500px] flex flex-col justify-center"
            >
              {formStatus === 'success' ? (
                <div className="text-center animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-display mb-4">Bewerbung empfangen</h3>
                  <p className="text-[var(--secondary)]">
                    Wir melden uns innerhalb von 48 Stunden bei dir.<br/>
                    Halte deine E-Mails im Blick.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step Indicators */}
                  <div className="flex justify-center gap-2 mb-10">
                    {[1, 2, 3].map(step => (
                      <div 
                        key={step} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentStep >= step ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-[var(--border)]'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* STEP 1: ROLE */}
                  {currentStep === 1 && (
                    <div className="animate-fade-in">
                      <h3 className="text-xl font-display text-center mb-8">Wie willst du einsteigen?</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handleSelectRole('investor')}
                          className="p-6 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-[var(--accent-glow)] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                          </div>
                          <div className="font-bold mb-1">Capital Partner</div>
                          <div className="text-xs text-[var(--secondary)] leading-relaxed">
                            Ich investiere meinen Anteil am Gruppen-Ziel (z.B. 1.000€ bei 25k Ziel & 25 Foundern).
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectRole('builder')}
                          className="p-6 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="font-bold mb-1">Builder (Sweat Equity)</div>
                          <div className="text-xs text-[var(--secondary)] leading-relaxed">
                            Ich habe kein Kapital, aber Skills & Zeit (15h+/Woche). Ich zahle mit Leistung.
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: DETAILS */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in space-y-6">
                      <h3 className="text-xl font-display text-center mb-6">
                        {role === 'investor' ? 'Dein Profil' : 'Deine Skills'}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--secondary)] ml-1">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={handleFormChange('name')}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                            placeholder="Dein Name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--secondary)] ml-1">E-Mail</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={handleFormChange('email')}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                            placeholder="mail@example.com"
                          />
                        </div>
                      </div>

                      {role === 'investor' ? (
                         <div className="space-y-1">
                           <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--secondary)] ml-1">Präferiertes Gruppen-Ziel</label>
                           <select
                              value={formData.capital}
                              onChange={handleFormChange('capital')}
                              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all appearance-none"
                           >
                             <option value="">Bitte wählen...</option>
                             <option value="25k">25.000 € Gruppe (Starter)</option>
                             <option value="50k">50.000 € Gruppe (Growth)</option>
                             <option value="100k">100.000 € Gruppe (Pro)</option>
                           </select>
                         </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--secondary)] ml-1">Dein stärkster Skill</label>
                          <input
                            type="text"
                            value={formData.skill}
                            onChange={handleFormChange('skill')}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                            placeholder="z.B. Frontend Dev, Performance Marketing, Sales"
                          />
                        </div>
                      )}

                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button" 
                          onClick={handlePrevStep}
                          className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)]"
                        >
                          Zurück
                        </button>
                        <button 
                          type="button" 
                          onClick={handleNextStep}
                          disabled={!formData.name || !formData.email}
                          className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[#0b2f24] disabled:opacity-50"
                        >
                          Weiter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MOTIVATION */}
                  {currentStep === 3 && (
                    <div className="animate-fade-in space-y-6">
                      <h3 className="text-xl font-display text-center mb-6">Dein Pitch</h3>
                      
                      <div className="space-y-1">
                        <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--secondary)] ml-1">
                          {role === 'builder' 
                            ? 'Warum sollten wir in DICH investieren? (Sweat Equity)' 
                            : 'Was erwartest du von der Gruppe?'}
                        </label>
                        <textarea
                          value={formData.why}
                          onChange={handleFormChange('why')}
                          rows={4}
                          className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all resize-none"
                          placeholder={role === 'builder' ? "Überzeuge uns. Keine Standardfloskeln." : "Deine Ziele und Vision..."}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[0.6rem] uppercase tracking-[0.2em] text-[var(--secondary)] ml-1">Instagram / LinkedIn (Optional)</label>
                        <input
                            type="text"
                            value={formData.instagram}
                            onChange={handleFormChange('instagram')}
                            className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                            placeholder="Link zum Profil"
                          />
                      </div>

                      {formMessage && (
                        <p className="text-center text-red-500 text-sm">{formMessage}</p>
                      )}

                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button" 
                          onClick={handlePrevStep}
                          className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)]"
                        >
                          Zurück
                        </button>
                        <button 
                          type="submit" 
                          disabled={formStatus === 'loading'}
                          className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[#0b2f24] disabled:opacity-50 shadow-lg"
                        >
                          {formStatus === 'loading' ? 'Sende...' : 'Bewerbung absenden'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </form>
          </div>
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
