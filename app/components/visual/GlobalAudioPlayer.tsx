'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Music, X, ChevronRight, Volume2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    SC: any;
  }
}

export default function GlobalAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const handleToggleModal = (e: any) => {
      setIsModalOpen(e.detail?.open ?? !isModalOpen);
    };
    window.addEventListener('forge-toggle-music', handleToggleModal);

    const loadWidget = () => {
      if (iframeRef.current && window.SC) {
        const widget = window.SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        widget.bind(window.SC.Widget.Events.READY, () => {
          widget.getCurrentSound((track: any) => setCurrentTrack(track));
        });

        widget.bind(window.SC.Widget.Events.PLAY, () => {
          setIsPlaying(true);
          setHasStarted(true);
        });

        widget.bind(window.SC.Widget.Events.PAUSE, () => setIsPlaying(false));
        widget.bind(window.SC.Widget.Events.FINISH, () => setIsPlaying(false));
      }
    };

    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = loadWidget;
      document.body.appendChild(script);
    } else {
      loadWidget();
    }

    return () => window.removeEventListener('forge-toggle-music', handleToggleModal);
  }, [isModalOpen]);

  const togglePlay = () => widgetRef.current?.toggle();

  return (
    <>
      {/* 
          DAS MODAL-GEHÄUSE (EXAKT DEIN DESIGN)
          Wir nutzen kein AnimatePresence für den Container, damit der Iframe nicht unmountet.
      */}
      <div 
        className={`fixed inset-0 z-[150] flex items-center justify-center pointer-events-none transition-all duration-500 ${
          isModalOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div 
          className={`absolute bottom-12 left-1/2 -translate-x-1/2 w-[min(540px,95vw)] transition-transform duration-500 ${
            isModalOpen ? 'translate-y-0 scale-100 pointer-events-auto' : 'translate-y-12 scale-95 pointer-events-none'
          }`}
        >
          <div className="relative group">
            {/* Multi-Layer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] via-orange-600 to-amber-900 rounded-[2.5rem] opacity-20 group-hover:opacity-40 blur-xl transition duration-1000 animate-pulse"></div>
            
            {/* Main Console Body */}
            <div className="relative bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
              
              {/* Holographic Texture Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
              <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

              {/* Tech Brackets - PERFEKTE WÖLBUNG */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]/60 rounded-tl-[2.5rem] pointer-events-none" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]/60 rounded-tr-[2.5rem] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]/60 rounded-bl-[2.5rem] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]/60 rounded-br-[2.5rem] pointer-events-none" />

              {/* Header Area */}
              <div className="px-8 pt-7 pb-5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center">
                    <Music className="w-5 h-5 text-[#D4AF37] animate-[spin_4s_linear_infinite]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Audio Core</h2>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[7px] text-green-400 font-bold animate-pulse">LIVE</span>
                    </div>
                    <p className="text-[9px] text-[#D4AF37]/50 uppercase tracking-[0.2em] font-mono">FRG-OS // SIGNAL_V2.23</p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }} 
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white/40 hover:text-[#D4AF37]"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>

              {/* Player Stage */}
              <div className="px-6 pb-6 relative z-10">
                <div className="relative rounded-[1.5rem] overflow-hidden bg-black/60 border border-white/5 shadow-inner">
                  <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] border border-white/10 rounded-[1.5rem]" />
                  <div className="p-4 flex items-center justify-center min-h-[180px]">
                    <iframe 
                      ref={iframeRef}
                      width="100%" 
                      height="166" 
                      scrolling="no" 
                      frameBorder="no" 
                      allow="autoplay" 
                      className="rounded-xl relative z-10"
                      src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2233330283&color=%23ffb800&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                    />
                  </div>
                </div>
              </div>
              
              {/* Footer - NAHTLOS */}
              <div className="px-8 py-4 bg-white/[0.05] border-t border-white/10 flex justify-between items-center relative z-10">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#D4AF37] animate-ping" />
                    <span className="text-[7px] font-bold text-[#D4AF37]/80 uppercase tracking-widest">Mastering Active</span>
                  </div>
                </div>
                <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.3em]">Sector 7-G // Audio Stream</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIE DEZENTE STEUERUNG (PILLE) */}
      <AnimatePresence>
        {hasStarted && !isModalOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-24 right-4 lg:top-6 lg:right-8 lg:bottom-auto z-[100] pointer-events-auto"
          >
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-2 group">
              {!isMinimized && (
                <div className="px-3 flex flex-col">
                  <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Audio System</span>
                  <span className="text-[10px] text-white/70 font-medium max-w-[120px] truncate">{currentTrack?.title || 'Notre Dame @ Paranormal'}</span>
                </div>
              )}
              <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
                <button onClick={togglePlay} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#D4AF37] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button onClick={() => setIsModalOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              <button onClick={() => setIsMinimized(!isMinimized)} className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-[#D4AF37] transition-all">
                {isMinimized ? <Volume2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}