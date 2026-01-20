'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, User, Rocket, Zap, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingWizardProps {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  onComplete: () => void;
}

export default function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => setStep(prev => prev + 1);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update user profile and set onboardingComplete = true
      const res = await fetch('/api/me/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          onboardingComplete: true
        })
      });

      if (res.ok) {
        onComplete();
        router.refresh();
      }
    } catch (err) {
      console.error('Onboarding failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0B0C0E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-[#D4AF37]" 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12 min-h-[500px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-8"
              >
                <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h2 className="text-4xl font-instrument-serif text-white">Willkommen in der Forge.</h2>
                <p className="text-lg text-white/50 max-w-md mx-auto">
                  Du bist jetzt Teil eines elitären Netzwerks. Hier bauen wir keine Spielzeuge, sondern skalierbare Assets.
                </p>
                <button 
                  onClick={handleNext}
                  className="px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#FFD700] transition-colors"
                >
                  System Initialisieren
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h3 className="text-3xl font-instrument-serif text-white mb-2">Identität Bestätigen</h3>
                  <p className="text-white/50">Wie sollen wir dich im Netzwerk nennen?</p>
                </div>

                <div className="max-w-sm mx-auto space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/40 font-bold mb-2">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:border-[#D4AF37] outline-none transition-colors"
                        placeholder="Dein Name"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button 
                    onClick={handleNext}
                    disabled={!name.trim()}
                    className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-instrument-serif text-white mb-2">Dein Arsenal</h3>
                  <p className="text-white/50">Du hast Zugriff auf Enterprise-Grade Tools.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <Shield className="w-8 h-8 text-blue-400 mb-4" />
                    <h4 className="text-white font-bold mb-2">Admin Shield</h4>
                    <p className="text-xs text-white/50">Automatisierte Verträge & Rechtssicherheit.</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <Zap className="w-8 h-8 text-[#D4AF37] mb-4" />
                    <h4 className="text-white font-bold mb-2">Orion AI</h4>
                    <p className="text-xs text-white/50">Dein 24/7 Co-Founder für Strategie & Ops.</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <Rocket className="w-8 h-8 text-purple-400 mb-4" />
                    <h4 className="text-white font-bold mb-2">Launch Pad</h4>
                    <p className="text-xs text-white/50">Deployment & Skalierungsinfrastruktur.</p>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button 
                    onClick={handleNext}
                    className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
                  >
                    Alles Klar
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                  <Check className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-4xl font-instrument-serif text-white">Ready to Forge.</h2>
                <p className="text-lg text-white/50 max-w-md mx-auto">
                  Dein Dashboard ist bereit. Starte deine erste Mission oder schließe dich einem Squad an.
                </p>
                <button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#FFD700] transition-colors w-full md:w-auto"
                >
                  {loading ? 'Lade Dashboard...' : 'Zum Dashboard'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
