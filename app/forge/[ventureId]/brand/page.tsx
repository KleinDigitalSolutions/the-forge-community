'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Sparkles } from 'lucide-react';

interface BrandDNA {
  id?: string;
  brandName: string;
  tagline: string;
  mission: string;
  vision: string;
  values: string[];
  toneOfVoice: string;
  personality: string[];
  writingStyle: string;
  targetAudience: {
    age: string;
    gender: string;
    location: string;
    interests: string[];
  };
  customerPersona: string;
  primaryColor: string;
  secondaryColors: string[];
  logoUrl: string;
  fontFamily: string;
  productCategory: string;
  keyFeatures: string[];
  usp: string;
  competitors: Array<{ name: string; url: string; strengths: string[] }>;
  aiContext: string;
  doNotMention: string[];
}

export default function BrandDNAPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BrandDNA>({
    brandName: '',
    tagline: '',
    mission: '',
    vision: '',
    values: [],
    toneOfVoice: '',
    personality: [],
    writingStyle: '',
    targetAudience: { age: '', gender: 'all', location: '', interests: [] },
    customerPersona: '',
    primaryColor: '#D4AF37',
    secondaryColors: [],
    logoUrl: '',
    fontFamily: 'Inter, sans-serif',
    productCategory: '',
    keyFeatures: [],
    usp: '',
    competitors: [],
    aiContext: '',
    doNotMention: [],
  });

  useEffect(() => {
    fetchBrandDNA();
  }, []);

  const fetchBrandDNA = async () => {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/brand-dna`);
      if (res.ok) {
        const brandDNA = await res.json();
        if (brandDNA) {
          setData(brandDNA);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Marken-DNA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/brand-dna`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert('Marken-DNA gespeichert!');
      } else {
        alert('Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Marken-DNA:', error);
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white">Laden...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-4xl font-instrument-serif text-white">
              Marken-DNA
            </h1>
          </div>
          <p className="text-white/60">
            Definiere deine Markenidentität für KI-gestützte Inhaltserstellung
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
      </div>

      {/* Core Identity */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Kernidentität</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Markenname *
          </label>
          <input
            type="text"
            value={data.brandName}
            onChange={(e) => setData({ ...data, brandName: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. EcoWear"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Slogan
          </label>
          <input
            type="text"
            value={data.tagline}
            onChange={(e) => setData({ ...data, tagline: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. Nachhaltige Mode für Alle"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Mission (Warum existiert ihr?)
          </label>
          <textarea
            value={data.mission}
            onChange={(e) => setData({ ...data, mission: e.target.value })}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="z.B. Nachhaltige Mode zugänglich und erschwinglich machen"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Vision (Wo wollt ihr hin?)
          </label>
          <textarea
            value={data.vision}
            onChange={(e) => setData({ ...data, vision: e.target.value })}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="z.B. Die führende nachhaltige Modemarke in Europa werden"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Markenwerte (kommagetrennt)
          </label>
          <input
            type="text"
            value={data.values.join(', ')}
            onChange={(e) =>
              setData({ ...data, values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. Nachhaltigkeit, Qualität, Transparenz"
          />
        </div>
      </section>

      {/* Voice & Tone */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Stimme & Ton</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Tonfall
          </label>
          <select
            value={data.toneOfVoice}
            onChange={(e) => setData({ ...data, toneOfVoice: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
          >
            <option value="">Auswählen...</option>
            <option value="Professional">Professionell</option>
            <option value="Casual">Locker</option>
            <option value="Friendly">Freundlich</option>
            <option value="Edgy">Kantig/Provokant</option>
            <option value="Playful">Verspielt</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Persönlichkeitsmerkmale (kommagetrennt)
          </label>
          <input
            type="text"
            value={data.personality.join(', ')}
            onChange={(e) =>
              setData({ ...data, personality: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. Mutig, Authentisch, Fürsorglich"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Schreibstil
          </label>
          <input
            type="text"
            value={data.writingStyle}
            onChange={(e) => setData({ ...data, writingStyle: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. Kurz & bündig, Detailliert & informativ"
          />
        </div>
      </section>

      {/* Target Audience */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Zielgruppe</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
              Altersgruppe
            </label>
            <input
              type="text"
              value={data.targetAudience.age}
              onChange={(e) =>
                setData({ ...data, targetAudience: { ...data.targetAudience, age: e.target.value } })
              }
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
              placeholder="z.B. 25-40"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
              Standort
            </label>
            <input
              type="text"
              value={data.targetAudience.location}
              onChange={(e) =>
                setData({ ...data, targetAudience: { ...data.targetAudience, location: e.target.value } })
              }
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
              placeholder="z.B. EU, DACH, Global"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Kunden-Persona
          </label>
          <textarea
            value={data.customerPersona}
            onChange={(e) => setData({ ...data, customerPersona: e.target.value })}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="Beschreibe deinen idealen Kunden..."
          />
        </div>
      </section>

      {/* Product/Service */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Produkt/Dienstleistung</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Kategorie
          </label>
          <input
            type="text"
            value={data.productCategory}
            onChange={(e) => setData({ ...data, productCategory: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. Mode, Essen, SaaS"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Hauptmerkmale (kommagetrennt)
          </label>
          <input
            type="text"
            value={data.keyFeatures.join(', ')}
            onChange={(e) =>
              setData({ ...data, keyFeatures: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="z.B. Bio, Handgemacht, Nachhaltig"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            USP (Alleinstellungsmerkmal)
          </label>
          <textarea
            value={data.usp}
            onChange={(e) => setData({ ...data, usp: e.target.value })}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="Was macht euch einzigartig?"
          />
        </div>
      </section>

      {/* AI Context */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">KI-Kontext</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Spezielle Anweisungen für die KI
          </label>
          <textarea
            value={data.aiContext}
            onChange={(e) => setData({ ...data, aiContext: e.target.value })}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="z.B. Erwähne immer Nachhaltigkeit, vermeide Vergleiche mit Fast Fashion"
          />
          <p className="text-xs text-white/40 mt-2">
            Diese Anweisungen werden von der KI bei der Erstellung von Inhalten für deine Marke verwendet
          </p>
        </div>
      </section>

      {/* Save Button (sticky) */}
      <div className="sticky bottom-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-8 py-4 rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all shadow-2xl"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Speichern...' : 'Marken-DNA speichern'}
        </button>
      </div>
    </div>
  );
}