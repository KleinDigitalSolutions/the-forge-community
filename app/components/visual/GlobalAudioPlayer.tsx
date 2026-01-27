'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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

    const isModalOpenRef = useRef(isModalOpen);
    const isPlayingRef = useRef(isPlaying);
    const currentTrackRef = useRef(currentTrack);
    const hasStartedRef = useRef(hasStarted);

    // Sync refs with state
    useEffect(() => { isModalOpenRef.current = isModalOpen; }, [isModalOpen]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
    useEffect(() => { hasStartedRef.current = hasStarted; }, [hasStarted]);

    // Initialisierung und Event-Listener (Nur einmal!)
    useEffect(() => {
    // Restore state from localStorage
    const saved = localStorage.getItem('forge-audio-started');
    if (saved === 'true') {
        setHasStarted(true);
        hasStartedRef.current = true;
    }

    const handleToggleModal = (e: any) => {
      setIsModalOpen(e.detail?.open ?? !isModalOpenRef.current);
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

    const broadcastState = (playing: boolean, track: any) => {
      window.dispatchEvent(new CustomEvent('forge-audio-state', { 
        detail: { isPlaying: playing, track, hasStarted: true } 
      }));
    };

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
            hasStartedRef.current = true;
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
            broadcastState(false, currentTrackRef.current);
          });

          widget.bind(window.SC.Widget.Events.FINISH, () => {
            setIsPlaying(false);
            broadcastState(false, currentTrackRef.current);
          });
        } catch (e) {
          console.error('SC Widget Error:', e);
        }
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

    // Interval to keep sidebar synced
    const interval = setInterval(() => {
      if (hasStartedRef.current) broadcastState(isPlayingRef.current, currentTrackRef.current);
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
  }, []); // Empty dependency array -> Runs once on mount

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
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(480px,92vw)] transition-transform duration-500 ${
            isModalOpen ? 'translate-y-0 scale-100 pointer-events-auto' : 'translate-y-12 scale-95 pointer-events-none'
          }`}
        >
          <div className="relative">
            <div className="relative bg-black/35 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }} 
                className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white/50 hover:text-white z-10"
                aria-label="Player schließen"
              >
                <X className="w-4 h-4"/>
              </button>

              <div className="p-3 sm:p-4">
                <div className="relative rounded-xl overflow-hidden bg-black/30 border border-white/10">
                  <div className="p-2 sm:p-3 flex items-center justify-center">
                    <iframe 
                      ref={iframeRef}
                      width="100%" 
                      scrolling="no" 
                      frameBorder="no" 
                      allow="autoplay" 
                      className="rounded-lg w-full h-[140px] sm:h-[166px]"
                      src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/2180406137&color=%23ffb800&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={skipPrev}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/15 bg-white/[0.08] hover:bg-white/15 text-white transition-all flex items-center justify-center"
                    aria-label="Vorheriger Track"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={skipNext}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-white/15 bg-white/[0.08] hover:bg-white/15 text-white transition-all flex items-center justify-center"
                    aria-label="Nächster Track"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
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
