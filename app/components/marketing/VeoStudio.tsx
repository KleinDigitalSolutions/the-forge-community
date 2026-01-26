'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  User, 
  Package, 
  Palette, 
  Wand2, 
  Play, 
  Download, 
  Loader2, 
  Zap, 
  X,
  Plus
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';
import LightPillar from '@/app/components/visual/LightPillar';
import { VideoPreview } from '@/app/components/media/VideoPreview';

interface VeoStudioProps {
  ventureId: string;
  brandDNA?: any;
}

export function VeoStudio({ ventureId, brandDNA }: VeoStudioProps) {
  const [identityImage, setIdentityImage] = useState<string | null>(null);
  const [objectImage, setObjectImage] = useState<string | null>(null);
  const [styleDesc, setStyleDesc] = useState(brandDNA?.toneOfVoice || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [activePulse, setActivePulse] = useState<number | null>(null);

  // SVG Refs for animated paths
  const videoRef = useRef<HTMLDivElement>(null);
  const input1Ref = useRef<HTMLDivElement>(null);
  const input2Ref = useRef<HTMLDivElement>(null);
  const input3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle pulse animation every few seconds
    const interval = setInterval(() => {
      setActivePulse((prev) => (prev === null ? 0 : (prev + 1) % 3));
      setTimeout(() => setActivePulse(null), 2000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (!identityImage || !objectImage) {
      alert('Bitte lade Identität und Objekt hoch.');
      return;
    }
    setIsGenerating(true);
    // Simulate generation for now - in reality this would call the Veo API
    setTimeout(() => {
      setGeneratedVideo('/Veo/veo_make_person_and_scene_in_video.mp4');
      setIsGenerating(false);
    }, 4000);
  };

  return (
    <div className="relative min-h-[800px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0B]">
      {/* 3. Kinematische Beleuchtung: Light Pillars & Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.08),_transparent_70%)]" />
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#5227FF]/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#D4AF37]/10 blur-[120px] rounded-full" />
        
        <LightPillar 
          className="absolute top-0 left-1/4 opacity-30" 
          topColor="#D4AF37" 
          bottomColor="transparent" 
          intensity={0.5} 
          pillarWidth={1.5}
        />
        <LightPillar 
          className="absolute bottom-0 right-1/4 opacity-30" 
          topColor="transparent" 
          bottomColor="#8B5CF6" 
          intensity={0.5} 
          pillarWidth={1.5}
        />
      </div>

      <div className="relative z-10 p-8 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 items-center h-full">
        {/* Left Side: Inputs */}
        <div className="space-y-6">
          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-instrument-serif text-white">VEO 3.1 Studio</h2>
            <p className="text-sm text-white/40 uppercase tracking-[0.2em] font-bold">Drei Funken, ein Feuer.</p>
          </div>

          <div className="space-y-4">
            {/* Input 1: Identity */}
            <div 
              ref={input1Ref}
              className={`group relative glass-card p-4 rounded-2xl border border-white/10 transition-all hover:border-[#D4AF37]/40 ${identityImage ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20' : ''}`}
            >
              <BorderBeam size={100} duration={8} colorFrom="#D4AF37" colorTo="transparent" />
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${identityImage ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5'}`}>
                  {identityImage ? <img src={identityImage} className="w-full h-full object-cover rounded-lg" /> : <User className="w-5 h-5 text-white/40" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">Identität</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Foto von dir oder deinem Model</p>
                </div>
                <label className="cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                  <input type="file" className="hidden" onChange={(e) => {
                    if (e.target.files?.[0]) setIdentityImage(URL.createObjectURL(e.target.files[0]));
                  }} />
                </label>
              </div>
            </div>

            {/* Input 2: Object */}
            <div 
              ref={input2Ref}
              className={`group relative glass-card p-4 rounded-2xl border border-white/10 transition-all hover:border-[#D4AF37]/40 ${objectImage ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20' : ''}`}
            >
              <BorderBeam size={100} duration={8} delay={2} colorFrom="#D4AF37" colorTo="transparent" />
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${objectImage ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/5'}`}>
                   {objectImage ? <img src={objectImage} className="w-full h-full object-cover rounded-lg" /> : <Package className="w-5 h-5 text-white/40" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">Objekt</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Dein Produkt-Shot</p>
                </div>
                <label className="cursor-pointer p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                  <input type="file" className="hidden" onChange={(e) => {
                    if (e.target.files?.[0]) setObjectImage(URL.createObjectURL(e.target.files[0]));
                  }} />
                </label>
              </div>
            </div>

            {/* Input 3: Style */}
            <div 
              ref={input3Ref}
              className="group relative glass-card p-4 rounded-2xl border border-white/10 transition-all hover:border-[#D4AF37]/40"
            >
              <BorderBeam size={100} duration={8} delay={4} colorFrom="#D4AF37" colorTo="transparent" />
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center border border-white/10 bg-white/5">
                  <Palette className="w-5 h-5 text-white/40" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">Stil</h3>
                  <input 
                    type="text" 
                    value={styleDesc}
                    onChange={(e) => setStyleDesc(e.target.value)}
                    placeholder="Minimalistisch, Neon, Cineastisch..."
                    className="w-full bg-transparent border-none p-0 text-xs text-white/60 focus:ring-0 placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !identityImage || !objectImage}
            className="w-full mt-8 relative group overflow-hidden rounded-2xl bg-[#D4AF37] p-4 text-black font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="relative z-10 flex items-center justify-center gap-2">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              VEO Sequenz generieren
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
          </button>
        </div>

        {/* Right Side: Video Preview & Visual Flow */}
        <div className="relative h-full flex flex-col justify-center">
          {/* 2. Die "Alchemie-Verbindung": Visual Flow */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
             <defs>
               <linearGradient id="pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
                 <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                 <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
               </linearGradient>
             </defs>
             {/* Paths would be dynamic based on refs in a real implementation, simplified here */}
             <path d="M -100 200 Q 0 200 150 350" stroke="rgba(212,175,55,0.1)" strokeWidth="1" fill="none" />
             <path d="M -100 350 L 150 350" stroke="rgba(212,175,55,0.1)" strokeWidth="1" fill="none" />
             <path d="M -100 500 Q 0 500 150 350" stroke="rgba(212,175,55,0.1)" strokeWidth="1" fill="none" />
             
             {/* Pulse Animations */}
             {activePulse === 0 && <circle r="3" fill="#D4AF37" className="animate-[pulse-path_2s_ease-in-out_infinite]">
                <animateMotion path="M -100 200 Q 0 200 150 350" dur="2s" repeatCount="indefinite" />
             </circle>}
             {activePulse === 1 && <circle r="3" fill="#D4AF37" className="animate-[pulse-path_2s_ease-in-out_infinite]">
                <animateMotion path="M -100 350 L 150 350" dur="2s" repeatCount="indefinite" />
             </circle>}
             {activePulse === 2 && <circle r="3" fill="#D4AF37" className="animate-[pulse-path_2s_ease-in-out_infinite]">
                <animateMotion path="M -100 500 Q 0 500 150 350" dur="2s" repeatCount="indefinite" />
             </circle>}
          </svg>

          <div 
            ref={videoRef}
            className={`relative aspect-[9/16] w-full max-w-[400px] mx-auto rounded-3xl border border-white/10 bg-black overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.1)] transition-all duration-700 ${isGenerating ? 'scale-[1.02] border-[#D4AF37]/50 shadow-[0_0_100px_rgba(212,175,55,0.2)]' : ''}`}
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
            
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#D4AF37]/5 backdrop-blur-sm">
                 <div className="relative">
                   <div className="absolute inset-0 blur-xl bg-[#D4AF37] opacity-20 animate-pulse" />
                   <Sparkles className="w-12 h-12 text-[#D4AF37] animate-bounce" />
                 </div>
                 <div className="text-center space-y-2">
                   <div className="text-sm font-black text-white uppercase tracking-[0.3em]">Alchemie aktiv</div>
                   <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">VEO 3.1 verarbeitet die Funken...</div>
                 </div>
              </div>
            ) : generatedVideo ? (
              <VideoPreview 
                src={generatedVideo}
                className="w-full h-full"
                mediaClassName="w-full h-full object-cover"
                enableHover={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <Play className="w-6 h-6 text-white/20" />
                </div>
                <h4 className="text-white/60 font-bold text-sm mb-2">Bereit für die Schmiede</h4>
                <p className="text-xs text-white/30">Lade oben die Komponenten hoch, um deine VEO-Sequenz zu starten.</p>
              </div>
            )}

            {generatedVideo && !isGenerating && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                <button className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Save
                </button>
                <button 
                  onClick={() => setGeneratedVideo(null)}
                  className="px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <X className="w-3 h-3" />
                  Discard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-path {
          0% { filter: drop-shadow(0 0 0px #D4AF37); opacity: 0; }
          50% { filter: drop-shadow(0 0 5px #D4AF37); opacity: 1; }
          100% { filter: drop-shadow(0 0 0px #D4AF37); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
