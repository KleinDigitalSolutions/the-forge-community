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
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { useUnreadMessages } from '@/app/hooks/useUnreadMessages';
import { CoreSpinLoader } from '@/components/ui/core-spin-loader';

interface CockpitControlProps {
  userImage?: string | null;
  userName?: string;
  stats: {
    ventures: number;
    tasks: number;
  };
  onToggleView: (view: string) => void;
  minimal?: boolean;
}

export default function CockpitControl({ userImage, userName, stats, onToggleView, minimal = false }: CockpitControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const parallaxRafRef = useRef<number | null>(null);
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const parallaxCurrent = useRef({ x: 0, y: 0 });
  const [orbitSize, setOrbitSize] = useState(720);
  const [orbitRadius, setOrbitRadius] = useState(220);
  const { unreadCount } = useUnreadMessages(30000, { enableSound: true });

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
    if (minimal) return;
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

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-[min(720px,90vw)] h-[min(720px,90vw)]">
      
      {/* --- BACKGROUND AMBIENCE (Deep Glow) --- */}
      {!minimal && (
        <div
          ref={parallaxRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        >
          <div className={`transition-all duration-1000 absolute w-[300px] h-[300px] bg-cyan-400/10 rounded-full ${isOpen ? 'scale-150 opacity-40' : 'scale-100 opacity-20'}`} />
          
          {/* Rotating Tech Rings (Subtle) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute w-[min(640px,80vw)] h-[min(640px,80vw)] rounded-full border border-white/5 opacity-30"
          />
        </div>
      )}

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
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 z-[-1] pointer-events-none"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="absolute inset-[-20px] rounded-full border-2 border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className="absolute inset-[-10px] rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/20"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="relative w-32 h-32 flex items-center justify-center group outline-none cursor-pointer"
          aria-label={`${isOpen ? 'Close' : 'Open'} cockpit for ${displayName}`}
        >
          <CoreSpinLoader
            size={96}
            showText={false}
            disableBlur
            variant="forge"
            className="pointer-events-none"
          />
          
          {/* Orbit Ring Animation */}
          {!minimal && (
            <div className="absolute inset-[-8px] rounded-full border border-white/5 border-t-cyan-300/60 animate-spin-slow pointer-events-none" />
          )}
        </motion.button>

        {!isOpen && (
          <>
            {/* Top Arrow pointing down */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 bottom-full mb-6 -translate-x-1/2 pointer-events-none select-none z-50"
            >
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              >
                <ChevronDown className="w-10 h-10" />
              </motion.div>
            </motion.div>

            {/* Bottom Arrow pointing up */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 top-full mt-6 -translate-x-1/2 pointer-events-none select-none z-50"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[#D4AF37] drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]"
              >
                <ChevronUp className="w-10 h-10" />
              </motion.div>
            </motion.div>
          </>
        )}
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
