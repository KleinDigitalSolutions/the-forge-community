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
} from 'lucide-react';
import ResponsiveHeroBanner from '@/app/components/ui/ResponsiveHeroBanner';
import AnimatedCardStack from '@/app/components/ui/AnimatedCardStack';

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'Chat request failed');

      const reply = data.message?.trim() || 'Danke. Kannst du das präzisieren?';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)] overflow-x-hidden">
      
      {/* Integrated Hero & Header */}
      <ResponsiveHeroBanner 
        badgeLabel="Recruiting"
        badgeText="Batch #001 - Join the Forge"
        title="Forge Real Value."
        titleLine2="Build the Future."
        description="The Forge ist das erste Community Venture Studio. Wir bündeln Kapital, Skills und Execution um profitable Businesses zu schmieden, die uns allen gehören."
        primaryButtonText="Start Your Journey"
        primaryButtonHref="#apply"
        secondaryButtonText="Watch Manifesto"
        secondaryButtonHref="#"
        navLinks={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Forum", href: "/forum" },
          { label: "Squads", href: "/squads" },
          { label: "Legal", href: "/legal/impressum" }
        ]}
        ctaButtonText="Apply"
        ctaButtonHref="#apply"
      />

      {/* Metrics Grid (Bento Style) */}
      <section className="py-20 px-4 md:px-6 border-y border-[var(--border)] bg-[var(--surface)]/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]">
            {[
              { label: 'Available Seats', value: `${Math.max(0, MAX_GROUP_SIZE - foundersCount)}`, sub: 'of 25 Total' },
              { label: 'Capital Target', value: '25k€', sub: 'Pre-Seed' },
              { label: 'Equity Split', value: 'Equal', sub: '1 Vote / Member' },
              { label: 'Transparency', value: '100%', sub: 'Open Ledger' },
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--background)] p-8 md:p-12 flex flex-col items-center justify-center hover:bg-[var(--surface)] transition-colors group">
                <div className="text-4xl md:text-5xl font-display font-bold text-[var(--foreground)] mb-2 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-xs font-medium uppercase tracking-widest text-[var(--muted-foreground)] mb-1">
                  {stat.label}
                </div>
                <div className="text-[10px] text-[var(--secondary)]">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy / Features */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Institutional Grade.<br/>
                Community Powered.
              </h2>
              <p className="text-lg text-[var(--muted-foreground)]">
                Wir ersetzen den veralteten VC-Ansatz durch Schwarmintelligenz.
                Weniger Risiko für den Einzelnen, mehr Upside für alle.
              </p>
            </div>
            <div className="hidden md:block">
               <Link href="/manifesto" className="text-sm font-bold border-b border-[var(--border)] pb-1 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors">
                  Read the Manifesto
               </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Collective Ownership",
                desc: "Keine stillen Teilhaber. Jeder Founder hält Anteile, jeder hat Stimmrecht. Das Projekt gehört uns."
              },
              {
                icon: Layers,
                title: "Meritocratic Stack",
                desc: "Die besten Ideen gewinnen. Wir nutzen Voting-Mechanismen um Produktentscheidungen zu treffen."
              },
              {
                icon: Shield,
                title: "Risk Mitigation",
                desc: "Statt 50k alleine zu riskieren, splitten wir das Risiko. Maximale Hebelwirkung bei minimalem Einsatz."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl hover:border-[var(--accent)]/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center mb-6 group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)] transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Project - The "Case Study" */}
      <section className="py-32 px-6 border-y border-[var(--border)] bg-[var(--surface-muted)]">
        <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
             <div>
                <div className="text-[var(--accent)] font-bold text-xs uppercase tracking-widest mb-4">Current Focus</div>
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">SmartStore Fulfillment</h2>
                <p className="text-lg text-[var(--muted-foreground)] mb-8">
                  Ein Nischen-3PL (Third Party Logistics) Provider für High-Value Goods. 
                  Wir schließen die Lücke zwischen Garage-Shipping und Enterprise-Logistik.
                </p>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                    <Check className="w-4 h-4 text-[var(--accent)]" />
                    <span>Infrastruktur & Software Partnerschaften gesichert</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                    <Check className="w-4 h-4 text-[var(--accent)]" />
                    <span>Erste 5 Beta-Kunden auf Warteliste</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                    <Check className="w-4 h-4 text-[var(--accent)]" />
                    <span>Geplanter Launch: Q3 2026</span>
                  </li>
                </ul>
                <div className="flex gap-4">
                  <div className="px-5 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="text-2xl font-bold">€12k</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase">Target MRR (6 Mo)</div>
                  </div>
                  <div className="px-5 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                    <div className="text-2xl font-bold text-[var(--accent)]">35%</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase">EBITDA Margin</div>
                  </div>
                </div>
             </div>
             
             <div className="relative">
                {/* Abstract UI representation */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-transparent rounded-2xl opacity-20 blur-xl"></div>
                <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
                   <div className="flex items-center justify-between mb-8 border-b border-[var(--border)] pb-4">
                      <div className="text-sm font-bold">Roadmap</div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500"/>
                        <div className="w-2 h-2 rounded-full bg-yellow-500"/>
                        <div className="w-2 h-2 rounded-full bg-green-500"/>
                      </div>
                   </div>
                   <div className="space-y-6">
                      {[
                        { step: '01', title: 'Formation', status: 'Done' },
                        { step: '02', title: 'Legal & Banking', status: 'In Progress' },
                        { step: '03', title: 'Tech Stack Setup', status: 'Pending' },
                        { step: '04', title: 'Customer Onboarding', status: 'Pending' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                           <div className="font-mono text-xs text-[var(--muted-foreground)] opacity-50">{item.step}</div>
                           <div className="flex-1 font-medium text-sm">{item.title}</div>
                           <div className={`text-[10px] px-2 py-0.5 rounded-full border ${
                             item.status === 'Done' ? 'border-green-900 bg-green-900/20 text-green-500' :
                             item.status === 'In Progress' ? 'border-yellow-900 bg-yellow-900/20 text-yellow-500' :
                             'border-[var(--border)] text-[var(--muted-foreground)]'
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
      <section className="py-24 px-6 relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 uppercase tracking-tighter">Core Principles</h2>
            <p className="text-[var(--muted-foreground)] max-w-xl mx-auto text-sm font-medium uppercase tracking-widest opacity-60">
              How we forge success from the ground up.
            </p>
          </div>
          
          <AnimatedCardStack />
        </div>
      </section>

      {/* Pricing / Join */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl font-display font-bold mb-4">Membership Options</h2>
               <p className="text-[var(--muted-foreground)]">Choose your level of involvement.</p>
            </div>
            <PricingTable 
              isLoading={false} 
              onSelectPlan={() => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' })} 
            />
         </div>
      </section>

      {/* The Application Interface */}
      <section id="apply" className="py-24 px-4 bg-[var(--background)]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-display font-bold mb-3">Initiate Sequence</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Request access to the foundry.</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden relative">
             {/* Terminal Header */}
             <div className="h-10 bg-[var(--surface-muted)] border-b border-[var(--border)] flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] opacity-80" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] opacity-80" />
                <div className="ml-4 text-[10px] font-mono text-[var(--muted-foreground)] opacity-50">user@theforge:~</div>
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
                              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${currentStep >= s ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
                           ))}
                        </div>

                        {currentStep === 1 && (
                           <div className="animate-fade-in-up">
                              <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-bold mb-6 block">Select Operator Mode</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <button
                                    type="button"
                                    onClick={() => handleSelectRole('investor')}
                                    className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)] transition-all text-left group"
                                 >
                                    <div className="font-bold text-[var(--foreground)] mb-1 group-hover:text-[var(--accent)] transition-colors">Capital Partner</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">Passive stake. Financial contribution only.</div>
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => handleSelectRole('builder')}
                                    className="p-6 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)] transition-all text-left group"
                                 >
                                    <div className="font-bold text-[var(--foreground)] mb-1 group-hover:text-[var(--accent)] transition-colors">Builder</div>
                                    <div className="text-xs text-[var(--muted-foreground)]">Active stake. Sweat equity & skills.</div>
                                 </button>
                              </div>
                           </div>
                        )}

                        {currentStep === 2 && (
                           <div className="animate-fade-in-up space-y-6">
                              <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-bold block">Identity Config</label>
                              <div className="grid gap-4">
                                 <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleFormChange('name')}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
                                    placeholder="Full Name"
                                 />
                                 <input
                                    type="email"
                                    value={formData.email}
                                    onChange={handleFormChange('email')}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
                                    placeholder="Email Address"
                                 />
                                 {role === 'investor' && (
                                     <select
                                       value={formData.capital}
                                       onChange={handleFormChange('capital')}
                                       className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all"
                                     >
                                        <option value="">Select Capital Target...</option>
                                        <option value="25k">25k Tier</option>
                                        <option value="50k">50k Tier</option>
                                        <option value="100k">100k Tier</option>
                                     </select>
                                 )}
                                 {role === 'builder' && (
                                    <input
                                       type="text"
                                       value={formData.skill}
                                       onChange={handleFormChange('skill')}
                                       className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
                                       placeholder="Primary Skill (e.g. Next.js, Growth)"
                                    />
                                 )}
                              </div>
                              <div className="flex justify-between pt-4">
                                 <button type="button" onClick={handlePrevStep} className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">BACK</button>
                                 <button type="button" onClick={handleNextStep} disabled={!formData.name || !formData.email} className="text-xs font-bold text-[var(--accent)] hover:opacity-80 disabled:opacity-50">CONTINUE</button>
                              </div>
                           </div>
                        )}

                        {currentStep === 3 && (
                           <div className="animate-fade-in-up space-y-6">
                              <label className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] font-bold block">Manifesto</label>
                              <textarea
                                 value={formData.why}
                                 onChange={handleFormChange('why')}
                                 rows={4}
                                 className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-[var(--muted-foreground)]/50 resize-none"
                                 placeholder="Tell us why you belong here."
                              />
                               <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={handleFormChange('instagram')}
                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
                                    placeholder="LinkedIn / Social URL"
                                 />
                              
                              {formMessage && <p className="text-red-500 text-xs text-center">{formMessage}</p>}

                              <div className="flex justify-between pt-4">
                                 <button type="button" onClick={handlePrevStep} className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">BACK</button>
                                 <button 
                                    type="submit" 
                                    disabled={formStatus === 'loading'}
                                    className="px-6 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
                                 >
                                    {formStatus === 'loading' ? 'TRANSMITTING...' : 'SUBMIT APPLICATION'}
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
      <footer className="py-12 border-t border-[var(--border)] text-center text-[var(--muted-foreground)] text-xs">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>© 2026 THE FORGE</div>
            <div className="flex gap-6">
               <Link href="/imprint" className="hover:text-[var(--foreground)]">Imprint</Link>
               <Link href="/privacy" className="hover:text-[var(--foreground)]">Privacy</Link>
               <Link href="/terms" className="hover:text-[var(--foreground)]">Terms</Link>
            </div>
         </div>
      </footer>

      {/* Modern Chat Widget */}
      <button
        onClick={isChatOpen ? handleCloseChat : handleOpenChat}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-2xl hover:border-[var(--accent)] transition-all duration-300 ${isChatOpen ? 'rotate-90 opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
         <MessageSquare className="w-5 h-5 text-[var(--foreground)]" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-[350px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl transition-all duration-300 transform origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
         <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-sm font-bold">Orion AI</span>
            </div>
            <button onClick={handleCloseChat}><X className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]" /></button>
         </div>
         <div className="h-[300px] overflow-y-auto p-4 space-y-4">
             {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] text-xs p-3 rounded-xl ${msg.role === 'user' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--surface-muted)] text-[var(--foreground)]'}`}>
                      {msg.content}
                   </div>
                </div>
             ))}
             {chatStatus === 'loading' && <div className="text-xs text-[var(--muted-foreground)] animate-pulse">Orion is thinking...</div>}
             <div ref={chatEndRef} />
         </div>
         <form onSubmit={handleChatSubmit} className="p-3 border-t border-[var(--border)] flex gap-2">
            <input 
               className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:border-[var(--accent)] outline-none"
               placeholder="Type a message..."
               value={chatInput}
               onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="p-2 rounded-lg bg-[var(--surface-muted)] hover:text-[var(--accent)] transition-colors"><ChevronRight className="w-4 h-4" /></button>
         </form>
      </div>

    </div>
  );
}
