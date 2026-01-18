'use client';

import { useState, useEffect } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { User, MapPin, Briefcase, Target, Phone, Instagram, Linkedin, Save, CheckCircle, Shield, Rocket, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const skillOptions = ['Tech', 'Marketing', 'Sales', 'Operations', 'Finance', 'Legal', 'Creative', 'E-Commerce'];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birthday: '',
    address_street: '',
    address_city: '',
    address_zip: '',
    address_country: 'Germany',
    instagram: '',
    linkedin: '',
    bio: '',
    skills: [] as string[],
    goal: ''
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadProfile();
  }, []);

  const handleToggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/me/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10">
        <div className="w-12 h-12 border-2 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">Lade Dossier...</p>
      </div>
    </div>
  );

  return (
    <AuthGuard>
      <PageShell>
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <header className="mb-16 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-6">
              <Shield className="w-3 h-3" />
              Operative Identität
            </div>
            <h1 className="text-5xl md:text-6xl font-instrument-serif text-white tracking-tight mb-4">Founder Dossier</h1>
            <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">Vervollständige dein Dossier für das Netzwerk.</p>
          </header>

          <div className="grid gap-12">
            
            {/* PERSONAL INFO */}
            <section className="glass-card rounded-3xl border border-white/10 overflow-hidden relative group transition-all duration-700 hover:border-white/20">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <User className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h2 className="text-xl font-instrument-serif text-white uppercase tracking-wider">Persönliche Angaben</h2>
              </div>
              <div className="p-10 grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Vollständiger Name</label>
                  <input 
                    type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Geburtsdatum</label>
                  <input 
                    type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all appearance-none"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Telefonnummer (Signal/WA)</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-4 w-4 h-4 text-white/20" />
                    <input 
                      type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+49 123 456789"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-14 pr-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* EXPERTISE */}
            <section className="glass-card rounded-3xl border border-white/10 overflow-hidden relative group transition-all duration-700 hover:border-white/20">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <Zap className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h2 className="text-xl font-instrument-serif text-white uppercase tracking-wider">Expertise & Matching</h2>
              </div>
              <div className="p-10 space-y-10 relative z-10">
                <div className="space-y-6">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Was sind deine Kernkompetenzen?</label>
                  <div className="flex flex-wrap gap-3">
                    {skillOptions.map(skill => (
                      <button
                        key={skill} onClick={() => handleToggleSkill(skill)}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${
                          formData.skills.includes(skill) 
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Operative Bio</label>
                  <textarea 
                    value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Erzähl den anderen Foundern kurz, wer du bist..."
                    className="w-full min-h-[150px] bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all resize-none placeholder:text-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Primäres Ziel</label>
                  <div className="relative">
                    <Target className="absolute left-6 top-4 w-4 h-4 text-white/20" />
                    <input 
                      type="text" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})}
                      placeholder="z.B. Aufbau einer hochprofitablen Brand"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-14 pr-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ADDRESS */}
            <section className="glass-card rounded-3xl border border-white/10 overflow-hidden relative group transition-all duration-700 hover:border-white/20">
              <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center gap-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <h2 className="text-xl font-instrument-serif text-white uppercase tracking-wider">Logistische Daten (Anschrift)</h2>
              </div>
              <div className="p-10 space-y-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Straße & Hausnummer</label>
                  <input 
                    type="text" value={formData.address_street} onChange={e => setFormData({...formData, address_street: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">PLZ</label>
                    <input 
                      type="text" value={formData.address_zip} onChange={e => setFormData({...formData, address_zip: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">Stadt</label>
                    <input 
                      type="text" value={formData.address_city} onChange={e => setFormData({...formData, address_city: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 text-sm text-white focus:border-[var(--accent)] focus:ring-0 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SAVE BUTTON */}
            <div className="flex flex-col items-center gap-6 mt-16 pb-24">
              <button 
                onClick={handleSave} disabled={saving}
                className="btn-shimmer group relative bg-white text-black px-16 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center gap-4 active:scale-95 disabled:opacity-30 hover:bg-[var(--accent)]"
              >
                {saving ? 'Synchronisiere...' : <><Save className="w-4 h-4" /> Dossier aktualisieren</>}
              </button>
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase tracking-[0.2em]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Daten erfolgreich im System gesichert
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </PageShell>
    </AuthGuard>
  );
}