'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  ArrowLeft,
  Layout,
  MessageCircle,
  MessageSquare,
  Music,
  Rocket,
  ShieldCheck,
  Target,
  Users
} from 'lucide-react';
import { completeCockpitTour } from '@/app/actions/user';

interface CockpitTourProps {
  initialHasSeenTour: boolean;
  isNavOpen: boolean;
  onNavOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface Step {
  id: string;
  title: string;
  content: string;
  anchor: string;
  position: 'right' | 'left' | 'top' | 'bottom';
  icon: any;
}

const STEPS: Step[] = [
  {
    id: 'open-nav',
    title: 'Navigation öffnen',
    content: 'Öffne jetzt deinen Orbital-Navigator, damit wir alle Module im Cockpit erklären können.',
    anchor: 'cockpit-core',
    position: 'bottom',
    icon: ShieldCheck
  },
  {
    id: 'ventures',
    title: 'Ventures',
    content: 'Hier findest du deine aktiven Ventures, ihren Fortschritt und den direkten Einstieg ins Forge-Cockpit.',
    anchor: 'cockpit-menu-ventures',
    position: 'bottom',
    icon: Rocket
  },
  {
    id: 'squads',
    title: 'Squads',
    content: 'Teamräume, Partner und interne Strukturen. Erstelle Squads oder tritt bestehenden Einheiten bei.',
    anchor: 'cockpit-menu-squads',
    position: 'left',
    icon: Users
  },
  {
    id: 'music',
    title: 'Music',
    content: 'Steuere den Soundtrack der Forge. Fokus-Mode, Atmosphäre und Session-Flow auf Knopfdruck.',
    anchor: 'cockpit-menu-music',
    position: 'left',
    icon: Music
  },
  {
    id: 'academy',
    title: 'Academy',
    content: 'Playbooks, Frameworks und Ressourcen. Hier findest du Wissen, Templates und operative Guides.',
    anchor: 'cockpit-menu-academy',
    position: 'left',
    icon: Layout
  },
  {
    id: 'profile',
    title: 'Profile',
    content: 'Deine Identität im Netzwerk: Profil, Bio, Skills, Reputation und Founder-Daten.',
    anchor: 'cockpit-menu-profile',
    position: 'top',
    icon: ShieldCheck
  },
  {
    id: 'messages',
    title: 'Messages',
    content: 'Direkte Kommunikation mit Foundern, Squads und Partnern. Alle DMs laufen hier zusammen.',
    anchor: 'cockpit-menu-messages',
    position: 'right',
    icon: MessageCircle
  },
  {
    id: 'forum',
    title: 'Forum',
    content: 'Community-Threads, Diskussionen, Feedback und Wissenstransfer. Poste, vote und kommentiere.',
    anchor: 'cockpit-menu-forum',
    position: 'right',
    icon: MessageSquare
  },
  {
    id: 'missions',
    title: 'Missions',
    content: 'Mission Control: Tasks, Ziele und Deadlines. Alles Operative läuft über diese Missionen.',
    anchor: 'cockpit-menu-missions',
    position: 'right',
    icon: Target
  }
];

export function CockpitTour({ initialHasSeenTour, isNavOpen, onNavOpenChange, onComplete }: CockpitTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [anchorFound, setAnchorFound] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!initialHasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [initialHasSeenTour]);

  useEffect(() => {
    if (!isVisible || currentStep === 0) return;
    if (!isNavOpen) onNavOpenChange(true);
  }, [currentStep, isNavOpen, isVisible, onNavOpenChange]);

  const updateCoords = useCallback(() => {
    const step = STEPS[currentStep];
    const element = document.querySelector(`[data-tour="${step.anchor}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
      setAnchorFound(true);
    } else {
      setCoords({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: 0,
        height: 0
      });
      setAnchorFound(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isVisible) return;
    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible, updateCoords]);

  const handleNext = async () => {
    if (currentStep === 0 && !isNavOpen) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsVisible(false);
      await completeCockpitTour();
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isVisible || !mounted) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const canProceed = currentStep > 0 || isNavOpen;

  const getTooltipStyle = () => {
    const margin = 24;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    if (isMobile || !anchorFound) {
      return { bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90vw' };
    }

    if (step.position === 'right') {
      return { top: coords.top + coords.height / 2, left: coords.left + coords.width + margin, transform: 'translateY(-50%)' };
    }
    if (step.position === 'left') {
      return { top: coords.top + coords.height / 2, left: coords.left - margin, transform: 'translate(-100%, -50%)' };
    }
    if (step.position === 'top') {
      return { top: coords.top - margin, left: coords.left + coords.width / 2, transform: 'translate(-50%, -100%)' };
    }
    return { top: coords.top + coords.height + margin, left: coords.left + coords.width / 2, transform: 'translateX(-50%)' };
  };

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] pointer-events-none">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px] pointer-events-auto" />

      {anchorFound && (
        <motion.div
          animate={{ boxShadow: ['0 0 0 2px rgba(212,175,55,0.2)', '0 0 0 8px rgba(212,175,55,0.4)', '0 0 0 2px rgba(212,175,55,0.2)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute rounded-2xl border-2 border-[#D4AF37]"
          style={{
            top: coords.top - 12,
            left: coords.left - 12,
            width: coords.width + 24,
            height: coords.height + 24
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        key={currentStep}
        className="absolute w-[360px] bg-[#0F1113] border border-white/10 rounded-[2rem] p-7 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] pointer-events-auto"
        style={getTooltipStyle()}
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Step {currentStep + 1} / {STEPS.length}</p>
            <h3 className="text-lg font-bold text-white tracking-tight">{step.title}</h3>
          </div>
        </div>

        <p className="text-sm text-white/60 leading-relaxed mb-6">
          {step.content}
        </p>

        {currentStep === 0 && (
          <div className="mb-5">
            <button
              onClick={() => onNavOpenChange(true)}
              className="w-full px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors"
            >
              Navigation öffnen
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-white/30 hover:text-white'}`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Zurück
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
              canProceed ? 'bg-[#D4AF37] hover:bg-[#F0C05A] text-black shadow-2xl shadow-[#D4AF37]/20' : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            {currentStep === STEPS.length - 1 ? 'Tour abschließen' : 'Nächster Schritt'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
