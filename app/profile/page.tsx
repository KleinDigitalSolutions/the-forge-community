'use client';

import { useState, useEffect } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { User, MapPin, Briefcase, Target, Phone, Instagram, Linkedin, Save, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
          // Merge die Daten (einige kommen aus Postgres, andere aus Notion)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Lade Profil...</div>;

  return (
    <AuthGuard>
      <PageShell>
        
        <div className="max-w-4xl mx-auto px-4 pt-32">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 mb-2">Founder Profil</h1>
            <p className="text-gray-500 font-medium">Vervollständige dein Dossier für die Forge Community.</p>
          </div>

          <div className="grid gap-8">
            
            {/* PERSONAL INFO */}
            <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-900">Persönliche Angaben</h2>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vollständiger Name</label>
                  <input 
                    type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Geburtsdatum</label>
                  <input 
                    type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefonnummer (Signal/WA)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ADDRESS */}
            <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-gray-900">Anschrift</h2>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Straße & Hausnummer</label>
                  <input 
                    type="text" value={formData.address_street} onChange={e => setFormData({...formData, address_street: e.target.value})}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PLZ</label>
                    <input 
                      type="text" value={formData.address_zip} onChange={e => setFormData({...formData, address_zip: e.target.value})}
                      className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stadt</label>
                    <input 
                      type="text" value={formData.address_city} onChange={e => setFormData({...formData, address_city: e.target.value})}
                      className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* EXPERTISE & SQUADS */}
            <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-gray-900">Expertise & Squad-Matching</h2>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Was sind deine Kernkompetenzen?</label>
                  <div className="flex flex-wrap gap-3">
                    {skillOptions.map(skill => (
                      <button
                        key={skill} onClick={() => handleToggleSkill(skill)}
                        className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${
                          formData.skills.includes(skill) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Über dich (Bio)</label>
                  <textarea 
                    value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
                    placeholder="Erzähl den anderen Foundern kurz, wer du bist..."
                    className="w-full min-h-[120px] bg-gray-50 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dein Ziel bei The Forge</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})}
                      placeholder="z.B. Gemeinsam einen SmartStore skalieren"
                      className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SOCIALS */}
            <section className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-500" />
                <h2 className="font-bold text-gray-900">Vernetzung</h2>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instagram Handle</label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})}
                      placeholder="@nutzername"
                      className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LinkedIn URL</label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})}
                      placeholder="linkedin.com/in/..."
                      className="w-full bg-gray-50 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SAVE BUTTON */}
            <div className="flex flex-col items-center gap-4 mt-10">
              <button 
                onClick={handleSave} disabled={saving}
                className="group relative bg-gray-900 hover:bg-black text-white px-12 py-4 rounded-full font-black text-sm transition-all shadow-2xl flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Speichert...' : <><Save className="w-4 h-4" /> Dossier aktualisieren</>}
                {success && <CheckCircle className="absolute -right-12 text-teal-500 w-8 h-8 animate-bounce" />}
              </button>
              {success && <p className="text-teal-600 font-bold text-xs">Deine Daten wurden sicher gespeichert!</p>}
            </div>

                    </div>

                  </div>

                </PageShell>

              </AuthGuard>

            );

          }

          