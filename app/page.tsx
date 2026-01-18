'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { PricingTable } from '@/app/components/PricingTable';
import {
  ArrowRight,
  Check,
  TrendingUp,
  Vote,
  MessageSquare,
  FileText,
  Calendar,
  Target,
  Zap,
  X,
  Shield,
  Layers,
  BarChart,
  Users
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)]">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden industrial-texture">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full blur-[128px]" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-[var(--color-forge-ember)] rounded-full blur-[128px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[var(--color-forge-ember)] animate-pulse" />
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--secondary)] font-medium">Limited Access Phase</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-[88px] font-display font-bold text-[var(--foreground)] mb-8 leading-[1.05] tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Baue echte Projekte <br/>
            <span className="gradient-gold">in flexiblen Gruppen</span>
          </h1>

          <p className="text-xl sm:text-2xl text-[var(--muted-foreground)] mb-12 leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Bewirb dich in 10 Minuten und werde Teil einer exklusiven Founder-Community, die gemeinsam profitable Businesses schmiedet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <a
              href="#apply"
              className="ember-glow w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-2xl hover:brightness-110 transition-all font-bold text-sm uppercase tracking-widest shadow-2xl"
            >
              Jetzt bewerben
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/transparency"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[var(--border)] text-[var(--foreground)] rounded-2xl hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all font-bold text-sm uppercase tracking-widest"
            >
              Transparenz
            </Link>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-12 px-6 border-y border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center md:text-left">
              <div className="text-3xl sm:text-4xl font-display font-bold text-[var(--foreground)] mb-1">
                {Math.max(0, MAX_GROUP_SIZE - foundersCount)}
              </div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Verfügbare Plätze</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl sm:text-4xl font-display font-bold text-[var(--foreground)] mb-1">100%</div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Transparenz</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl sm:text-4xl font-display font-bold text-[var(--foreground)] mb-1">25k+</div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Target Capital</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl sm:text-4xl font-display font-bold text-[var(--foreground)] mb-1">Equal</div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)]">Equity Split</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-[var(--accent)] text-xs font-bold uppercase tracking-[0.4em] mb-4 block">The Process</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-[var(--foreground)] mb-6">
              Vom Konzept zum Cashflow
            </h2>
            <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
              Kein unnötiger Ballast. Wir fokussieren uns auf das, was zählt: Bauen, Launching, Scaling.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-muted)] flex items-center justify-center mb-8 group-hover:bg-[var(--accent)] transition-colors duration-500">
                <Users className="w-8 h-8 text-[var(--foreground)] group-hover:text-[var(--accent-foreground)]" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Gleichberechtigt</h3>
              <p className="text-[var(--secondary)] leading-relaxed">
                Jeder zahlt den gleichen Beitrag. Anteile werden gleich verteilt. Keine komplexen Cap Tables, keine stillen Teilhaber. 
                <span className="block mt-4 text-[var(--accent)] font-medium">1 Member = 1 Vote</span>
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-muted)] flex items-center justify-center mb-8 group-hover:bg-[var(--accent)] transition-colors duration-500">
                <Layers className="w-8 h-8 text-[var(--foreground)] group-hover:text-[var(--accent-foreground)]" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Demokratisch</h3>
              <p className="text-[var(--secondary)] leading-relaxed">
                Die Community entscheidet, was gebaut wird. Pitch deine Ideen oder stimme für andere ab. Die besten Konzepte gewinnen durch Mehrheit.
                <span className="block mt-4 text-[var(--accent)] font-medium">Power to the Builders</span>
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-muted)] flex items-center justify-center mb-8 group-hover:bg-[var(--accent)] transition-colors duration-500">
                <BarChart className="w-8 h-8 text-[var(--foreground)] group-hover:text-[var(--accent-foreground)]" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Transparent</h3>
              <p className="text-[var(--secondary)] leading-relaxed">
                Jeder Cent ist nachvollziehbar. Live-Dashboard für alle Einnahmen & Ausgaben. Volle Einsicht in die Bücher zu jeder Zeit.
                <span className="block mt-4 text-[var(--accent)] font-medium">Open Metrics</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Project */}
      <section className="py-32 px-6 bg-[var(--surface-muted)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--background)] border border-[var(--accent)] mb-8">
                <span className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--accent)] font-bold">Featured Project</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-bold text-[var(--foreground)] mb-8">
                SmartStore <br/>
                <span className="text-[var(--secondary)] text-4xl md:text-6xl">3PL Revolution</span>
              </h2>
              <p className="text-lg text-[var(--secondary)] mb-12 leading-relaxed">
                Wir lösen ein echtes Problem: Kleine E-Commerce Brands werden von großen Logistikern ignoriert. SmartStore bietet Enterprise-Grade Fulfillment für die Nische.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                <div className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                  <div className="text-3xl font-display font-bold text-[var(--foreground)] mb-2">€12k+</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Monthly Recurring Revenue</div>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
                  <div className="text-3xl font-display font-bold text-[var(--foreground)] mb-2">2.5x</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Exit Multiple Target</div>
                </div>
              </div>

              <button className="text-[var(--accent)] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">
                View Project Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent)] to-[var(--color-forge-ember)] rounded-[2.5rem] opacity-20 blur-2xl"></div>
              <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-[2rem] p-8 shadow-2xl">
                <h3 className="text-2xl font-display font-bold mb-8">Path to Exit</h3>
                <div className="space-y-8">
                  {[
                    { month: '01-02', title: 'Infrastructure', desc: 'Setup Warehouse & Software-Integration' },
                    { month: '03-04', title: 'Beta Launch', desc: 'Onboarding der ersten 5 Ankerkunden' },
                    { month: '05-06', title: 'Scaling', desc: 'Automatisierung & Expansion auf 15+ Kunden' }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <div className="font-mono text-[var(--accent)] font-bold pt-1">{step.month}</div>
                      <div className="flex-1 pb-8 border-b border-[var(--border)] group-last:border-0 group-last:pb-0">
                        <div className="text-lg font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">{step.title}</div>
                        <div className="text-[var(--secondary)] text-sm">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-[var(--foreground)] mb-6">
              Infrastructure Ready
            </h2>
            <p className="text-[var(--secondary)]">
              Alles was du brauchst ist bereits da. Du fokussierst dich aufs Bauen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Vote, title: 'Voting System', desc: 'Demokratische Entscheidungsfindung für alle wichtigen Milestones.' },
              { icon: MessageSquare, title: 'Community Forum', desc: 'Der Ort für Diskussionen, Strategie und Austausch.' },
              { icon: TrendingUp, title: 'Finance Dashboard', desc: 'Echtzeit-Einblick in alle Geldflüsse der Gruppe.' },
              { icon: Target, title: 'Task Management', desc: 'Klare Zuweisung von Aufgaben und Deadlines.' },
              { icon: Calendar, title: 'Event Calendar', desc: 'Founder Calls, Sprints und Launch-Termine.' },
              { icon: FileText, title: 'Legal & Docs', desc: 'Automatisierte Verträge und Dokumentation.' },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-[0_0_30px_-10px_rgba(212,175,55,0.1)] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center mb-6 group-hover:bg-[var(--accent)] transition-colors duration-300">
                  <item.icon className="w-6 h-6 text-[var(--secondary)] group-hover:text-[var(--accent-foreground)] transition-colors" />
                </div>
                <h3 className="text-lg font-display font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-[var(--secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-32 px-6 bg-[var(--surface-muted)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-[var(--foreground)] mb-6">
              Dein Einstieg
            </h2>
            <p className="text-[var(--secondary)] max-w-2xl mx-auto">
              Wir haben das Modell. Du hast die Wahl.
            </p>
          </div>
          <PricingTable 
            isLoading={false} 
            onSelectPlan={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })} 
          />
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-[var(--accent)] mb-4">
              <Shield className="w-5 h-5" />
              <span className="text-[0.65rem] uppercase tracking-[0.4em] font-bold">Limited Partnership</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-[var(--foreground)] mb-6">
              Werde Teil der Schmiede.
            </h2>
            <p className="text-lg text-[var(--secondary)] max-w-2xl mx-auto">
              Wir suchen keine passiven Investoren. Wir suchen Macher. Aktuell sind noch <span className="text-[var(--foreground)] font-bold">{Math.max(0, MAX_GROUP_SIZE - foundersCount)} Plätze</span> verfügbar.
            </p>
          </div>

          <div className="relative">
            {/* Form Glow */}
            <div className="absolute -inset-1 bg-gradient-to-b from-[var(--accent)] to-transparent rounded-[2.5rem] opacity-20 blur-xl" />
            
            <form
              onSubmit={handleSubmit}
              className="relative bg-[var(--surface)] rounded-[2rem] border border-[var(--border)] p-8 md:p-12 shadow-2xl min-h-[500px] flex flex-col justify-center"
            >
              {formStatus === 'success' ? (
                <div className="text-center animate-fade-in">
                  <div className="w-20 h-20 bg-[var(--surface-muted)] text-[var(--accent)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--accent)]">
                    <Check className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-display font-bold mb-4">Bewerbung empfangen</h3>
                  <p className="text-[var(--secondary)]">
                    Wir prüfen deine Unterlagen und melden uns innerhalb von 48 Stunden.<br/>
                    Behalte deinen Posteingang im Auge.
                  </p>
                </div>
              ) : (
                <>
                  {/* Progress */}
                  <div className="flex justify-center gap-3 mb-12">
                    {[1, 2, 3].map(step => (
                      <div 
                        key={step} 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          currentStep >= step 
                            ? 'w-12 bg-[var(--accent)] shadow-[0_0_10px_rgba(212,175,55,0.5)]' 
                            : 'w-3 bg-[var(--border)]'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* STEP 1: ROLE */}
                  {currentStep === 1 && (
                    <div className="animate-fade-in">
                      <h3 className="text-2xl font-display font-bold text-center mb-10">Wähle deinen Pfad</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <button
                          type="button"
                          onClick={() => handleSelectRole('investor')}
                          className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] transition-all text-left group hover:-translate-y-1"
                        >
                          <div className="w-12 h-12 bg-[var(--surface-muted)] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-[var(--accent)]">
                            <TrendingUp className="w-6 h-6 text-[var(--accent)] group-hover:text-[var(--accent-foreground)]" />
                          </div>
                          <div className="font-bold text-lg mb-2 text-[var(--foreground)]">Capital Partner</div>
                          <div className="text-sm text-[var(--secondary)] leading-relaxed">
                            Ich investiere Kapital. Mein Anteil richtet sich nach dem Zielbetrag der Gruppe.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectRole('builder')}
                          className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] transition-all text-left group hover:-translate-y-1"
                        >
                          <div className="w-12 h-12 bg-[var(--surface-muted)] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-[var(--accent)]">
                            <Zap className="w-6 h-6 text-[var(--accent)] group-hover:text-[var(--accent-foreground)]" />
                          </div>
                          <div className="font-bold text-lg mb-2 text-[var(--foreground)]">Builder</div>
                          <div className="text-sm text-[var(--secondary)] leading-relaxed">
                            Ich investiere Zeit & Skills (Sweat Equity). Mind. 15h/Woche.
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: DETAILS */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in space-y-8">
                      <h3 className="text-2xl font-display font-bold text-center mb-8">
                        {role === 'investor' ? 'Profil erstellen' : 'Skillset definieren'}
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] font-bold ml-1">Name</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={handleFormChange('name')}
                            className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            placeholder="Dein vollständiger Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] font-bold ml-1">E-Mail</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={handleFormChange('email')}
                            className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>

                      {role === 'investor' ? (
                         <div className="space-y-2">
                           <label className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] font-bold ml-1">Investment Ziel</label>
                           <select
                              value={formData.capital}
                              onChange={handleFormChange('capital')}
                              className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-[var(--foreground)] appearance-none cursor-pointer"
                           >
                             <option value="">Bitte wählen...</option>
                             <option value="25k">25.000 € Gruppe (Starter)</option>
                             <option value="50k">50.000 € Gruppe (Growth)</option>
                             <option value="100k">100.000 € Gruppe (Pro)</option>
                           </select>
                         </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] font-bold ml-1">Core Skill</label>
                          <input
                            type="text"
                            value={formData.skill}
                            onChange={handleFormChange('skill')}
                            className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            placeholder="z.B. React Native, SEO, B2B Sales"
                          />
                        </div>
                      )}

                      <div className="flex gap-4 pt-6">
                        <button 
                          type="button" 
                          onClick={handlePrevStep}
                          className="flex-1 py-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors uppercase text-xs tracking-widest font-bold"
                        >
                          Zurück
                        </button>
                        <button 
                          type="button" 
                          onClick={handleNextStep}
                          disabled={!formData.name || !formData.email}
                          className="flex-1 py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50 transition-all uppercase text-xs tracking-widest font-bold shadow-lg"
                        >
                          Weiter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: MOTIVATION */}
                  {currentStep === 3 && (
                    <div className="animate-fade-in space-y-8">
                      <h3 className="text-2xl font-display font-bold text-center mb-8">Dein Pitch</h3>
                      
                      <div className="space-y-2">
                        <label className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] font-bold ml-1">
                          {role === 'builder' 
                            ? 'Warum du? (Pitch dich)' 
                            : 'Vision & Erwartung'}
                        </label>
                        <textarea
                          value={formData.why}
                          onChange={handleFormChange('why')}
                          rows={4}
                          className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none"
                          placeholder={role === 'builder' ? "Überzeuge uns von deinen Skills." : "Was möchtest du mit uns aufbauen?"}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] font-bold ml-1">LinkedIn / Social</label>
                        <input
                            type="text"
                            value={formData.instagram}
                            onChange={handleFormChange('instagram')}
                            className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                            placeholder="URL zu deinem Profil"
                          />
                      </div>

                      {formMessage && (
                        <p className="text-center text-[var(--color-destructive)] text-sm">{formMessage}</p>
                      )}

                      <div className="flex gap-4 pt-6">
                        <button 
                          type="button" 
                          onClick={handlePrevStep}
                          className="flex-1 py-4 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors uppercase text-xs tracking-widest font-bold"
                        >
                          Zurück
                        </button>
                        <button 
                          type="submit" 
                          disabled={formStatus === 'loading'}
                          className="ember-glow flex-1 py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110 disabled:opacity-50 transition-all uppercase text-xs tracking-widest font-bold shadow-lg"
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
      <footer className="bg-[var(--surface-muted)] border-t border-[var(--border)] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="font-display font-bold text-2xl text-[var(--foreground)] mb-6">THE FORGE</div>
              <p className="text-sm text-[var(--secondary)] leading-relaxed">
                Die Plattform für kollektives Entrepreneurship. Wir verbinden Kapital, Skills und Visionen zu echten Unternehmen.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)] mb-6">Community</div>
              <div className="space-y-4 text-sm">
                <Link href="/dashboard" className="block text-[var(--secondary)] hover:text-[var(--accent)] transition-colors">
                  Dashboard
                </Link>
                <Link href="/forum" className="block text-[var(--secondary)] hover:text-[var(--accent)] transition-colors">
                  Forum
                </Link>
                <Link href="/transparency" className="block text-[var(--secondary)] hover:text-[var(--accent)] transition-colors">
                  Transparenz
                </Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)] mb-6">Rechtliches</div>
              <div className="space-y-4 text-sm">
                <Link href="/legal/impressum" className="block text-[var(--secondary)] hover:text-[var(--accent)] transition-colors">
                  Impressum
                </Link>
                <Link
                  href="/legal/datenschutz"
                  className="block text-[var(--secondary)] hover:text-[var(--accent)] transition-colors"
                >
                  Datenschutz
                </Link>
                <Link href="/legal/agb" className="block text-[var(--secondary)] hover:text-[var(--accent)] transition-colors">
                  AGB
                </Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)] mb-6">System Status</div>
              <div className="space-y-4 text-sm text-[var(--secondary)]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-forge-ember)] rounded-full animate-pulse" />
                  <span className="text-[var(--foreground)]">Recruiting Phase</span>
                </div>
                <div>24/25 Slots filled</div>
                <div>v2.0.0-beta</div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-8 text-center text-xs text-[var(--secondary)] uppercase tracking-widest">
            © 2026 THE FORGE. All rights reserved. Built with precision.
          </div>
        </div>
      </footer>

      {/* Chat Bot UI */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={handleCloseChat}
        />
      )}

      <button
        type="button"
        onClick={isChatOpen ? handleCloseChat : handleOpenChat}
        className="ember-glow fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-2xl hover:brightness-110 transition-all flex items-center justify-center border border-[var(--accent-foreground)]/10"
        aria-label="Chat mit Orion"
      >
        {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      <div
        className={`fixed bottom-24 right-6 z-50 w-[90vw] max-w-[22rem] rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-all duration-300 ${
          isChatOpen ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-4 scale-95'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)] rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center font-display font-bold text-sm">
              O
            </div>
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.3em] font-bold text-[var(--foreground)]">
                Orion
              </div>
              <div className="text-[0.65rem] text-[var(--secondary)]">AI Concierge</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseChat}
            className="text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[50vh] overflow-y-auto bg-[var(--background)]">
          {chatMessages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[var(--accent)] text-[var(--accent-foreground)] rounded-br-none'
                    : 'bg-[var(--surface-muted)] text-[var(--foreground)] border border-[var(--border)] rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {chatStatus === 'loading' && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--secondary)] border border-[var(--border)] bg-[var(--surface-muted)] rounded-bl-none">
                Orion denkt nach...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleChatSubmit}
          className="px-4 py-4 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-3xl flex items-center gap-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Frag Orion..."
            className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none text-sm bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          />
          <button
            type="submit"
            disabled={chatStatus === 'loading'}
            className="bg-[var(--accent)] text-[var(--accent-foreground)] px-4 py-3 rounded-xl hover:brightness-110 transition-colors disabled:opacity-50"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}