'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/app/components/PageShell';
import { BookOpen, Search, Sparkles, Target, Zap } from 'lucide-react';

interface TrainingCourse {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  category: string;
  level?: string | null;
  coverImage?: string | null;
  durationMins?: number | null;
  modulesCount: number;
}

const categoryStyles: Record<string, { gradient: string; icon: typeof Sparkles }> = {
  'Go-To-Market': { gradient: 'from-[#1c1c1c] via-[#2b1f14] to-[#0b0b0b]', icon: Target },
  Distribution: { gradient: 'from-[#151515] via-[#13212b] to-[#0a0a0a]', icon: Zap },
  Strategy: { gradient: 'from-[#1a1a1a] via-[#2c2410] to-[#0b0b0b]', icon: Sparkles },
};

export default function ResourcesPage() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    async function fetchTraining() {
      try {
        setLoading(true);
        const response = await fetch('/api/training');
        if (!response.ok) throw new Error('Failed to fetch training');
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Training load error:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTraining();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(courses.map((course) => course.category).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [courses]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      (course.summary || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === 'All' || course.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageShell>
      <header className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/60">
          <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
          Forge Academy
        </div>
        <h1 className="text-4xl md:text-5xl font-instrument-serif text-white tracking-tight mt-4 mb-3">
          Community-Schulung, aber mit Output.
        </h1>
        <p className="text-sm text-white/40 max-w-2xl">
          Klar strukturierte Trainings, gebaut aus echten Founder-Workflows. Kein Blabla,
          sondern Systeme, die du direkt anwendest.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-white/30" />
          <input
            type="text"
            placeholder="Suche nach Themen, Strategien, Modulen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[var(--accent)]/40 outline-none transition-all text-sm text-white placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-5 py-3 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap border ${
                filterCategory === cat
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white/5 rounded-3xl border border-dashed border-white/10 p-16 text-center">
          <BookOpen className="w-10 h-10 text-white/30 mx-auto mb-4" />
          <p className="text-white/40 font-bold text-lg">Noch keine Trainings vorhanden.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const style = categoryStyles[course.category] || categoryStyles.Strategy;
            const Icon = style.icon;

            return (
              <Link
                key={course.id}
                href={`/resources/${course.slug}`}
                className="group bg-[#0f0f0f] rounded-3xl border border-white/10 overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`relative h-36 bg-gradient-to-br ${style.gradient}`}>
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.35),_transparent_55%)]" />
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70">
                    <Icon className="w-4 h-4 text-[#D4AF37]" />
                    {course.category}
                  </div>
                  <div className="absolute bottom-4 left-4 text-[11px] text-white/80 font-bold uppercase tracking-widest">
                    {course.level || 'Operator Track'}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-white leading-tight">{course.title}</h3>
                  <p className="text-sm text-white/50 line-clamp-3">
                    {course.summary || 'Kein Summary hinterlegt.'}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>{course.modulesCount} Module</span>
                    {course.durationMins ? (
                      <span>{course.durationMins} Min</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
