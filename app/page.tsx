'use client';

import { useState, useEffect, useCallback, useRef, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
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
  Users,
  ChevronRight,
  Package,    // Neu importiert
  Megaphone,  // Neu importiert
  Cpu         // Neu importiert
} from 'lucide-react';
import ResponsiveHeroBanner from '@/app/components/ui/ResponsiveHeroBanner';
import AnimatedCardStack from '@/app/components/ui/AnimatedCardStack';

// --- SUB-KOMPONENTE: BUDGET SIMULATOR (Vercel Style) ---
const BudgetSimulator = () => {
  const [split, setSplit] = useState(65); // Startet bei 65% Sourcing
  const totalBudget = 12500;
  
  // Berechnung
  const sourcingBudget = Math.floor(totalBudget * (split / 100));
  const marketingBudget = totalBudget - sourcingBudget;
  
  // Annahmen: ~13.50€ pro Unit (inkl. Packaging/Versand zum Lager) / ~220€ pro Micro-Influencer Collab
  const units = Math.floor(sourcingBudget / 13.5); 
  const influencers = Math.floor(marketingBudget / 220);

  return (
    <div className="w-full max-w-4xl mx-auto p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
      <div className="bg-[#0B0C0E] rounded-[22px] border border-white/5 p-6 md:p-10 relative overflow-hidden group">
        
        {/* Background Glow Effects */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[var(--accent)]/5 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-4">
                <Cpu className="w-3 h-3" />
                Validator Engine
              </div>
              <h3 className="text-3xl md:text-4xl font-instrument-serif text-white mb-2">
                12.5k Budget Simulator
              </h3>
              <p className="text-white/40 text-sm">Schiebe den Regler: Ware vs. Hype.</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono text-white tracking-tighter">€{totalBudget.toLocaleString('de-DE')}</div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Gesamtkapital</div>
            </div>
          </div>

          {/* Slider Control */}
          <div className="mb-12">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/30 mb-4">
              <span className={split > 50 ? "text-white transition-colors" : ""}>Sourcing Focus</span>
              <span className={split < 50 ? "text-[var(--accent)] transition-colors" : ""}>Growth Focus</span>
            </div>
            
            <input 
              type="range" 
              min="20" 
              max="80" 
              value={split} 
              onChange={(e) => setSplit(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-[#0B0C0E] [&::-webkit-slider-thumb]:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all"
            />
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sourcing Card */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-white/20" style={{ height: `${split}%`}} />
               <div className="flex items-start justify-between mb-8">
                 <div className="p-3 bg-white/5 rounded-xl text-white">
                   <Package className="w-6 h-6" />
                 </div>
                 <div className="text-right">
                   <div className="text-lg font-mono text-white">€{sourcingBudget.toLocaleString('de-DE')}</div>
                   <div className="text-[10px] text-white/30 uppercase tracking-widest">{split}% Allocation</div>
                 </div>
               </div>
               <div>
                 <div className="text-4xl font-instrument-serif text-white mb-1">~{units} Stk.</div>
                 <div className="text-xs text-white/40">Initial Stock (White/Private Label)</div>
               </div>
            </div>

            {/* Marketing Card */}
            <div className="p-6 rounded-2xl bg-[var(--accent)]/[0.03] border border-[var(--accent)]/10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]/50" style={{ height: `${100-split}%`}} />
               <div className="flex items-start justify-between mb-8">
                 <div className="p-3 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                   <Megaphone className="w-6 h-6" />
                 </div>
                 <div className="text-right">
                   <div className="text-lg font-mono text-white">€{marketingBudget.toLocaleString('de-DE')}</div>
                   <div className="text-[10px] text-white/30 uppercase tracking-widest">{100-split}% Allocation</div>
                 </div>
               </div>
               <div>
                 <div className="text-4xl font-instrument-serif text-white mb-1">~{influencers} Creator Deals</div>
                 <div className="text-xs text-white/40">Micro-Influencer / Seeding Kampagne</div>
               </div>
            </div>
          </div>

          <div className="mt-8 text-center">
             <p className="text-xs text-white/30 italic">
               *Schätzwerte basierend auf aktuellen Forge-Marktpreisen. Dient der Strategie-Findung.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
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

    setFormStatus('loading');
    try {
      const response = await fetch('/api/founders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      
      {/* Integrated Hero & Header */}
      <ResponsiveHeroBanner 
        badgeText="BATCH #001 — REKRUTIERUNG LÄUFT"
        title="25 Founder. 1 Brand."
        titleLine2="Volle Transparenz."
        description="STAKE & SCALE ersetzt den riskanten Solo-Weg durch ein hocheffizientes Kollektiv. Wir bündeln Kapital und Skills, während die Execution im Forge-Hub zentralisiert wird."
        primaryButtonText="SEQUENZ STARTEN"
        primaryButtonHref="#apply"
        secondaryButtonText="PROTOKOLL ANSEHEN"
        secondaryButtonHref="#"
        navLinks={[
          { label: "Philosophie", href: "#philosophy" },
          { label: "Mission Log", href: "#projects" },
          { label: "Prinzipien", href: "#principles" },
          { label: "Preise", href: "#pricing" },
          { label: "Shop Demo", href: "/demo-shop" }
        ]}
        ctaButtonText="BEWERBEN"
        ctaButtonHref="#apply"
      />

      {/* Metrics Section - HUD Style */}
      <section className="relative -mt-20 z-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Execution Hebel', value: '25x', sub: 'Vs. Solo Gründung' },
              { label: 'Tage bis Launch', value: 'Ø 28', sub: 'Infrastruktur Ready' },
              { label: 'Risiko-Faktor', value: '-96%', sub: 'Durch Kapital-Split' },
              { label: 'Community Owned', value: '100%', sub: 'Keine VCs. Echte Werte.' },
            ].map((stat, i) => (
              <div key={i} className="glass-card backdrop-blur-2xl p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center hover:border-[var(--accent)]/50 transition-all duration-700 group overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-4xl md:text-5xl font-instrument-serif text-white mb-3 relative z-10">
                  {stat.value}
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent)] mb-1.5 relative z-10">
                  {stat.label}
                </div>
                <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] relative z-10">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy / Features */}
      <section id="philosophy" className="py-40 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-8 animate-fade-slide-in-1">
              Institutional Grade.<br/>
              Community Powered.
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed animate-fade-slide-in-2">
              Wir ersetzen den veralteten VC-Ansatz durch Schwarmintelligenz.
              Weniger Risiko für den Einzelnen, mehr Upside für alle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
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
              <div key={i} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 mx-auto group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-all duration-500">
                  <feature.icon className="w-6 h-6 text-white group-hover:text-[var(--accent)]" />
                </div>
                <h3 className="text-2xl font-instrument-serif text-white mb-4">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-[280px] mx-auto">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* --- NEUE SECTION: VALIDATOR SIMULATOR --- */}
       <section className="py-20 px-6 relative border-y border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-4xl md:text-6xl font-instrument-serif text-white mb-6">
                  Start Small.<br/><span className="text-[var(--accent)]">Scale Fast.</span>
                </h2>
                <p className="text-lg text-white/60 mb-8 leading-relaxed">
                  Mit dem neuen <strong>12.5k Validator Batch</strong> senken wir die Eintrittsbarriere.
                  Keine komplexe Tech-Plattform zu Beginn – voller Fokus auf Product-Market-Fit, 
                  Sourcing und Hype-Generierung auf TikTok.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    Perfekt für First-Time Founder
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    Fokus auf Cashflow & Brand-Building
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                    Spielgeld-Risiko bei Squad-Teilung
                  </li>
                </ul>
                <button 
                  onClick={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:text-white transition-colors border-b border-[var(--accent)]/50 pb-1"
                >
                  Validator Batch Bewerben →
                </button>
             </div>
             
             {/* Simulator Component Integration */}
             <div className="animate-fade-in-up delay-200">
               <BudgetSimulator />
             </div>
          </div>
        </div>
      </section>

      {/* Featured Project - Mission Log Style */}
      <section id="projects" className="py-40 px-6 bg-[#0B0C0E] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-small opacity-[0.03] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-24 items-center">
             <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                  Aktive Mission
                </div>
                <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-8">SmartStore<br/>Fulfillment</h2>
                <p className="text-lg text-white/50 mb-12 leading-relaxed">
                  Ein Nischen-3PL (Third Party Logistics) Provider für High-Value Goods. 
                  Wir schließen die Lücke zwischen Garage-Shipping und Enterprise-Logistik.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    <div className="text-3xl font-instrument-serif text-white mb-1">€12k</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Ziel MRR (6 Mo)</div>
                  </div>
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    <div className="text-3xl font-instrument-serif text-[var(--accent)] mb-1">35%</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">EBITDA Marge</div>
                  </div>
                </div>
             </div>
             
             <div className="relative">
                <div className="absolute -inset-20 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative glass-card border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6 relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Operation Roadmap</div>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"/>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"/>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"/>
                      </div>
                   </div>
                   <div className="space-y-8 relative z-10">
                      {[
                        { step: '01', title: 'Gründung', status: 'ABGESCHLOSSEN' },
                        { step: '02', title: 'Rechtliches & Banking', status: 'IN BEARBEITUNG' },
                        { step: '03', title: 'Tech Stack Setup', status: 'WARTESCHLANGE' },
                        { step: '04', title: 'Kunden-Onboarding', status: 'WARTESCHLANGE' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-6">
                           <div className="font-mono text-[10px] text-white/20">{item.step}</div>
                           <div className="flex-1 font-instrument-serif text-xl text-white/90">{item.title}</div>
                           <div className={`text-[9px] font-bold tracking-[0.2em] px-3 py-1 rounded-full border ${
                             item.status === 'COMPLETED' ? 'border-green-500/20 bg-green-500/10 text-green-400' :
                             item.status === 'PROCESSING' ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400' :
                             'border-white/5 text-white/20'
                           }`}>
                             {item.status}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           </div>
        </div>
      </section>

      {/* Philosophy Interlude - Animated Stack */}
      <section id="principles" className="py-40 px-6 relative overflow-hidden border-b border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-6 tracking-tighter">Grundprinzipien</h2>
            <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">
              Wie wir Erfolg von Grund auf schmieden.
            </p>
          </div>
          
          <AnimatedCardStack />
        </div>
      </section>

      {/* Pricing / Join */}
      <section id="pricing" className="py-40 px-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent)]/5 rounded-full blur-[150px] pointer-events-none" />
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-32">
               <h2 className="text-5xl md:text-7xl font-instrument-serif text-white mb-6">Mitgliedschaften</h2>
               <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Wähle dein Level an Beteiligung.</p>
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

          <div className="bg-[#0F1113] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group transition-all duration-700 hover:border-[var(--accent)]/30">
             <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
             
             {/* Terminal Header */}
             <div className="h-12 bg-white/[0.03] border-b border-white/10 flex items-center px-6 gap-2">
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
                         <p className="text-sm text-[var(--muted-foreground)]">Check your inbox for the encrypted key.</p>
                      </div>
                   ) : (
                      <>
                        {/* Step Indicator */}
                        <div className="flex gap-2 mb-10">
                           {[1, 2, 3].map(s => (
                              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${currentStep >= s ? 'bg-[var(--accent)]' : 'bg-white/5'}`} />
                           ))}
                        </div>

                        {currentStep === 1 && (
                           <div className="animate-fade-in-up">
                              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-8 block">Operator Modus wählen</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <button
                                    type="button"
                                    onClick={() => handleSelectRole('investor')}
                                    className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all text-left group"
                                 >
                                    <div className="font-instrument-serif text-2xl text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Kapital-Partner</div>
                                    <div className="text-xs text-white/40 leading-relaxed">Passive Beteiligung. Rein finanzieller Beitrag.</div>
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => handleSelectRole('builder')}
                                    className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all text-left group"
                                 >
                                    <div className="font-instrument-serif text-2xl text-white mb-2 group-hover:text-[var(--accent)] transition-colors">Builder</div>
                                    <div className="text-xs text-white/40 leading-relaxed">Aktive Beteiligung. Sweat Equity & Skills.</div>
                                 </button>
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
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                    placeholder="Vollständiger Name"
                                 />
                                 <input
                                    type="email"
                                    value={formData.email}
                                    onChange={handleFormChange('email')}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                    placeholder="E-Mail Adresse"
                                 />
                                 {role === 'investor' && (
                                     <select
                                       value={formData.capital}
                                       onChange={handleFormChange('capital')}
                                       className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all [&>option]:bg-black"
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
                                       className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                       placeholder="Kern-Skill (z.B. Next.js, Marketing)"
                                    />
                                 )}
                              </div>
                              <div className="flex justify-between pt-4">
                                 <button type="button" onClick={handlePrevStep} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest">ZURÜCK</button>
                                 <button type="button" onClick={handleNextStep} disabled={!formData.name || !formData.email} className="text-[10px] font-bold text-[var(--accent)] hover:opacity-80 disabled:opacity-30 uppercase tracking-widest">WEITER</button>
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
                                 className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/20 resize-none"
                                 placeholder="Erzähl uns, warum du hierher gehörst."
                              />
                               <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={handleFormChange('instagram')}
                                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-6 py-4 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/20"
                                    placeholder="LinkedIn / Social URL"
                                 />
                              
                              {formMessage && <p className="text-red-500 text-[10px] text-center uppercase tracking-widest">{formMessage}</p>}

                              <div className="flex justify-between pt-4">
                                 <button type="button" onClick={handlePrevStep} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest">ZURÜCK</button>
                                 <button 
                                    type="submit" 
                                    disabled={formStatus === 'loading'}
                                    className="px-8 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl text-[10px] font-bold hover:brightness-110 transition-all disabled:opacity-30 uppercase tracking-[0.2em]"
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
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent" />
         
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-6">
               {/* Brand Column */}
               <div className="space-y-8">
                  <Link href="/" className="flex flex-col group">
                    <span className="font-caveat text-3xl tracking-normal text-white group-hover:text-[var(--accent)] transition-colors lowercase">stake & scale</span>
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
                     <li><Link href="/legal/impressum" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Impressum</Link></li>
                     <li><Link href="/legal/datenschutz" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Datenschutz</Link></li>
                     <li><Link href="/legal/agb" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">AGB</Link></li>
                     <li><Link href="/legal/vertrag" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Founder-Vertrag</Link></li>
                  </ul>
               </div>

               {/* Navigation Column */}
               <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-8">Navigation</h4>
                  <ul className="space-y-4">
                     <li><Link href="/dashboard" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Founder Dashboard</Link></li>
                     <li><Link href="/transparency" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Finanz-Protokoll</Link></li>
                     <li><Link href="/forum" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Community Forum</Link></li>
                     <li><Link href="/squads" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">Squad Markt</Link></li>
                  </ul>
               </div>

               {/* Support Column */}
               <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-8">Kommando-Zentrale</h4>
                  <ul className="space-y-4">
                     <li><a href="mailto:info@theforge.community" className="text-sm text-white/50 hover:text-[var(--accent)] transition-colors">info@theforge.community</a></li>
                     <li className="pt-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
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
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl hover:border-[var(--accent)]/50 transition-all duration-500 backdrop-blur-xl group ${isChatOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
         <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-[var(--accent)] transition-colors" />
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
                   <div className={`max-w-[90%] md:max-w-[85%] text-xs p-3 md:p-4 rounded-xl md:rounded-2xl leading-relaxed ${msg.role === 'user' ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-bold' : 'bg-white/[0.03] border border-white/5 text-white/80'}`}>
                      {msg.content}
                   </div>
                </div>
             ))}
             {chatStatus === 'loading' && <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30 animate-pulse">Orion verarbeitet...</div>}
             <div ref={chatEndRef} />
         </div>
         <form onSubmit={handleChatSubmit} className="p-3 md:p-4 border-t border-white/10 flex gap-2 md:gap-3 bg-white/[0.01]">
            <input
               className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs focus:border-[var(--accent)] outline-none text-white transition-all placeholder:text-white/20"
               placeholder="Nachricht eingeben..."
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="p-2.5 md:p-3 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-110 transition-all flex-shrink-0">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
         </form>
      </div>

    </div>
  );
}