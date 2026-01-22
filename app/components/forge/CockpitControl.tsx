'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Users, 
  Layout, 
  User as UserIcon, 
  X,
  Zap,
  Cpu
} from 'lucide-react';
import Link from 'next/link';

interface CockpitControlProps {
  userImage?: string | null;
  userName?: string;
  stats: {
    ventures: number;
    tasks: number;
  };
  onToggleView: (view: string) => void;
}

export default function CockpitControl({ userImage, userName, stats, onToggleView }: CockpitControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Menü-Konfiguration
  const menuItems = [
    { icon: Rocket, label: 'Ventures', action: () => onToggleView('ventures'), color: '#D4AF37', angle: 270 }, // Oben
    { icon: Users, label: 'Squads', href: '/squads', color: '#38bdf8', angle: 330 },
    { icon: Layout, label: 'Resources', href: '/resources', color: '#34d399', angle: 30 },
    { icon: UserIcon, label: 'Profile', href: '/profile', color: '#a78bfa', angle: 90 }, // Rechts
    { icon: Zap, label: 'Missions', action: () => onToggleView('missions'), color: '#f87171', angle: 210 }, // Links unten
  ];

  const radius = 170; // Etwas größerer Radius für mehr Platz

  return (
    // FIX: Removed pointer-events-none from container to prevent unexpected blocking behavior in some contexts.
    // We rely on z-index stack.
    <div className="relative flex items-center justify-center w-[600px] h-[600px]">
      
      {/* --- BACKGROUND HUD ELEMENTS (Decorative) --- */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none select-none">
         {/* Großer äußerer Ring */}
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="w-[500px] h-[500px] rounded-full border border-white/10 border-dashed"
         />
         {/* Innerer Tech Ring */}
         <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute w-[400px] h-[400px] rounded-full border border-[#D4AF37]/20 opacity-50"
            style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
         />
         {/* Scanner Effekt */}
         <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-[300px] h-[300px] rounded-full bg-[#D4AF37]/5 blur-xl"
         />
      </div>

      {/* --- CENTRAL INTERACTION POINT --- */}
      <div className="relative z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent bubbling issues
            setIsOpen(!isOpen);
          }}
          className="relative w-36 h-36 rounded-full flex items-center justify-center group outline-none cursor-pointer"
        >
          {/* Glass Button Base */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-full border border-white/20 shadow-[0_0_50px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_80px_rgba(212,175,55,0.4)] group-hover:border-[#D4AF37]/50 transition-all duration-500" />
          
          {/* Spinning Ring on Hover */}
          <div className="absolute inset-[-6px] rounded-full border-2 border-transparent border-t-[#D4AF37] border-b-[#D4AF37] opacity-0 group-hover:opacity-100 animate-spin-slow transition-opacity duration-700 pointer-events-none" />

          {/* Inner Content */}
          <div className="relative flex flex-col items-center justify-center text-center z-10 pointer-events-none">
            {isOpen ? (
               <X className="w-10 h-10 text-[#D4AF37]" />
            ) : (
              <>
                <Cpu className="w-8 h-8 text-[#D4AF37] mb-2 opacity-90" />
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/90">Forge</span>
                <span className="text-[8px] uppercase tracking-widest text-[#D4AF37] mt-1">System</span>
              </>
            )}
          </div>
        </motion.button>
      </div>

      {/* --- SATELLITES (MENU ITEMS) --- */}
      {/* Container ist z-40 (unter Button z-50), aber pointer-events-auto für die Buttons */}
      <AnimatePresence>
        {isOpen && menuItems.map((item, index) => {
          const radian = (item.angle * Math.PI) / 180;
          const x = Math.cos(radian) * radius;
          const y = Math.sin(radian) * radius;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={{ opacity: 1, x, y, scale: 1 }}
              exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              transition={{ delay: index * 0.04, type: "spring", stiffness: 250, damping: 20 }}
              className="absolute z-50" 
            >
              <div className="relative group">
                {/* Connector Line Animation */}
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none -z-10 overflow-visible">
                   <motion.line 
                      x1="200" y1="200" 
                      x2={200 - (Math.cos(radian) * radius)} 
                      y2={200 - (Math.sin(radian) * radius)} 
                      stroke={item.color} 
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.2 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                   />
                </svg>

                {item.href ? (
                  <Link href={item.href} className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-[#050505] border border-white/20 flex items-center justify-center hover:border-white/60 hover:bg-white/10 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110">
                      <item.icon className="w-7 h-7 transition-colors" style={{ color: item.color }} />
                    </div>
                    <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-0 -translate-y-2 pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/90 px-3 py-1.5 rounded border border-white/10 whitespace-nowrap shadow-xl">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <button onClick={() => { item.action?.(); setIsOpen(false); }} className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-[#050505] border border-white/20 flex items-center justify-center hover:border-white/60 hover:bg-white/10 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-110">
                      <item.icon className="w-7 h-7 transition-colors" style={{ color: item.color }} />
                    </div>
                    <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-0 -translate-y-2 pointer-events-none">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-black/90 px-3 py-1.5 rounded border border-white/10 whitespace-nowrap shadow-xl">
                        {item.label}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
