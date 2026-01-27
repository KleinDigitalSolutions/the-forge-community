'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Music, X, Volume2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    SC: any;
  }
}

export default function GlobalAudioPlayer() {
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const playlistTracksRef = useRef<any[]>([]);
  const playlistUrl = 'https://api.soundcloud.com/playlists/2180406137';

  // Initialisierung und Event-Listener
  useEffect(() => {
    // Restore state from localStorage
    const saved = localStorage.getItem('forge-audio-started');
    if (saved === 'true') setHasStarted(true);

    const handleToggleModal = (e: any) => {
      setIsModalOpen(e.detail?.open ?? !isModalOpen);
    };
    
    const handlePlay = () => widgetRef.current?.play();
    const handlePause = () => widgetRef.current?.pause();
    const handleToggle = () => widgetRef.current?.toggle();
    const handleSkip = () => widgetRef.current?.next();
    const handlePrev = () => widgetRef.current?.prev();

    window.addEventListener('forge-toggle-music', handleToggleModal);
    window.addEventListener('forge-play-music', handlePlay);
    window.addEventListener('forge-pause-music', handlePause);
    window.addEventListener('forge-toggle-play', handleToggle);
    window.addEventListener('forge-skip-music', handleSkip);
    window.addEventListener('forge-prev-music', handlePrev);

    const loadWidget = () => {
      if (iframeRef.current && window.SC) {
        try {
          const widget = window.SC.Widget(iframeRef.current);
          widgetRef.current = widget;

          widget.bind(window.SC.Widget.Events.READY, () => {
            widget.getSounds((tracks: any[]) => {
              if (Array.isArray(tracks)) {
                playlistTracksRef.current = tracks;
                setPlaylistTracks(tracks);
              }
              widget.getCurrentSound((track: any) => {
                setCurrentTrack(track);
                const list = Array.isArray(tracks) ? tracks : playlistTracksRef.current;
                if (track && list.length) {
                  const idx = list.findIndex((t) => t?.id === track?.id);
                  if (idx >= 0) setCurrentIndex(idx);
                }
                broadcastState(false, track);
              });
            });
          });

          widget.bind(window.SC.Widget.Events.PLAY, () => {
            setIsPlaying(true);
            setHasStarted(true);
            localStorage.setItem('forge-audio-started', 'true');
            widget.getCurrentSound((track: any) => {
              setCurrentTrack(track);
              const list = playlistTracksRef.current;
              if (track && list.length) {
                const idx = list.findIndex((t) => t?.id === track?.id);
                if (idx >= 0) setCurrentIndex(idx);
              }
              broadcastState(true, track);
            });
          });

          widget.bind(window.SC.Widget.Events.PAUSE, () => {
            setIsPlaying(false);
            broadcastState(false, currentTrack);
          });

          widget.bind(window.SC.Widget.Events.FINISH, () => {
            setIsPlaying(false);
            broadcastState(false, currentTrack);
          });
        } catch (e) {
          console.error('SC Widget Error:', e);
        }
      }
    };

    const broadcastState = (playing: boolean, track: any) => {
      window.dispatchEvent(new CustomEvent('forge-audio-state', { 
        detail: { isPlaying: playing, track, hasStarted: true } 
      }));
    };

    if (!window.SC) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.onload = loadWidget;
      document.body.appendChild(script);
    } else {
      loadWidget();
    }

    // Interval to keep sidebar synced
    const interval = setInterval(() => {
      if (hasStarted) broadcastState(isPlaying, currentTrack);
    }, 2000);

    return () => {
      window.removeEventListener('forge-toggle-music', handleToggleModal);
      window.removeEventListener('forge-play-music', handlePlay);
      window.removeEventListener('forge-pause-music', handlePause);
      window.removeEventListener('forge-toggle-play', handleToggle);
      window.removeEventListener('forge-skip-music', handleSkip);
      window.removeEventListener('forge-prev-music', handlePrev);
      clearInterval(interval);
    };
  }, [isModalOpen, currentTrack, isPlaying, hasStarted]);

  const togglePlay = () => widgetRef.current?.toggle();
  const skipNext = () => {
    if (!widgetRef.current) return;
    const list = playlistTracksRef.current.length ? playlistTracksRef.current : playlistTracks;
    if (!list.length) {
      widgetRef.current.next();
      return;
    }
    const nextIndex = (currentIndex + 1) % list.length;
    setCurrentIndex(nextIndex);
    widgetRef.current.load(playlistUrl, { auto_play: true, start_track: nextIndex });
  };
  const skipPrev = () => {
    if (!widgetRef.current) return;
    const list = playlistTracksRef.current.length ? playlistTracksRef.current : playlistTracks;
    if (!list.length) {
      widgetRef.current.prev();
      return;
    }
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    setCurrentIndex(prevIndex);
    widgetRef.current.load(playlistUrl, { auto_play: true, start_track: prevIndex });
  };

  return (
    <>
      {/* 
          DAS MODAL-GEHÄUSE (TEUFLISCH & GLOBAL)
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
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] via-orange-600 to-amber-900 rounded-[2.5rem] opacity-20 group-hover:opacity-40 blur-xl transition duration-1000 animate-pulse"></div>
            <div className="relative bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
              
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
              
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]/60 rounded-tl-[2.5rem] pointer-events-none" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]/60 rounded-tr-[2.5rem] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]/60 rounded-bl-[2.5rem] pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]/60 rounded-br-[2.5rem] pointer-events-none" />

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
                  <X className="w-5 h-5 relative z-10"/>
                </button>
              </div>

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
                      src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/2180406137&color=%23ffb800&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={skipPrev}
                    className="w-12 h-12 rounded-full border border-white/15 bg-white/[0.08] hover:bg-white/15 text-white hover:text-white transition-all flex items-center justify-center"
                    aria-label="Vorheriger Track"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={skipNext}
                    className="w-12 h-12 rounded-full border border-white/15 bg-white/[0.08] hover:bg-white/15 text-white hover:text-white transition-all flex items-center justify-center"
                    aria-label="Nächster Track"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
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

      {/* DIE DEZENTE STEUERUNG (PILLE) - NUR FALLBACK FALLS SIDEBAR NICHT DA IST */}
      <AnimatePresence>
        {hasStarted && !isModalOpen && pathname === '/dashboard' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-24 right-4 z-[100] pointer-events-auto lg:hidden"
          >
            {/* ... (Mobile Pill remains as fallback) */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
