'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, X, Plus, Package, Mail, Globe, ArrowLeft } from 'lucide-react';

interface DirectoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  ventureId: string;
}

export function DirectoryImportModal({ isOpen, onClose, onImported, ventureId }: DirectoryImportModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [importingId, setImportingId] = useState<string | null>(null);
  const LIMIT = 25;

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prev => prev + LIMIT);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchResources = async (currentOffset: number, query: string, isNewSearch = false) => {
    setLoading(true);
    try {
      const url = `/api/resources?limit=${LIMIT}&offset=${currentOffset}${query ? `&search=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newItems = data.resources || [];
        const total = data.total || 0;
        if (isNewSearch) setResources(newItems);
        else setResources(prev => [...prev, ...newItems]);
        setHasMore((isNewSearch ? newItems.length : resources.length + newItems.length) < total);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setResources([]);
      setOffset(0);
      setHasMore(true);
      fetchResources(0, searchQuery, true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (offset > 0 && isOpen) fetchResources(offset, searchQuery);
  }, [offset, isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        setOffset(0);
        fetchResources(0, searchQuery, true);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  async function handleImport(resourceId: string) {
    setImportingId(resourceId);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/sourcing/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId })
      });
      if (res.ok) {
        onImported();
        onClose();
      }
    } finally {
      setImportingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col z-[2147483647] overflow-hidden">
      {/* 1. CLEAN PRO HEADER - Overrides EVERYTHING */}
      <header className="flex-none h-20 bg-black border-b border-white/10 px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-8">
          <button 
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all group active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white" />
            <span className="text-xs font-black uppercase tracking-widest">Zurück</span>
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-tight">Partner & B2B Großhändler</h1>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Live Database</span>
            </div>
          </div>
        </div>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-2xl px-12">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#D4AF37] transition-colors" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Händler, Produkte oder Kategorien durchsuchen..."
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white placeholder:text-white/10 focus:border-[#D4AF37]/50 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Global Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Netzwerk Status</span>
            <span className="text-xs font-bold text-[#D4AF37]">GLOBAL ACCESS</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#D4AF37]" />
          </div>
        </div>
      </header>

      {/* 2. TABLE HEADERS */}
      <div className="flex-none bg-[#080808] border-b border-white/5 px-10 py-4 hidden sm:flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
        <div className="w-1/4">Unternehmen / Branche</div>
        <div className="flex-1 px-6">Beschreibung & Leistungen</div>
        <div className="w-48">Region</div>
        <div className="w-40 text-right">Aktion</div>
      </div>

      {/* 3. SCROLLABLE LIST */}
      <main className="flex-1 overflow-y-auto bg-[#050505] custom-scrollbar overscroll-contain">
        <div className="max-w-[1800px] mx-auto divide-y divide-white/5">
          {resources.map((res, index) => (
            <div 
              key={res.id} 
              ref={index === resources.length - 1 ? lastElementRef : null}
              className="flex flex-col sm:flex-row sm:items-center px-8 sm:px-10 py-6 hover:bg-white/[0.02] transition-all group gap-6 sm:gap-0"
            >
              {/* Company Info */}
              <div className="w-full sm:w-1/4 flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#D4AF37] group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-lg truncate group-hover:text-[#D4AF37] transition-colors">{res.title}</h4>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">{res.type || res.category}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex-1 sm:px-6">
                <p className="text-sm text-white/40 line-clamp-2 leading-relaxed max-w-3xl">
                  {res.description || 'Keine detaillierte Beschreibung verfügbar.'}
                </p>
              </div>

              {/* Location */}
              <div className="w-full sm:w-48 flex items-center gap-2 text-xs font-medium text-white/30">
                <MapPin className="w-4 h-4 text-white/10" />
                <span>{res.location || 'Deutschland'}</span>
              </div>

              {/* Action */}
              <div className="w-full sm:w-40 flex justify-end">
                <button
                  onClick={() => handleImport(res.id)}
                  disabled={!!importingId}
                  className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-[#D4AF37] hover:text-black border border-white/10 hover:border-[#D4AF37] rounded-xl text-[11px] font-black uppercase tracking-widest text-white/60 transition-all disabled:opacity-50 active:scale-95"
                >
                  {importingId === res.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Hinzufügen'
                  )}
                </button>
              </div>
            </div>
          ))}

          {loading && (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Synchronisiere Netzwerk-Daten...</p>
            </div>
          )}
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="flex-none bg-black border-t border-white/10 px-8 py-4 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
          {resources.length} Partner verfügbar
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Stake & Scale OS 2026</span>
        </div>
      </footer>
    </div>
  );
}