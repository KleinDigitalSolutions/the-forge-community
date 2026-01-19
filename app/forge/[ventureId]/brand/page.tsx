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
      console.error('Failed to fetch Brand DNA:', error);
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
        alert('Brand DNA saved!');
      } else {
        alert('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save Brand DNA:', error);
      alert('Error saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-4xl font-instrument-serif text-white">
              Brand DNA
            </h1>
          </div>
          <p className="text-white/60">
            Define your brand identity for AI-powered content generation
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Core Identity */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Core Identity</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Brand Name *
          </label>
          <input
            type="text"
            value={data.brandName}
            onChange={(e) => setData({ ...data, brandName: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., EcoWear"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={data.tagline}
            onChange={(e) => setData({ ...data, tagline: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., Sustainable Fashion for Everyone"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Mission (Why do you exist?)
          </label>
          <textarea
            value={data.mission}
            onChange={(e) => setData({ ...data, mission: e.target.value })}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="e.g., Make sustainable fashion accessible and affordable"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Vision (Where are you going?)
          </label>
          <textarea
            value={data.vision}
            onChange={(e) => setData({ ...data, vision: e.target.value })}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="e.g., Become the leading sustainable fashion brand in Europe"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Brand Values (comma separated)
          </label>
          <input
            type="text"
            value={data.values.join(', ')}
            onChange={(e) =>
              setData({ ...data, values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., Sustainability, Quality, Transparency"
          />
        </div>
      </section>

      {/* Voice & Tone */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Voice & Tone</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Tone of Voice
          </label>
          <select
            value={data.toneOfVoice}
            onChange={(e) => setData({ ...data, toneOfVoice: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
          >
            <option value="">Select...</option>
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Friendly">Friendly</option>
            <option value="Edgy">Edgy</option>
            <option value="Playful">Playful</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Personality Traits (comma separated)
          </label>
          <input
            type="text"
            value={data.personality.join(', ')}
            onChange={(e) =>
              setData({ ...data, personality: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., Bold, Authentic, Caring"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Writing Style
          </label>
          <input
            type="text"
            value={data.writingStyle}
            onChange={(e) => setData({ ...data, writingStyle: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., Short & punchy, Detailed & informative"
          />
        </div>
      </section>

      {/* Target Audience */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Target Audience</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
              Age Range
            </label>
            <input
              type="text"
              value={data.targetAudience.age}
              onChange={(e) =>
                setData({ ...data, targetAudience: { ...data.targetAudience, age: e.target.value } })
              }
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
              placeholder="e.g., 25-40"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
              Location
            </label>
            <input
              type="text"
              value={data.targetAudience.location}
              onChange={(e) =>
                setData({ ...data, targetAudience: { ...data.targetAudience, location: e.target.value } })
              }
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
              placeholder="e.g., EU, DACH, Global"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Customer Persona
          </label>
          <textarea
            value={data.customerPersona}
            onChange={(e) => setData({ ...data, customerPersona: e.target.value })}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="Describe your ideal customer..."
          />
        </div>
      </section>

      {/* Product/Service */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">Product/Service</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Category
          </label>
          <input
            type="text"
            value={data.productCategory}
            onChange={(e) => setData({ ...data, productCategory: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., Fashion, Food, SaaS"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Key Features (comma separated)
          </label>
          <input
            type="text"
            value={data.keyFeatures.join(', ')}
            onChange={(e) =>
              setData({ ...data, keyFeatures: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })
            }
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            placeholder="e.g., Organic, Handmade, Sustainable"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            USP (Unique Selling Proposition)
          </label>
          <textarea
            value={data.usp}
            onChange={(e) => setData({ ...data, usp: e.target.value })}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="What makes you unique?"
          />
        </div>
      </section>

      {/* AI Context */}
      <section className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
        <h2 className="text-xl font-instrument-serif text-white">AI Context</h2>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
            Special Instructions for AI
          </label>
          <textarea
            value={data.aiContext}
            onChange={(e) => setData({ ...data, aiContext: e.target.value })}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            placeholder="e.g., Always mention sustainability, avoid fast fashion comparisons"
          />
          <p className="text-xs text-white/40 mt-2">
            These instructions will be used by AI when generating content for your brand
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
          {saving ? 'Saving...' : 'Save Brand DNA'}
        </button>
      </div>
    </div>
  );
}
