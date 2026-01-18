'use client';

import { useState, useEffect } from 'react';
import PageShell from '@/app/components/PageShell';
import { Search, FileText, Lock, Download, ExternalLink, Calendar, Shield, BookOpen } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  uploadDate: string;
  accessLevel: 'All Founders' | 'Core Team';
}

const categories = ['All', 'Guide', 'Contract', 'Template', 'Process'];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true);
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        const data = await response.json();
        setResources(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === 'All' || res.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageShell>
      <header className="mb-12">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Knowledge Base</h1>
        <p className="text-zinc-500 font-medium">Verträge, Playbooks und Vorlagen für deinen Erfolg.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Suche nach Dokumenten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-zinc-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-zinc-300 p-20 text-center">
          <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-400 font-bold text-lg">Keine Dokumente gefunden.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div
              key={res.id}
              className="group bg-white rounded-3xl border border-zinc-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                  {res.category === 'Contract' ? (
                    <Shield className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                {res.accessLevel === 'Core Team' && (
                  <div className="bg-amber-50 text-amber-600 p-2 rounded-xl" title="Core Team Only">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-zinc-900 mb-2 leading-tight pr-8">
                {res.name}
              </h3>
              <p className="text-sm text-zinc-500 mb-6 line-clamp-2 leading-relaxed">
                {res.description}
              </p>

              <div className="border-t border-zinc-100 pt-4 mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  {res.uploadDate ? new Date(res.uploadDate).toLocaleDateString('de-DE') : 'N/A'}
                </div>
                
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black text-zinc-900 hover:text-blue-600 transition-colors group-hover:underline"
                >
                  Download <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}