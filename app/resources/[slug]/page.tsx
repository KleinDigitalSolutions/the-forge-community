'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import { ChevronLeft, BookOpen, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/training/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Training not found');
        return res.json();
      })
      .then((data) => setCourse(data))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-white/40">
        Training wird geladen...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-white/40">
        Training nicht gefunden.
      </div>
    );
  }

  return (
    <PageShell>
      <div className="mb-8">
        <Link href="/resources" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Zurueck zur Academy
        </Link>
      </div>

      <section className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-[#1a1a1a] via-[#261b12] to-[#0b0b0b]">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.35),_transparent_55%)]" />
          <div className="absolute top-6 left-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            {course.category}
          </div>
          <div className="absolute bottom-6 left-6">
            <h1 className="text-3xl md:text-4xl font-instrument-serif text-white">{course.title}</h1>
            <p className="text-sm text-white/50 mt-2 max-w-2xl">{course.summary}</p>
          </div>
          <div className="absolute top-6 right-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            {course.level || 'Operator Track'}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[280px_1fr] gap-8 mt-10">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Module</div>
            <div className="space-y-2 text-sm text-white/70">
              {course.modules.map((module) => (
                <a
                  key={module.id}
                  href={`#module-${module.order}`}
                  className="block rounded-xl px-3 py-2 border border-transparent hover:border-white/20 hover:bg-white/5 transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mr-2">
                    {module.order.toString().padStart(2, '0')}
                  </span>
                  {module.title}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          {course.modules.map((module) => (
            <section
              key={module.id}
              id={`module-${module.order}`}
              className="rounded-3xl border border-white/10 bg-[#0f0f0f] p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  Modul {module.order.toString().padStart(2, '0')}
                </span>
                <h2 className="text-xl font-instrument-serif text-white">{module.title}</h2>
              </div>
              {module.summary && (
                <p className="text-sm text-white/50 mb-6">{module.summary}</p>
              )}
              <div className="prose prose-invert prose-sm max-w-none 
                prose-headings:text-white prose-headings:font-bold prose-headings:text-sm prose-headings:mb-2 prose-headings:mt-4
                prose-p:text-white/80 prose-p:my-2
                prose-strong:text-[#D4AF37] prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-4 prose-ul:my-2
                prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-2
                prose-li:text-white/70 prose-li:my-1
                prose-a:text-[#D4AF37] prose-a:underline hover:prose-a:text-white transition-colors
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {module.content}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
