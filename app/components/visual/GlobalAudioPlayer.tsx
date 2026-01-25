'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Music, X, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    SC: any;
  }
}

export default function GlobalAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  // SoundCloud Widget initialisieren
  useEffect(() => {
    const handleStartMusic = () => {
      if (widgetRef.current) {
        widgetRef.current.play();
        setIsVisible(true);
      }
    };

    window.addEventListener('forge-start-music', handleStartMusic);

    const loadWidget = () => {
      if (iframeRef.current && window.SC) {
        const widget = window.SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        widget.bind(window.SC.Widget.Events.READY, () => {
          widget.getCurrentSound((track: any) => {
            setCurrentTrack(track);
          });
        });

        widget.bind(window.SC.Widget.Events.PLAY, () => {
          setIsPlaying(true);
          setIsVisible(true);
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

    return () => window.removeEventListener('forge-start-music', handleStartMusic);
  }, []);

  const togglePlay = () => {
    if (widgetRef.current) {
      widgetRef.current.toggle();
    }
  };

  const skipTrack = () => {
    if (widgetRef.current) {
      widgetRef.current.next();
    }
  };

  if (!isVisible) return (
    <div className="hidden">
      <iframe
        ref={iframeRef}
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2233330283&color=%23ffb800&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false"
      />
    </div>
  );

  return (
    <>
      {/* Hidden Iframe for Audio Source */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0">
        <iframe
          ref={iframeRef}
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2233330283&color=%23ffb800&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false"
        />
      </div>

      {/* Persistent UI Controls - DEZENT & FORGE STYLE */}
      <div className="fixed bottom-24 right-4 lg:top-6 lg:right-8 lg:bottom-auto z-[100] pointer-events-auto">
        <motion.div 
          layout
          className="bg-black/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-2 group"
        >
          {/* Track Info (Expandable) */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden whitespace-nowrap px-3 flex flex-col justify-center"
              >
                <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">
                  Audio System
                </span>
                <span className="text-[10px] text-white/70 font-medium max-w-[120px] truncate">
                  {currentTrack?.title || 'Notre Dame @ Paranormal'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
            <button 
              onClick={togglePlay}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#D4AF37] text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <button 
              onClick={skipTrack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Info / Volume Icon */}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-[#D4AF37] transition-all"
          >
            {isMinimized ? <Volume2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </motion.div>
      </div>
    </>
  );
}
