'use client';

import { motion } from 'framer-motion';

export default function HolographicGrid() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#020204]">
      
      {/* 1. Layer: Statischer Nebel-Hintergrund (Atmosphäre) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050505] to-black opacity-80" />
      
      {/* 2. Layer: Funkelnde Sterne (CSS Animation) */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        opacity: 0.1,
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
        backgroundSize: '120px 120px',
        opacity: 0.05,
        animation: 'pulse 4s infinite'
      }} />

      {/* 3. Layer: Horizont-Linie & Glow */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent z-10 opacity-30 blur-[1px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[100vh] bg-[#D4AF37]/5 blur-[100px] pointer-events-none" />

      {/* 4. Layer: Bewegtes 3D Gitter */}
      <div className="absolute top-0 left-0 w-full h-[50%] overflow-hidden" style={{ perspective: '800px' }}>
        <motion.div 
          initial={{ rotateX: -60, y: '20%' }}
          animate={{ backgroundPosition: ['0px 40px', '0px 0px'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-100%] opacity-20"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(212,175,55,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,175,55,0.2) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[50%] overflow-hidden" style={{ perspective: '800px' }}>
        <motion.div 
          initial={{ rotateX: 60, y: '-20%' }}
          animate={{ backgroundPosition: ['0px 0px', '0px 80px'] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-100%] opacity-30"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(to top, rgba(212,175,55,0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            transformOrigin: 'top',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 20%, transparent 90%)',
          }}
        />
      </div>
    </div>
  );
}