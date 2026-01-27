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
  ChevronLeft,
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
import { VideoPreview } from '@/app/components/media/VideoPreview';

// --------------------------------------------------------

type ChatMessage = {

  role: 'assistant' | 'user';
  content: string;
};

type MediaPreviewItem = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: 'IMAGE' | 'VIDEO';
  prompt: string | null;
  model: string | null;
};

export default function Home() {
  const localMediaPreview: MediaPreviewItem[] = [
    {
      id: '3da7a0d1-3439-438b-8620-3d6db1c2fd7e',
      url: '/Ai_videos/3da7a0d1-3439-438b-8620-3d6db1c2fd7e.mp4',
      thumbnailUrl: null,
      type: 'VIDEO',
      prompt: 'Showcase: AI Video',
      model: 'Veo'
    },
    {
      id: '14bc273f-d13e-4cac-b328-6af51be39bf1',
      url: '/Ai_videos/14bc273f-d13e-4cac-b328-6af51be39bf1.mp4',
      thumbnailUrl: null,
      type: 'VIDEO',
      prompt: 'Showcase: AI Video',
      model: 'Veo'
    },
    {
      id: '817fae87-abc7-47ea-b16a-218e20dda4cc',
      url: '/Ai_videos/817fae87-abc7-47ea-b16a-218e20dda4cc.mp4',
      thumbnailUrl: null,
      type: 'VIDEO',
      prompt: 'Showcase: AI Video',
      model: 'Veo'
    },
    {
      id: '04890af6-4f5e-4e43-9b8f-75eefbdb1ece',
      url: '/Ai_videos/04890af6-4f5e-4e43-9b8f-75eefbdb1ece.mp4',
      thumbnailUrl: null,
      type: 'VIDEO',
      prompt: 'Showcase: AI Video',
      model: 'Veo'
    },
    {
      id: 'eafa6afe-e557-4ef9-8e03-52e31b892496',
      url: '/Ai_videos/eafa6afe-e557-4ef9-8e03-52e31b892496.mp4',
      thumbnailUrl: null,
      type: 'VIDEO',
      prompt: 'Showcase: AI Video',
      model: 'Veo'
    },
    {
      id: 'efd8acba-d343-4eae-b718-43f2876de35f',
      url: '/Ai_videos/efd8acba-d343-4eae-b718-43f2876de35f.mp4',
      thumbnailUrl: null,
      type: 'VIDEO',
      prompt: 'Showcase: AI Video',
      model: 'Veo'
    },
  ];
  const useLocalMediaPreview = true;
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
  const veoCarouselItems = [
    { src: '/Veo/veo_make_person_and_scene_in_video.mp4', label: 'Cinematic Scene' },
    { src: '/Veo/Veo_product_image_to_video.mp4', label: 'Product Sequence' },
    { src: '/Veo/veo_marketing_video.mp4', label: 'Marketing Video' },
    { src: '/Veo/veo__marketing_video.mp4', label: 'Website Hero' },
    { src: '/Ai_videos/0228dd17-aca9-42cf-bb1e-10d1c7fa5453.mp4', label: 'Marketing Cut' },
  ];
  const [veoCarouselIndex, setVeoCarouselIndex] = useState(0);
  
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
  const [mediaPreview, setMediaPreview] = useState<MediaPreviewItem[]>(localMediaPreview);
  const [mediaLoading, setMediaLoading] = useState(!useLocalMediaPreview);
  const [mediaError, setMediaError] = useState(false);

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

  useEffect(() => {
    if (useLocalMediaPreview) return;
    let active = true;
    const loadMedia = async () => {
      try {
        const res = await fetch('/api/media?limit=6&sort=new');
        if (!res.ok) throw new Error('Media load failed');
        const data = await res.json();
        if (active) {
          setMediaPreview(Array.isArray(data?.items) ? data.items.slice(0, 6) : []);
        }
      } catch (error) {
        if (active) setMediaError(true);
      } finally {
        if (active) setMediaLoading(false);
      }
    };
    loadMedia();
    return () => {
      active = false;
    };
  }, []);

  const handleVeoNext = () => {
    setVeoCarouselIndex((prev) => (prev + 1) % veoCarouselItems.length);
  };

  const handleVeoPrev = () => {
    setVeoCarouselIndex((prev) => (prev - 1 + veoCarouselItems.length) % veoCarouselItems.length);
  };

  return (
    <div className="min-h-screen bg-black text-(--foreground) selection:bg-[#D4AF37] selection:text-black overflow-x-hidden relative">
      
      <div className="relative z-10">
        {/* Integrated Hero & Header */}
        <ResponsiveHeroBanner 
          badgeText="BATCH #001 — REKRUTIERUNG LÄUFT"
          title="Viele Founder. 1 Brand."
          titleLine2="Volle Transparenz."
          description="STAKE & SCALE vereint Community-Capital, KI-Studios und radikale Execution. Forge-Hub, Decision Hall, Forum und Direct Messages bündeln Ideen, Votes und Output in einem System."
          backgroundVideoUrl="/hero_loop.mp4"
          backgroundVideoUrlMobile="/hero_loop_mobile.mp4"
          primaryButtonText="SEQUENZ STARTEN"
          primaryButtonHref="#apply"
          secondaryButtonText="PROTOKOLL ANSEHEN"
          secondaryButtonHref="#"
          partners={[
            { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg", href: "https://vercel.com", scale: 1.2 },
            { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", href: "https://stripe.com" },
            { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg", href: "https://nextjs.org" },
            { logoUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg", href: "https://tailwindcss.com" },
            { logoUrl: "https://simpleicons.org/icons/prisma.svg", href: "https://prisma.io" },
            { logoUrl: "/partners/openai.svg", href: "https://openai.com" },
            { logoUrl: "/partners/claude-color.svg", href: "https://www.anthropic.com" },
            { logoUrl: "https://simpleicons.org/icons/googlegemini.svg", href: "https://deepmind.google/technologies/gemini/" },
            { logoUrl: "/partners/n8n-color.svg", href: "https://n8n.io" },
            { logoUrl: "/partners/notion.svg", href: "https://www.notion.so" },
            { logoUrl: "/partners/github.svg", href: "https://github.com" },
            { logoUrl: "/partners/bfl.svg", href: "https://blackforestlabs.ai" },
            { logoUrl: "/partners/aws-color.svg", href: "https://aws.amazon.com" },
            { logoUrl: "/partners/kling-color.svg", href: "https://klingai.com" },
            { logoUrl: "/partners/groq.svg", href: "https://groq.com" },
            { logoUrl: "/partners/runway.svg", href: "https://runwayml.com" },
          ]}
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

            {/* Veo Section - MOVED UP */}
            <section id="veo" className="relative py-24 px-4 md:px-6 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.15),_transparent_55%)] opacity-80" />
              <div className="max-w-6xl mx-auto relative">
                <div className="max-w-3xl mx-auto mb-12 space-y-4 text-center">
                  <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur">
                    <img
                      src="/partners/Google_Gemini_icon_2025.svg"
                      alt="Gemini"
                      className="h-4 w-4 opacity-80"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Jetzt verfügbar</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-(--accent)">Veo 3.1</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-instrument-serif text-white leading-tight">
                    VEO 3.1: Drei Funken, ein Feuer.
                  </h2>
                  <p className="text-sm md:text-base text-white/60 leading-relaxed">
                    Deine Brand-DNA trifft auf die stärkste Video-KI der Welt.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
                  <div className="order-2 lg:order-1 space-y-4">
                    {[
                      {
                        step: '1',
                        title: 'Identität',
                        desc: 'Foto von dir oder deinem Model.',
                        accent: 'border-[#D4AF37]/40 text-[#D4AF37]',
                      },
                      {
                        step: '2',
                        title: 'Objekt',
                        desc: 'Dein Produkt-Shot in Nahaufnahme.',
                        accent: 'border-white/15 text-white/80',
                      },
                      {
                        step: '3',
                        title: 'Stil',
                        desc: 'Farben & Vibe deiner Brand.',
                        accent: 'border-white/15 text-white/80',
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm hover:border-[#D4AF37]/40 transition-all"
                      >
                        <div className={`h-10 w-10 rounded-full border ${item.accent} flex items-center justify-center text-xs font-black`}>
                          {item.step}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{item.title}</div>
                          <div className="text-xs text-white/50">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                    <p className="text-sm text-white/60 leading-relaxed">
                      Das Resultat: Ein nahtloses Marketing-Video, das deine Brand-DNA atmet.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        href="#apply"
                        className="rounded-full bg-[#D4AF37] px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-black hover:brightness-110 transition"
                      >
                        Jetzt erste Sequenz generieren
                      </Link>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                        Vollständig kommerziell nutzbar. Generiert mit lizenzierten Modellen über die Forge-Pipeline.
                      </span>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 flex lg:justify-end">
                    <div className="relative aspect-[9/16] w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[340px] xl:max-w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
                      <div className="absolute inset-0">
                        <VideoPreview
                          src="/Veo/veo_make_person_to_video.mp4"
                          className="h-full w-full"
                          mediaClassName="h-full w-full object-cover"
                          enableHover={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
                    <div className="absolute inset-0">
                      <VideoPreview
                        key={veoCarouselItems[veoCarouselIndex]?.src}
                        src={veoCarouselItems[veoCarouselIndex]?.src}
                        className="h-full w-full"
                        mediaClassName="h-full w-full object-cover"
                        enableHover={false}
                      />
                    </div>
                    <div className="absolute top-4 left-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[9px] font-black uppercase tracking-[0.3em] text-white/60 backdrop-blur">
                      {veoCarouselItems[veoCarouselIndex]?.label}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-4">
                      <button
                        type="button"
                        onClick={handleVeoPrev}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/70 hover:text-white transition"
                        aria-label="Vorheriges Video"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        {veoCarouselItems.map((_, index) => (
                          <button
                            key={`veo-dot-${index}`}
                            type="button"
                            onClick={() => setVeoCarouselIndex(index)}
                            className={`h-2 w-2 rounded-full transition ${index === veoCarouselIndex ? 'bg-[#D4AF37]' : 'bg-white/30'}`}
                            aria-label={`Video ${index + 1}`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleVeoNext}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/70 hover:text-white transition"
                        aria-label="Naechstes Video"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

        {/* Metrics Section - HUD Style */}
        <section className="relative py-24 z-20 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { label: 'Execution Hebel', value: '25x', sub: 'Vs. Solo Gründung' },
                { label: 'Tage bis Launch', value: 'Ø 45', sub: 'Infrastruktur Ready' },
                { label: 'Risiko-Faktor', value: '-96%', sub: 'Durch Kapital-Split' },
                { label: 'Community Owned', value: '100%', sub: 'Keine VCs. Echte Werte.' },
              ].map((stat, i) => (
                <div key={i} className="glass-card backdrop-blur-md p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col items-center justify-center hover:border-(--accent)/50 transition-all duration-700 group overflow-hidden relative shadow-2xl bg-black/20">
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
                  <div key={step.label} className="glass-card border border-white/10 rounded-2xl p-4 bg-black/30 backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      {step.label}
                    </div>
                    <div className="text-sm text-white mt-1">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 bg-black/40 backdrop-blur-md">
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
                  <div key={module.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors">
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

        {/* Media Wall Preview */}
        <section id="media-preview" className="relative py-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  Media Wall
                </div>
                <h2 className="text-3xl md:text-5xl font-instrument-serif text-white">
                  Live Output aus The Forge.
                </h2>
                <p className="text-sm text-white/60 max-w-xl">
                  Echte Generierungen aus dem System. Klick dich durch die letzten Bilder und Videos.
                </p>
              </div>
              <Link
                href="/media"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 transition hover:text-white hover:border-white/30"
              >
                Media Wall öffnen
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mediaLoading && (
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`media-skeleton-${index}`}
                    className="h-[420px] rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse"
                  />
                ))
              )}

              {!mediaLoading && mediaPreview.map((item) => {
                const isVideo = item.type === 'VIDEO';
                return (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_0_40px_rgba(0,0,0,0.25)] transition-all hover:border-white/30"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden">
                      {isVideo ? (
                        <VideoPreview
                          src={item.url}
                          poster={item.thumbnailUrl}
                          className="h-full w-full"
                          mediaClassName="h-full w-full object-cover"
                          enableHover={false}
                          showOverlay={true}
                          stopClickPropagation={true}
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.prompt || 'Generated asset'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>

                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/80 backdrop-blur">
                      {isVideo ? <Film className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      {isVideo ? 'Video' : 'Image'}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-4 pt-10">
                      {item.model && (
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] text-white/60">
                          {item.model}
                        </div>
                      )}
                      <p className="text-xs text-white/60">
                        {item.prompt || 'Ohne Prompt.'}
                      </p>
                    </div>
                  </div>
                );
              })}

              {!mediaLoading && mediaPreview.length === 0 && (
                <div className="col-span-full flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-sm text-white/50">
                  {mediaError ? 'Media Preview konnte nicht geladen werden.' : 'Noch keine Media Assets.'}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Transparency Preview */}
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

            <Hero195 className="relative overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md">
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

        {/* System Status - Glass Style */}
        <section id="status" className="py-24 px-4 md:px-6 relative border-y border-white/5 bg-black/20 backdrop-blur-sm">
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
              <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-5 bg-black/40 backdrop-blur-md">
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

              <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-5 bg-black/40 backdrop-blur-md">
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

              <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-5 bg-black/40 backdrop-blur-md">
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

         {/* Philosophy & Principles - Combined */}
        <section id="philosophy" className="py-40 px-4 md:px-6 relative overflow-hidden border-b border-white/5">
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
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-(--accent) group-hover:bg-(--accent)/10 transition-all duration-500 bg-black/20 backdrop-blur-sm">
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

            {/* --- THE FOUNDER OS (Feature Stack) --- */}
            <div className="mt-40 border-t border-white/5 pt-20">
               <ForgeOSShowcase />
            </div>
          </div>
        </section>

        {/* Principles - System Override */}
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

        {/* Featured Project - Mission Log Style */}
        <section id="projects" className="relative overflow-hidden border-y border-white/5 backdrop-blur-sm">
          <MissionLogCarousel />
        </section>

        {/* --- SHOP STACK --- */}
        <section className="py-20 px-4 md:px-6 relative border-y border-white/5 bg-black/20 backdrop-blur-sm">
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
                 <div className="glass-card border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden bg-black/40 backdrop-blur-md">
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
                       <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
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

            <div className="bg-[#0F1113]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group transition-all duration-700 hover:border-(--accent)/30">
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
                                <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-8 block">Zugang wählen</label>
                                <div className="grid grid-cols-1 gap-6">
                                   {/* Unified Login/Signup */}
                                   <Link
                                      href="/login"
                                      className="p-8 sm:p-12 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all text-center group relative overflow-hidden"
                                   >
                                      <div className="absolute top-0 right-0 p-2 sm:p-3 bg-[#D4AF37] text-black text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                                         Sofort-Start
                                      </div>
                                      <div className="flex flex-col items-center gap-4 mb-4">
                                         <div className="w-16 h-16 rounded-2xl border-2 border-[#D4AF37] bg-[#D4AF37]/10 flex items-center justify-center">
                                            <Zap className="w-8 h-8 text-[#D4AF37]" />
                                         </div>
                                         <div className="font-instrument-serif text-3xl sm:text-4xl text-white group-hover:text-(--accent) transition-colors">
                                            Login / Anmelden
                                         </div>
                                      </div>
                                      <div className="text-sm sm:text-base text-white/70 leading-relaxed max-w-lg mx-auto mb-6">
                                         Starte mit <strong className="text-white">50 AI-Credits gratis</strong> und erkunde alle Forge-Studios.
                                         Login mit Google oder Magic Link.
                                      </div>
                                      <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
                                         <span>Google Login</span>
                                         <span className="w-1 h-1 rounded-full bg-white/20" />
                                         <span>Magic Link</span>
                                      </div>
                                   </Link>

                                   {/* Bewerbung für Batch-Partner */}
                                   <div className="text-center py-4 border-t border-white/5">
                                      <p className="text-xs text-white/40 mb-3 uppercase tracking-widest">
                                         Interesse an aktiver Beteiligung?
                                      </p>
                                      <button
                                         type="button"
                                         onClick={handleNextStep}
                                         className="text-sm text-[#D4AF37] hover:text-white font-bold uppercase tracking-widest transition-colors"
                                      >
                                         Als Batch-Partner bewerben →
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
        <footer className="py-8 border-t border-white/5 relative overflow-hidden bg-[#08090A]/90 backdrop-blur-md">
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
    </div>
  );
}
