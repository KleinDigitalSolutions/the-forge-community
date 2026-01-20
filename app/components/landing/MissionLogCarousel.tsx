'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Zap, Target, Package, Globe, Truck, DollarSign, Lightbulb, ShoppingBag } from 'lucide-react';

const PROJECTS = [
  {
    id: 'smartstore',
    title: 'SmartStore',
    subtitle: 'Fulfillment & 3PL',
    description: 'Ein Nischen-Logistik Provider für High-Value Goods. Wir schließen die Lücke zwischen Garage-Shipping und Enterprise-Logistik.',
    metrics: [
      { label: 'Ziel MRR (6 Mo)', value: '€12k' },
      { label: 'EBITDA Marge', value: '35%' },
    ],
    roadmap: [
      { step: '01', title: 'Gründung', status: 'ABGESCHLOSSEN' },
      { step: '02', title: 'Rechtliches & Banking', status: 'IN BEARBEITUNG' },
      { step: '03', title: 'Tech Stack Setup', status: 'WARTESCHLANGE' },
      { step: '04', title: 'Kunden-Onboarding', status: 'WARTESCHLANGE' }
    ],
    color: 'text-[var(--accent)]',
    bg: 'bg-[var(--accent)]',
    icon: Truck
  },
  {
    id: 'crunchlabs',
    title: 'CRUNCH LABS',
    subtitle: 'Food / E-Commerce',
    description: 'Gefriergetrocknete Früchte & Snacks als Premium-Subscription. Inspiriert von Buah/KoRo, aber mit Fokus auf Creator-Economy.',
    metrics: [
      { label: 'Marge (D2C)', value: '65%' },
      { label: 'AOV (Warenkorb)', value: '€45' },
    ],
    roadmap: [
      { step: '01', title: 'Produkt-Sourcing', status: 'IN BEARBEITUNG' },
      { step: '02', title: 'Branding & Design', status: 'ABGESCHLOSSEN' },
      { step: '03', title: 'Shopify Setup', status: 'WARTESCHLANGE' },
      { step: '04', title: 'Influencer Launch', status: 'WARTESCHLANGE' }
    ],
    color: 'text-orange-400',
    bg: 'bg-orange-500',
    icon: ShoppingBag
  },
  {
    id: 'lumiere',
    title: 'LUMIÈRE',
    subtitle: 'D2C / Brand',
    description: 'Ästhetische LED-Ambiente Beleuchtung. High-End Private Labeling mit Fokus auf TikTok-Viralität und Home-Office Trends.',
    metrics: [
      { label: 'ROI (Ad Spend)', value: '4.5x' },
      { label: 'Time-to-Market', value: '30d' },
    ],
    roadmap: [
      { step: '01', title: 'Sample Order', status: 'ABGESCHLOSSEN' },
      { step: '02', title: 'Content Production', status: 'IN BEARBEITUNG' },
      { step: '03', title: 'Ads Testing', status: 'WARTESCHLANGE' },
      { step: '04', title: 'Scale Phase', status: 'WARTESCHLANGE' }
    ],
    color: 'text-purple-400',
    bg: 'bg-purple-500',
    icon: Lightbulb
  }
];

export default function MissionLogCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextProject = () => {
    setActiveIndex((prev) => (prev + 1) % PROJECTS.length);
  };

  const prevProject = () => {
    setActiveIndex((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
  };

  const activeProject = PROJECTS[activeIndex];
  const Icon = activeProject.icon;

  return (
    <div className="relative w-full">
      {/* Dynamic Brand Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10">
        <div className={`absolute inset-0 opacity-20 blur-[120px] rounded-full transition-colors duration-1000 ${activeProject.bg}`} />
      </div>

      {/* Centered Navigation Controls */}
      <div className="flex justify-center items-center gap-4 md:gap-8 mb-8 md:mb-16">
        <button 
          onClick={prevProject}
          className="p-3 md:p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white/40 group-hover:text-white" />
        </button>
        
        <div className="flex gap-2">
          {PROJECTS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 transition-all duration-500 rounded-full ${
                i === activeIndex ? `w-6 md:w-8 ${activeProject.bg}` : 'w-2 bg-white/10'
              }`} 
            />
          ))}
        </div>

        <button 
          onClick={nextProject}
          className="p-3 md:p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
        >
          <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-white/40 group-hover:text-white" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* Left Content (Text) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProject.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="relative z-10 text-center lg:text-left"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-black ${activeProject.color} uppercase tracking-[0.3em] md:tracking-[0.4em] mb-6 md:mb-10`}>
              <span className={`w-2 h-2 rounded-full ${activeProject.bg} animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
              MISSION LOG: {activeProject.id.toUpperCase()}
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-instrument-serif text-white mb-2 md:mb-4 leading-[0.9] tracking-tighter">
              {activeProject.title}
            </h2>
            <p className={`text-xl md:text-2xl font-instrument-serif italic ${activeProject.color} mb-6 md:mb-10`}>
              {activeProject.subtitle}
            </p>
            
            <p className="text-base md:text-xl text-white/50 mb-8 md:mb-14 leading-relaxed max-w-xl mx-auto lg:mx-0 h-auto lg:h-28">
              {activeProject.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              {activeProject.metrics.map((metric, i) => (
                <div key={i} className="p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 bg-white/[0.03] backdrop-blur-md group hover:border-white/20 transition-all duration-500 relative overflow-hidden text-left">
                  <div className={`absolute top-0 left-0 w-1 h-full ${activeProject.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className={`text-2xl md:text-4xl font-instrument-serif text-white mb-2 group-hover:${activeProject.color} transition-colors`}>
                    {metric.value}
                  </div>
                  <div className="text-[9px] md:text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Right Content (Visual/Roadmap) */}
        <div className="relative mt-8 lg:mt-0">
          {/* Intense Brand Backdrop Glow */}
          <div className={`absolute -inset-10 md:-inset-20 ${activeProject.bg} opacity-10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none transition-all duration-1000`} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProject.id}
              initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateY: 20 }}
              transition={{ duration: 0.6, ease: "backOut" }}
              style={{ perspective: 1000 }}
              className="relative glass-card border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
              
              <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-white/10 pb-6 md:pb-8 relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 ${activeProject.color} shadow-inner`}>
                    <Icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-white/20">Operational</div>
                    <div className="text-xs md:text-sm font-bold text-white/60">Roadmap v2.4</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${activeProject.bg} shadow-[0_0_15px_rgba(255,255,255,0.2)]`}/>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-white/5 border border-white/10"/>
                </div>
              </div>

              <div className="space-y-6 md:space-y-10 relative z-10">
                {activeProject.roadmap.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 md:gap-8 group/item">
                      <div className="font-mono text-[10px] md:text-xs text-white/10 group-hover/item:text-[var(--accent)] transition-colors w-6">{item.step}</div>
                      <div className="flex-1 font-instrument-serif text-lg md:text-2xl text-white/90 group-hover/item:translate-x-2 transition-transform duration-500">{item.title}</div>
                      <div className={`text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.3em] px-3 md:px-4 py-1.5 rounded-full border transition-all duration-500 ${
                        item.status === 'ABGESCHLOSSEN' ? `border-green-500/20 bg-green-500/10 text-green-400` :
                        item.status === 'IN BEARBEITUNG' ? `border-yellow-500/20 bg-yellow-500/10 text-yellow-400` :
                        'border-white/5 text-white/10'
                      }`}>
                        {item.status === 'IN BEARBEITUNG' ? 'LAUFEND' : item.status}
                      </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
