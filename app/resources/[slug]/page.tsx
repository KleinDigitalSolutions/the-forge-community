'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageShell from '@/app/components/PageShell';
import { ChevronLeft, BookOpen, Sparkles, Clock, Layers, CheckCircle2, Share2, Bookmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type TrainingModule = {
  id: string;
  order: number;
  title: string;
  summary?: string | null;
  content: string;
};

type TrainingCourse = {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  category: string;
  level?: string | null;
  coverImage?: string | null;
  durationMins?: number | null;
  modules: TrainingModule[];
};

export default function TrainingDetailPage() {
  const params = useParams();
  const slug = useMemo(() => {
    const raw = params?.slug;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/training/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Training not found');
        return res.json();
      })
      .then((data) => {
        setCourse(data);
        if (data.modules?.length > 0) {
          setActiveModule(`module-${data.modules[0].order}`);
        }
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle intersection observer to highlight active module in sidebar
  useEffect(() => {
    if (!course) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveModule(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-10% 0% -70% 0%' }
    );

    course.modules.forEach((module) => {
      const el = document.getElementById(`module-${module.order}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-white/40 gap-4">
        <div className="w-12 h-12 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-[0.2em]">System wird geladen...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-white/40">
        Training nicht gefunden.
      </div>
    );
  }

  return (
    <PageShell>
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between mb-12">
        <Link 
          href="/resources" 
          className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-[#D4AF37] transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Zurück zur Academy
        </Link>
        <div className="flex gap-3">
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Bookmark className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-16 rounded-[2.5rem] border border-white/10 overflow-hidden glass-card"
      >
        <div className="absolute inset-0 bg-grid-small opacity-10" />
        <div className="relative p-8 md:p-12 lg:p-16">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              {course.category}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Clock className="w-3.5 h-3.5" />
              {course.durationMins || '45'} Min Training
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Layers className="w-3.5 h-3.5" />
              {course.modules.length} Module
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-instrument-serif text-white tracking-tight max-w-4xl mb-6">
            {course.title}
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl leading-relaxed">
            {course.summary}
          </p>

          <div className="mt-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
               <BookOpen className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Kurs-Level</div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">{course.level || 'OPERATOR TRACK'}</div>
            </div>
          </div>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#D4AF37]/10 to-transparent pointer-events-none" />
      </motion.section>

      {/* Course Content Grid */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-12 mt-10 relative">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Kurs-Struktur</h3>
                <span className="text-[10px] font-black text-[#D4AF37]">{course.modules.length} Sektionen</span>
              </div>
              
              <div className="space-y-1">
                {course.modules.map((module) => {
                  const id = `module-${module.order}`;
                  const isActive = activeModule === id;
                  
                  return (
                    <a
                      key={module.id}
                      href={`#${id}`}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all duration-300",
                        isActive 
                          ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_10px_20px_rgba(212,175,55,0.15)]" 
                          : "bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors",
                        isActive ? "text-black/60" : "text-white/20"
                      )}>
                        {module.order.toString().padStart(2, '0')}
                      </span>
                      <span className="text-xs font-bold truncate tracking-tight">{module.title}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#D4AF37]/10 bg-[#D4AF37]/5 p-6">
              <h4 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest mb-3">Community Help</h4>
              <p className="text-xs text-[#D4AF37]/60 leading-relaxed mb-4">
                Hast du Fragen zu diesem Modul? Tausch dich im Squad-Channel aus.
              </p>
              <Link 
                href="/squads" 
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-[#D4AF37] transition-colors"
              >
                Zum Channel <ChevronLeft className="w-3 h-3 rotate-180" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="space-y-12">
          {course.modules.map((module) => (
            <motion.section
              key={module.id}
              id={`module-${module.order}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className="relative bg-[#0f0f0f] rounded-[2.5rem] border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-500">
                <div className="p-8 md:p-12 lg:p-14">
                  <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-4">
                        <span className="w-8 h-[1px] bg-[#D4AF37]/30" />
                        Modul {module.order.toString().padStart(2, '0')}
                      </div>
                      <h2 className="text-3xl md:text-4xl font-instrument-serif text-white tracking-tight">
                        {module.title}
                      </h2>
                    </div>
                  </header>

                  {module.summary && (
                    <div className="mb-10 p-6 rounded-2xl bg-white/5 border border-white/10 border-l-2 border-l-[#D4AF37]">
                      <p className="text-sm font-medium text-white/70 italic leading-relaxed">
                        "{module.summary}"
                      </p>
                    </div>
                  )}

                  <div className="prose prose-invert prose-base max-w-none 
                    prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-headings:mb-6 prose-headings:mt-10
                    prose-h2:text-2xl prose-h3:text-xl
                    prose-p:text-white/70 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                    prose-strong:text-[#D4AF37] prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-8 prose-ul:space-y-3
                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-8 prose-ol:space-y-3
                    prose-li:text-white/60 prose-li:text-base
                    prose-a:text-[#D4AF37] prose-a:no-underline prose-a:font-bold border-b border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all
                    prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[#D4AF37] prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:p-6
                    prose-blockquote:border-l-[#D4AF37] prose-blockquote:bg-white/5 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-white/50
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {module.content}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {/* Visual module divider */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.02] to-transparent pointer-events-none" />
              </div>
            </motion.section>
          ))}

          {/* Course Footer */}
          <footer className="pt-12 pb-20 text-center">
             <div className="w-16 h-[1px] bg-white/10 mx-auto mb-8" />
             <h3 className="text-2xl font-instrument-serif text-white mb-4">Du hast dieses Training abgeschlossen.</h3>
             <p className="text-white/40 text-sm mb-8">Bereit für den nächsten Schritt?</p>
             <Link 
              href="/resources"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-full font-black uppercase tracking-widest text-[11px] hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all hover:-translate-y-1"
             >
              Alle Trainings ansehen <ArrowRight className="w-4 h-4 rotate-180" />
             </Link>
          </footer>
        </div>
      </div>
    </PageShell>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8L22 12L18 16" />
      <path d="M2 12H22" />
    </svg>
  );
}