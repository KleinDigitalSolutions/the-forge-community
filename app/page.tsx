'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';
import { PricingTable } from '@/app/components/PricingTable';
import {
  Check,
  TrendingUp,
  MessageSquare,
  FileText,
  Target,
  Zap,
  X,
  Shield,
  Layers,
  Users,
  ChevronRight,
  Package,
  Cpu,
  Truck,
  Sparkles,
  Image,
  Film,
  Scale
} from 'lucide-react';
import ResponsiveHeroBanner from '@/app/components/ui/ResponsiveHeroBanner';
import AnimatedCardStack from '@/app/components/ui/AnimatedCardStack';
import ForgeOSShowcase from '@/app/components/landing/ForgeOSShowcase';
import MissionLogCarousel from '@/app/components/landing/MissionLogCarousel';
import { BorderBeam } from '@/components/ui/border-beam';
import { Hero195 } from '@/components/ui/hero-195';

// --------------------------------------------------------

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
        'Hi, ich bin Orion. Dein Guide für The Forge. Wie kann ich helfen?',
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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

  const handleOpenChat = () => setIsChatOpen(true);
  const handleCloseChat = () => setIsChatOpen(false);

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

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
    if (!chatInput.trim() || chatStatus === 'loading') return;

    const message = chatInput.trim();
    const history = chatMessages.slice(-6).map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatInput('');
    setChatStatus('loading');

    try {
      const response = await fetch('/api/chat/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = data?.message || 'Chat-Anfrage fehlgeschlagen. Bitte versuche es erneut.';
        setChatMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        setChatStatus('idle');
        return;
      }

      const reply = data.message?.trim() || 'Entschuldigung, ich konnte keine Antwort generieren.';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Verbindung unterbrochen. Bitte versuche es erneut.' },
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

    if (!turnstileToken) {
      setFormStatus('error');
      setFormMessage('Sicherheitsscheck erforderlich (Turnstile).');
      return;
    }

    setFormStatus('loading');
    try {
      const response = await fetch('/api/founders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role, turnstileToken }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      setFormStatus('success');
      setFormMessage('Empfangen. Wir melden uns.');
    } catch (error) {
      setFormStatus('error');
      setFormMessage('Fehler beim Senden.');
    }
  };

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground) selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      
      {/* Integrated Hero & Header */}
      <ResponsiveHeroBanner 
        badgeText="BATCH #001 — REKRUTIERUNG LÄUFT"
        title="Viele Founder. 1 Brand."
        titleLine2="Volle Transparenz."
        description="STAKE & SCALE vereint Community-Capital, KI-Studios und radikale Execution. Forge-Hub, Decision Hall, Forum und Direct Messages bündeln Ideen, Votes und Output in einem System."
        primaryButtonText="SEQUENZ STARTEN"
        primaryButtonHref="#apply"
        secondaryButtonText="PROTOKOLL ANSEHEN"
        secondaryButtonHref="#"
        navLinks={[
          { label: "Philosophie", href: "#philosophy" },
          { label: "The Forge", href: "#forge" },
          { label: "Mission Log", href: "#projects" },
          { label: "Prinzipien", href: "#principles" },
          { label: "Preise", href: "#pricing" },
          { label: "Shop Demo", href: "/demo-shop" }
        ]}
        ctaButtonText="BEWERBEN"
        ctaButtonHref="#apply"
      />

      {/* Metrics Section - HUD Style */}
      <section className="relative -mt-20 z-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Execution Hebel', value: '25x', sub: 'Vs. Solo Gründung' },
              { label: 'Tage bis Launch', value: 'Ø 45', sub: 'Infrastruktur Ready' },
              { label: 'Risiko-Faktor', value: '-96%', sub: 'Durch Kapital-Split' },
              { label: 'Community Owned', value: '100%', sub: 'Keine VCs. Echte Werte.' },
            ].map((stat, i) => (
              <div key={i} className="glass-card backdrop-blur-2xl p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col items-center justify-center hover:border-(--accent)/50 transition-all duration-700 group overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-linear-to-b from-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-2xl sm:text-4xl md:text-5xl font-instrument-serif text-white mb-2 sm:mb-3 relative z-10 text-center">
                  {stat.value}
                </div>
                <div className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-(--accent) mb-1 relative z-10 text-center">
                  {stat.label}
                </div>
                <div className="text-[7px] sm:text-[8px] font-bold text-white/30 uppercase tracking-widest sm:tracking-[0.2em] relative z-10 text-center">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Forge Section */}
      <section id="forge" className="relative py-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1a1f2b_0%,#0b0c10_55%,#070809_100%)]" />
        <div
          className="absolute inset-0 bg-center bg-cover opacity-25"
          style={{ backgroundImage: "url('/images/forge-hammer.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
          <div className="space-y-8">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              The Forge
            </div>
            <h2 className="text-4xl md:text-6xl font-instrument-serif text-white leading-tight">
              Dein Content-, Marketing- und Execution-HQ.
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-xl">
              The Forge verbindet deine Brand DNA mit sofortigem Output. Texte, Bilder und Videos entstehen
              in einem Flow und landen direkt in Kampagnen, Media und Forum. Kein Tool-Chaos, kein Copy/Paste.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/ventures"
                className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37] px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-black hover:opacity-90 transition-opacity"
              >
                Forge betreten
              </Link>
              <Link
                href="#transparency-preview"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 hover:text-white transition-colors"
              >
                Ablauf ansehen
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs text-white/60">
              {[
                { label: '1. Venture anlegen', desc: 'Brand DNA + Zielmarkt definieren' },
                { label: '2. Forge Output', desc: 'Texte, Bilder, Videos generieren' },
                { label: '3. Kampagne bauen', desc: 'Assets direkt strukturieren' },
                { label: '4. Media Wall', desc: 'Ergebnisse sauber archivieren' }
              ].map((step) => (
                <div key={step.label} className="glass-card border border-white/10 rounded-2xl p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    {step.label}
                  </div>
                  <div className="text-sm text-white mt-1">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                  Forge Modules
                </div>
                <h3 className="text-2xl font-instrument-serif text-white">Was direkt drin ist</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
                Live System
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Sparkles, title: 'Marketing Studio', desc: 'Kopien, Ads, Posts, Hooks & Skripte.' },
                { icon: Image, title: 'Media Studio', desc: 'Bilder generieren, veredeln und versionieren.' },
                { icon: Film, title: 'Video Studio', desc: 'Clips, Creatives, Sequenzen (in Arbeit).' },
                { icon: Layers, title: 'Chain Builder', desc: 'Mehrere Clips zu einem Flow verbinden.' },
                { icon: Scale, title: 'Legal Studio', desc: 'Verträge, NDA & Compliance (bald live).' }
              ].map((module) => (
                <div key={module.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="h-10 w-10 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center">
                    <module.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{module.title}</div>
                    <div className="text-xs text-white/50">{module.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="transparency-preview" className="py-24 px-4 md:px-6 relative">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="space-y-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
              Finanz-Protokoll
            </div>
            <h2 className="text-4xl md:text-5xl font-instrument-serif text-white leading-tight">
              Transparenz, die man sieht.
            </h2>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg">
              Jeder Euro, jede Bewegung und jeder Status ist nachvollziehbar. Das Finanz-Dashboard
              ist kein PDF, sondern ein live gepflegtes System mit Export-Logik.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/transparency"
                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 hover:text-white transition-colors"
              >
                Zum Protokoll
              </Link>
              <Link
                href="/media"
                className="rounded-full border border-white/10 bg-transparent px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
              >
                Media Wall
              </Link>
            </div>
          </div>

          <Hero195 className="relative overflow-hidden border border-white/10 bg-[#0F1113]">
            <BorderBeam size={240} duration={14} anchor={70} colorFrom="#D4AF37" colorTo="#8B5CF6" />
            <div className="relative p-8">
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-3">
                Demo Snapshot
              </div>
              <h3 className="text-2xl font-instrument-serif text-white mb-2">Live Treasury Preview</h3>
              <p className="text-sm text-white/50">
                Beispielwerte zur Orientierung. Im System siehst du den echten Ledger in Echtzeit.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: 'Einnahmen', value: '€48.000' },
                  { label: 'Ausgaben', value: '€12.400' },
                  { label: 'Verfügbar', value: '€35.600' },
                  { label: 'Runway', value: '12 Monate' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">
                      {item.label}
                    </div>
                    <div className="text-lg font-instrument-serif text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Hero195>
        </div>
      </section>

      {/* Philosophy / Features */}
      <section id="philosophy" className="py-40 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-start mb-32">
            <div>
              <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-8 leading-tight animate-fade-slide-in-1">
                Institutional Grade.<br/>
                <span className="text-(--accent)">Community Powered.</span>
              </h2>
              <p className="text-lg text-white/50 leading-relaxed animate-fade-slide-in-2">
                Wir ersetzen den veralteten VC-Ansatz durch Schwarmintelligenz.
                Weniger Risiko für den Einzelnen, mehr Upside für alle.
              </p>
            </div>

            <div className="space-y-8 sm:space-y-12">
              {[
                {
                  icon: Users,
                  title: "Kollektives Eigentum",
                  desc: "Keine stillen Teilhaber. Jeder Founder hält Anteile, jeder hat Stimmrecht. Das Projekt gehört uns."
                },
                {
                  icon: Layers,
                  title: "Meritokratischer Stack",
                  desc: "Die besten Ideen gewinnen. Wir nutzen Voting-Mechanismen um Produktentscheidungen zu treffen."
                },
                {
                  icon: Shield,
                  title: "Risiko-Minimierung",
                  desc: "Statt 50k alleine zu riskieren, splitten wir das Risiko. Maximale Hebelwirkung bei minimalem Einsatz."
                }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                  <div className="shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-(--accent) group-hover:bg-(--accent)/10 transition-all duration-500">
                      <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/60 group-hover:text-(--accent) transition-colors" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-instrument-serif text-white mb-1 sm:mb-2 group-hover:text-(--accent) transition-colors">{feature.title}</h3>
                    <p className="text-white/50 text-xs sm:text-sm leading-relaxed max-w-md">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- NEW: THE FOUNDER OS (Feature Stack) --- */}
          <div className="mt-40 border-t border-white/5 pt-20">
             <ForgeOSShowcase />
          </div>
        </div>
      </section>

      {/* System Status */}
      <section id="status" className="py-24 px-4 md:px-6 relative border-y border-white/5 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">System Status</div>
              <h2 className="text-4xl md:text-6xl font-instrument-serif text-white leading-tight">
                Was live ist.<br />Was neu ist.<br />Was als Nächstes kommt.
              </h2>
            </div>
            <p className="text-sm text-white/50 max-w-xl leading-relaxed">
              Basierend auf dem aktuellen Build: Kern-Workflow ist live, die Community-Schicht
              wurde in den letzten 24h stark erweitert, und die nächsten Studios stehen im Rollout.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Live Now</div>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-(--accent) mt-0.5" />
                  Founder Cockpit, Venture Wizard, Decision Hall + Roadmap Voting
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-(--accent) mt-0.5" />
                  Brand DNA Studio + Legal Studio (Verträge & Compliance)
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-(--accent) mt-0.5" />
                  Marketing Studio (AI Content) + Sourcing Studio (Core Workflows)
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-(--accent) mt-0.5" />
                  Forum, Profile, Notifications und Founder-Identität
                </li>
              </ul>
            </div>

            <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Aktuelle Updates</div>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-(--accent) mt-0.5" />
                  Orion Forum AI mit Kontext-Injection + Insight-Labels
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-(--accent) mt-0.5" />
                  Threaded Comments, Likes/Votes, Edit/Delete & Uploads
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-(--accent) mt-0.5" />
                  Direct Messages mit Inbox, Thread-Ansicht und User-Search
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-(--accent) mt-0.5" />
                  Rate Limits, Validierung & robuster Notification-Flow
                </li>
              </ul>
            </div>

            <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Als Nächstes</div>
              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-(--accent) mt-0.5" />
                  Admin Studio: Budget, Team-Management, Permissions
                </li>
                <li className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-(--accent) mt-0.5" />
                  Marketing Studio 2.0: Kampagnen-Manager + Content Kalender
                </li>
                <li className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-(--accent) mt-0.5" />
                  Sourcing Studio 2.0: Supplier DB, Samples, Production Orders
                </li>
                <li className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-(--accent) mt-0.5" />
                  Analytics, Stripe Connect Payouts, Mobile & Public API
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

       {/* --- SHOP STACK --- */}
       <section className="py-20 px-4 md:px-6 relative border-y border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-4xl md:text-6xl font-instrument-serif text-white mb-6">
                  Forge Shop.<br/><span className="text-(--accent)">Ready to Sell.</span>
                </h2>
                <p className="text-lg text-white/60 mb-8 leading-relaxed">
                  Der Shop ist die Verkaufsebene für alle Founder-Brands. Ihr bekommt eine erprobte
                  Storefront-Experience, die sich schnell branden lässt, plus einen klaren Launch-Flow
                  aus Forge-Studios und Community-Execution.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    Founder erhalten Zugriff auf den Shop-Stack
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    Conversion-orientiertes Layout + klare Produktstory
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    Launch-Setup in Verbindung mit Sourcing, Marketing & Legal
                  </li>
                </ul>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/demo-shop"
                    className="text-xs font-bold uppercase tracking-widest text-(--accent) hover:text-white transition-colors border-b border-(--accent)/50 pb-1"
                  >
                    Shop Demo ansehen →
                  </Link>
                  <button
                    onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                  >
                    Als Founder nutzen →
                  </button>
                </div>
             </div>
             
             {/* Shop Preview */}
             <div className="animate-fade-in-up delay-200">
               <div className="glass-card border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                 <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent pointer-events-none" />
                 <div className="flex items-center justify-between mb-6">
                   <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Storefront v1</div>
                   <div className="text-[9px] font-bold uppercase tracking-widest text-(--accent)">Live Demo</div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {[
                     { name: 'Capsule Drop', price: '€89', tone: 'from-emerald-500/20 to-teal-500/10' },
                     { name: 'Founder Kit', price: '€149', tone: 'from-purple-500/20 to-blue-500/10' },
                   ].map((item) => (
                     <div key={item.name} className="rounded-2xl border border-white/10 bg-white/2 p-4">
                       <div className={`h-24 rounded-xl bg-linear-to-br ${item.tone} mb-3`} />
                       <div className="text-sm font-semibold text-white">{item.name}</div>
                       <div className="text-[10px] text-white/40 uppercase tracking-widest">{item.price}</div>
                     </div>
                   ))}
                 </div>
                 <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-[10px] text-white/60">
                   <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-3 py-2">
                     <Package className="w-4 h-4 text-(--accent)" />
                     <span>Collections</span>
                   </div>
                   <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-3 py-2">
                     <TrendingUp className="w-4 h-4 text-(--accent)" />
                     <span>Conversion</span>
                   </div>
                   <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-3 py-2">
                     <Truck className="w-4 h-4 text-(--accent)" />
                     <span>Fulfillment</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Featured Project - Mission Log Style */}
      <section id="projects" className="relative overflow-hidden border-y border-white/5">
        <MissionLogCarousel />
      </section>

      {/* Philosophy Interlude - Animated Stack */}
      <section id="principles" className="py-40 px-4 md:px-6 relative overflow-hidden border-b border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-(--accent)/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-6 tracking-tighter">System: Override.</h2>
            <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">
              Vergiss, was du über Startups gelernt hast. Das hier ist die Realität.
            </p>
          </div>
          
          <AnimatedCardStack />
        </div>
      </section>

      {/* Pricing / Join */}
      <section id="pricing" className="py-40 px-4 md:px-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-(--accent)/5 rounded-full blur-[150px] pointer-events-none" />
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-32">
               <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-6">Mitgliedschaften</h2>
               <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Beta-Phase aktiv – Zugang aktuell kostenlos.</p>
            </div>
            <PricingTable 
              isLoading={false} 
              onSelectPlan={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })} 
            />
         </div>
      </section>

      {/* The Application Interface */}
      <section id="apply" className="py-40 px-4 relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="mb-20 text-center">
            <h2 className="text-5xl md:text-6xl font-instrument-serif text-white mb-6">Sequenz Starten</h2>
            <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Zugang zur Schmiede anfordern.</p>
          </div>

          <div className="bg-[#0F1113] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group transition-all duration-700 hover:border-(--accent)/30">
             <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent pointer-events-none" />
             
             {/* Terminal Header */}
             <div className="h-12 bg-white/3 border-b border-white/10 flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-80" />
                <div className="ml-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">Operator Terminal v1.0.4</div>
             </div>

             <div className="p-8 md:p-12">
                <form onSubmit={handleSubmit} className="relative z-10">
                   {formStatus === 'success' ? (
                      <div className="text-center py-12 animate-fade-in-up">
                         <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                            <Check className="w-8 h-8" />
                         </div>
                         <h3 className="text-xl font-bold mb-2">Request Transmitted</h3>
                         <p className="text-sm text-(--muted-foreground)">Check your inbox for the encrypted key.</p>
                      </div>
                   ) : (
                      <>
                        {/* Step Indicator */}
                        <div className="flex gap-2 mb-10">
                           {[1, 2, 3].map(s => (
                              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${currentStep >= s ? 'bg-(--accent)' : 'bg-white/5'}`} />
                           ))}
                        </div>

                        {currentStep === 1 && (
                           <div className="animate-fade-in-up">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-8 block">Zugangs-Modus wählen</label>
                              <div className="grid grid-cols-1 gap-4">
                                 {/* NEW: Quick Access Card */}
                                 <Link
                                    href="/login"
                                    className="p-5 sm:p-8 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-left group relative overflow-hidden"
                                 >
                                    <div className="absolute top-0 right-0 p-2 sm:p-3 bg-[#D4AF37] text-black text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                                       Sofort-Zugriff
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                                       <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
                                       <div className="font-instrument-serif text-xl sm:text-3xl text-white group-hover:text-(--accent) transition-colors">Free Trial</div>
                                    </div>
                                    <div className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-md">
                                       Geh direkt rein. Erhalte <strong>50 AI-Credits</strong> gratis und erkunde alle Forge-Studios unentgeltlich.
                                    </div>
                                 </Link>

                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <button
                                       type="button"
                                       onClick={() => handleSelectRole('investor')}
                                       className="p-5 sm:p-8 rounded-2xl border border-white/5 bg-white/2 hover:border-(--accent)/50 hover:bg-(--accent)/5 transition-all text-left group"
                                    >
                                       <div className="font-instrument-serif text-lg sm:text-2xl text-white mb-1 sm:mb-2 group-hover:text-(--accent) transition-colors">Kapital-Partner</div>
                                       <div className="text-[10px] sm:text-xs text-white/40 leading-relaxed">Passive Beteiligung. Bewerbung für Batches.</div>
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => handleSelectRole('builder')}
                                       className="p-5 sm:p-8 rounded-2xl border border-white/5 bg-white/2 hover:border-(--accent)/50 hover:bg-(--accent)/5 transition-all text-left group"
                                    >
                                       <div className="font-instrument-serif text-lg sm:text-2xl text-white mb-1 sm:mb-2 group-hover:text-(--accent) transition-colors">Builder</div>
                                       <div className="text-[10px] sm:text-xs text-white/40 leading-relaxed">Aktive Beteiligung. Sweat Equity & Skills.</div>
                                    </button>
                                 </div>
                              </div>
                           </div>
                        )}

                        {currentStep === 2 && (
                           <div className="animate-fade-in-up space-y-8">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block">Identitäts-Konfig</label>
                              <div className="grid gap-4">
                                 <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleFormChange('name')}
                                    className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-(--accent) focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                    placeholder="Vollständiger Name"
                                 />
                                 <input
                                    type="email"
                                    value={formData.email}
                                    onChange={handleFormChange('email')}
                                    className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-(--accent) focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                    placeholder="E-Mail Adresse"
                                 />
                                 {role === 'investor' && (
                                     <select
                                       value={formData.capital}
                                       onChange={handleFormChange('capital')}
                                       className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-(--accent) focus:ring-0 outline-none transition-all [&>option]:bg-black"
                                     >
                                        <option value="">Kapitalziel wählen...</option>
                                        <option value="12.5k">✨ 12.5k (Validator Batch)</option> {/* NEU HINZUGEFÜGT */}
                                        <option value="25k">25k (Standard Batch)</option>
                                        <option value="50k">50k (Growth Tier)</option>
                                        <option value="100k">100k (Scale Tier)</option>
                                     </select>
                                 )}
                                 {role === 'builder' && (
                                    <input
                                       type="text"
                                       value={formData.skill}
                                       onChange={handleFormChange('skill')}
                                       className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-(--accent) focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                       placeholder="Kern-Skill (z.B. Next.js, Marketing)"
                                    />
                                 )}
                              </div>
                              <div className="flex justify-between pt-4">
                                 <button type="button" onClick={handlePrevStep} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest">ZURÜCK</button>
                                 <button type="button" onClick={handleNextStep} disabled={!formData.name || !formData.email} className="text-[10px] font-bold text-(--accent) hover:opacity-80 disabled:opacity-30 uppercase tracking-widest">WEITER</button>
                              </div>
                           </div>
                        )}

                        {currentStep === 3 && (
                           <div className="animate-fade-in-up space-y-8">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block">Manifest</label>
                              <textarea
                                 value={formData.why}
                                 onChange={handleFormChange('why')}
                                 rows={4}
                                 className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-(--accent) focus:ring-0 outline-none transition-all placeholder:text-white/20 resize-none"
                                 placeholder="Erzähl uns, warum du hierher gehörst."
                              />
                               <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={handleFormChange('instagram')}
                                    className="w-full bg-white/2 border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-(--accent) focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                    placeholder="LinkedIn / Social URL"
                                 />
                              
                              {formMessage && <p className="text-red-500 text-[10px] text-center uppercase tracking-widest">{formMessage}</p>}

                              <div className="flex justify-center py-4">
                                <Turnstile
                                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                  onSuccess={(token) => setTurnstileToken(token)}
                                />
                              </div>

                              <div className="flex justify-between pt-4">
                                 <button type="button" onClick={handlePrevStep} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest">ZURÜCK</button>
                                 <button 
                                    type="submit" 
                                    disabled={formStatus === 'loading' || !turnstileToken}
                                    className="px-8 py-3 bg-(--accent) text-(--accent-foreground) rounded-xl text-[10px] font-bold hover:brightness-110 transition-all disabled:opacity-30 uppercase tracking-[0.2em]"
                                 >
                                    {formStatus === 'loading' ? 'ÜBERTRAGE...' : 'BEWERBUNG ABSCHICKEN'}
                                 </button>
                              </div>
                           </div>
                        )}
                      </>
                   )}
                </form>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 relative overflow-hidden bg-[#08090A]">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-(--accent)/20 to-transparent" />
         
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-6">
               {/* Brand Column */}
               <div className="space-y-8">
                  <Link href="/" className="flex flex-col group">
                    <span className="font-caveat text-3xl tracking-normal text-white group-hover:text-(--accent) transition-colors lowercase">stake & scale</span>
                  </Link>
                  <p className="text-sm text-white/40 leading-relaxed">
                    Das erste Community Venture Studio. Wo Brands gemeinsam geschmiedet werden. 
                    50 Founders. Eine Mission. Echte Assets.
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-green-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    System-Status: Operational
                  </div>
               </div>

               {/* Legal Column */}
               <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-8">Rechtliches</h4>
                  <ul className="space-y-4">
                     <li><Link href="/legal/impressum" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Impressum</Link></li>
                     <li><Link href="/legal/datenschutz" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Datenschutz</Link></li>
                     <li><Link href="/legal/agb" className="text-sm text-white/50 hover:text-(--accent) transition-colors">AGB</Link></li>
                     <li><Link href="/legal/vertrag" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Founder-Vertrag</Link></li>
                  </ul>
               </div>

               {/* Navigation Column */}
               <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-8">Navigation</h4>
                  <ul className="space-y-4">
                     <li><Link href="/dashboard" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Founder Dashboard</Link></li>
                     <li><Link href="/transparency" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Finanz-Protokoll</Link></li>
                     <li><Link href="/forum" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Community Forum</Link></li>
                     <li><Link href="/squads" className="text-sm text-white/50 hover:text-(--accent) transition-colors">Squad Markt</Link></li>
                  </ul>
               </div>

               {/* Support Column */}
               <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-8">Kommando-Zentrale</h4>
                  <ul className="space-y-4">
                     <li><a href="mailto:info@stakeandscale.de" className="text-sm text-white/50 hover:text-(--accent) transition-colors">info@stakeandscale.de</a></li>
                     <li className="pt-4">
                        <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
                           <p className="text-[10px] text-white/30 uppercase tracking-widest leading-relaxed">
                              Anfragen werden innerhalb von 24 Stunden durch die KI oder Operatoren bearbeitet.
                           </p>
                        </div>
                     </li>
                  </ul>
               </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">
                  © 2026 THE FORGE SYSTEM • ALL RIGHTS RESERVED
               </div>
               <div className="flex items-center gap-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>v1.0.4-stable</span>
               </div>
            </div>
         </div>
      </footer>

      {/* Modern Chat Widget - Mobile Optimized */}
      <button
        onClick={isChatOpen ? handleCloseChat : handleOpenChat}
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 p-4 md:p-5 rounded-2xl bg-white/3 border border-white/10 shadow-2xl hover:border-(--accent)/50 transition-all duration-500 backdrop-blur-xl group ${isChatOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
         <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-(--accent) transition-colors" />
      </button>

      {/* Chat Window - Mobile Full Screen */}
      <div className={`fixed inset-4 md:inset-auto md:bottom-8 md:right-8 z-50 md:w-[400px] glass-card border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-500 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
         <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
            <div className="flex items-center gap-3 md:gap-4">
               <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
               <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-white">Orion Intelligence</span>
            </div>
            <button onClick={handleCloseChat} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-4 h-4 md:w-5 md:h-5 text-white/40 hover:text-white transition-colors" />
            </button>
         </div>
         <div className="h-[calc(100vh-200px)] md:h-[400px] overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide">
             {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[90%] md:max-w-[85%] text-xs p-3 md:p-4 rounded-xl md:rounded-2xl leading-relaxed ${msg.role === 'user' ? 'bg-(--accent) text-(--accent-foreground) font-bold' : 'bg-white/3 border border-white/5 text-white/80'}`}>
                      {msg.content}
                   </div>
                </div>
             ))}
             {chatStatus === 'loading' && <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30 animate-pulse">Orion verarbeitet...</div>}
             <div ref={chatEndRef} />
         </div>
         <form onSubmit={handleChatSubmit} className="p-3 md:p-4 border-t border-white/10 flex gap-2 md:gap-3 bg-white/1">
            <input
               className="flex-1 bg-white/3 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs focus:border-(--accent) outline-none text-white transition-all placeholder:text-white/20"
               placeholder="Nachricht eingeben..."
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="p-2.5 md:p-3 rounded-xl bg-(--accent) text-(--accent-foreground) hover:brightness-110 transition-all shrink-0">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
         </form>
      </div>

    </div>
  );
}
