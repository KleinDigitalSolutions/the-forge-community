'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  Users, 
  Layout, 
  User as UserIcon,
  MessageCircle,
  MessageSquare,
  X,
  Zap,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useUnreadMessages } from '@/app/hooks/useUnreadMessages';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const parallaxRafRef = useRef<number | null>(null);
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });
  const [orbitSize, setOrbitSize] = useState(720);
  const [orbitRadius, setOrbitRadius] = useState(220);
  const { unreadCount } = useUnreadMessages();

  const accent = '#D4AF37';
  const menuItems = [
    { icon: Rocket, label: 'Ventures', action: () => onToggleView('ventures'), color: accent, angle: 270 },
    { icon: Users, label: 'Squads', href: '/squads', color: accent, angle: 321 },
    { icon: Layout, label: 'Academy', href: '/resources', color: accent, angle: 12 },
    { icon: UserIcon, label: 'Profile', href: '/profile', color: accent, angle: 63 },
    { icon: MessageCircle, label: 'Messages', href: '/messages', color: accent, angle: 114, badgeCount: unreadCount },
    { icon: MessageSquare, label: 'Forum', href: '/forum', color: accent, angle: 165 },
    { icon: Zap, label: 'Missions', action: () => onToggleView('missions'), color: accent, angle: 216 },
  ];

  useEffect(() => {
    const update = () => {
      const size = containerRef.current?.offsetWidth || 720;
      setOrbitSize(size);
      setOrbitRadius(Math.max(150, Math.min(240, Math.round(size * 0.32))));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const layer = parallaxRef.current;
    if (!container || !layer) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const maxOffset = 18;

    const animate = () => {
      const { x, y } = parallaxCurrent.current;
      const target = parallaxTarget.current;
      const nextX = x + (target.x - x) * 0.08;
      const nextY = y + (target.y - y) * 0.08;

      parallaxCurrent.current = { x: nextX, y: nextY };
      layer.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;

      if (Math.abs(target.x - nextX) > 0.1 || Math.abs(target.y - nextY) > 0.1) {
        parallaxRafRef.current = requestAnimationFrame(animate);
      } else {
        parallaxRafRef.current = null;
      }
    };

    const handleMove = (event: MouseEvent | PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      parallaxTarget.current = {
        x: relX * maxOffset,
        y: relY * maxOffset,
      };
      if (parallaxRafRef.current === null) {
        parallaxRafRef.current = requestAnimationFrame(animate);
      }
    };

    const handleLeave = () => {
      parallaxTarget.current = { x: 0, y: 0 };
      if (parallaxRafRef.current === null) {
        parallaxRafRef.current = requestAnimationFrame(animate);
      }
    };

    layer.style.willChange = 'transform';
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    container.addEventListener('pointermove', handleMove);
    container.addEventListener('pointerleave', handleLeave);

    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
      container.removeEventListener('pointermove', handleMove);
      container.removeEventListener('pointerleave', handleLeave);
      if (parallaxRafRef.current !== null) {
        cancelAnimationFrame(parallaxRafRef.current);
        parallaxRafRef.current = null;
      }
    };
  }, []);

  const displayName = userName?.trim().split(' ')[0] || 'Operator';
  const initials = userName
    ? userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
    : 'OP';

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-[min(720px,90vw)] h-[min(720px,90vw)]">
      
      {/* --- BACKGROUND AMBIENCE (Deep Glow) --- */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
         <div className={`transition-all duration-1000 absolute w-[300px] h-[300px] bg-[#D4AF37]/6 blur-[100px] rounded-full ${isOpen ? 'scale-150 opacity-40' : 'scale-100 opacity-20'}`} />
         
         {/* Rotating Tech Rings (Subtle) */}
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute w-[min(640px,80vw)] h-[min(640px,80vw)] rounded-full border border-white/5 opacity-30"
         />
      </div>

      {/* --- CONNECTOR LINES LAYER (Behind everything) --- */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10"
        viewBox={`0 0 ${orbitSize} ${orbitSize}`}
      >
        <AnimatePresence>
          {isOpen && menuItems.map((item, index) => {
            const radian = (item.angle * Math.PI) / 180;
            const cx = orbitSize / 2;
            const cy = orbitSize / 2;
            
            // Start under the main button
            const startX = cx; 
            const startY = cy;
            
            // End under the satellite button
            const endX = cx + Math.cos(radian) * orbitRadius;
            const endY = cy + Math.sin(radian) * orbitRadius;

            return (
              <motion.g key={`line-${index}`}>
                <motion.circle cx={endX} cy={endY} r="3" fill={item.color} opacity="0.25" />
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* --- CENTRAL CONTROL --- */}
      <div className="relative z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="relative w-32 h-32 flex items-center justify-center group outline-none cursor-pointer"
        >
          {/* Main Sphere */}
          <div className="absolute inset-0 rounded-full bg-[#0b0c0f] border border-white/10 shadow-2xl overflow-hidden group-hover:border-[#D4AF37]/40 transition-colors duration-500">
             {/* Shine Effect */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
             {/* Inner Rings */}
             <div className="absolute inset-3 rounded-full border border-white/5 bg-gradient-to-br from-white/5 to-transparent" />
             <div className={`absolute inset-0 bg-white/5 blur-xl transition-opacity duration-500 ${isOpen ? 'opacity-80' : 'opacity-30'}`} />
          </div>

          {/* Icon */}
          <div className="relative z-10 flex flex-col items-center gap-1.5 text-center translate-y-2">
            {isOpen ? (
               <div className="flex flex-col items-center gap-1.5">
                 <X className="w-8 h-8 text-[#D4AF37]" />
                 <span className="text-[10px] leading-none font-mono uppercase tracking-[0.3em] text-white/40">Close</span>
               </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-[#D4AF37]/5 overflow-hidden">
                  {userImage ? (
                    <img src={userImage} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-[#D4AF37]">{initials}</span>
                  )}
                </div>
                <div className="text-[10px] leading-none font-mono text-white/70 tracking-widest uppercase">
                  {displayName}
                </div>
              </>
            )}
          </div>
          
          {/* Orbit Ring Animation */}
          <div className="absolute inset-[-8px] rounded-full border border-white/5 border-t-[#D4AF37]/50 animate-spin-slow pointer-events-none" />
        </motion.button>
      </div>

      {/* --- SATELLITES --- */}
      <AnimatePresence>
        {isOpen && menuItems.map((item, index) => {
          const radian = (item.angle * Math.PI) / 180;
          const x = Math.cos(radian) * orbitRadius;
          const y = Math.sin(radian) * orbitRadius;

          return (
            <div
              key={item.label}
              className="absolute left-1/2 top-1/2 z-40 pointer-events-auto"
              style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25, 
                  delay: index * 0.05 
                }}
              >
                {item.href ? (
                  <Link href={item.href} className="group block text-center">
                    <SatelliteContent item={item} />
                  </Link>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); item.action?.(); setIsOpen(false); }} className="group block text-center">
                    <SatelliteContent item={item} />
                  </button>
                )}
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function SatelliteContent({ item }: { item: any }) {
  const badge = Number(item.badgeCount || 0);
  const badgeText = badge > 99 ? '99+' : String(badge);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Icon Circle */}
      <div 
        className="relative w-16 h-16 rounded-2xl bg-[#0b0c0f] border border-white/10 flex items-center justify-center shadow-[0_0_24px_rgba(0,0,0,0.6)] transition-all duration-300 group-hover:scale-110 group-hover:border-[#D4AF37]/60 group-hover:shadow-[0_0_40px_rgba(212,175,55,0.25)]"
      >
        <item.icon className="w-6 h-6 text-white/70 transition-colors group-hover:text-white" />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#D4AF37] text-[9px] font-bold text-black flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.4)]">
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-white/50">
        <span>{item.label}</span>
        <ChevronRight className="w-3 h-3 text-[#D4AF37]/80" />
      </div>
    </div>
  );
}
