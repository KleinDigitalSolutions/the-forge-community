'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StudioShell } from '@/app/components/forge/StudioShell';
import { AIGenerator } from '@/app/components/forge/AIGenerator';
import { DocumentExport } from '@/app/components/forge/DocumentExport';
import { Megaphone, Share2, LayoutTemplate, Mail } from 'lucide-react';
import type { BrandDNA } from '@prisma/client';

const CONTENT_TYPES = [
  { id: 'instagram', name: 'Instagram Post', icon: <Share2 className="w-4 h-4" /> },
  { id: 'linkedin', name: 'LinkedIn Beitrag', icon: <Share2 className="w-4 h-4" /> },
  { id: 'twitter', name: 'X / Twitter Thread', icon: <Share2 className="w-4 h-4" /> },
  { id: 'blog', name: 'Blog Artikel', icon: <LayoutTemplate className="w-4 h-4" /> },
  { id: 'email', name: 'Newsletter / E-Mail', icon: <Mail className="w-4 h-4" /> },
  { id: 'ad_google', name: 'Google Ad', icon: <Megaphone className="w-4 h-4" /> },
  { id: 'ad_meta', name: 'Meta (FB/Insta) Ad', icon: <Megaphone className="w-4 h-4" /> },
];

export default function MarketingPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;

  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Generation State
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].id);
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  // Load Brand DNA
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/brand-dna`);
        if (res.ok) {
          const data = await res.json();
          setBrandDNA(data);
        }
      } catch (err) {
        console.error('Failed to load Brand DNA', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrand();
  }, [ventureId]);

  const handleGenerate = async () => {
    if (!topic) {
      alert('Bitte gib ein Thema an.');
      return '';
    }

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/marketing/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          topic,
          additionalInstructions: instructions
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedContent(data.content);
        return data.content;
      } else {
        alert('Fehler: ' + data.error);
        return '';
      }
    } catch (error) {
      console.error('Generation failed', error);
      alert('Ein Fehler ist aufgetreten.');
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="text-white p-8">Lade Studio...</div>;

  return (
    <StudioShell
      title="Marketing Studio"
      description="Erstelle Social Media Posts, Ads und Emails mit deiner Brand DNA"
      icon={<Megaphone className="w-6 h-6 text-[#D4AF37]" />}
      brandDNA={brandDNA}
      aiProvider="gemini"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Configuration */}
        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6">
          <h2 className="text-xl font-instrument-serif text-white">Kampagnen-Details</h2>

          {/* Content Type Selector */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
              Format wählen
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-all ${
                    contentType === type.id
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div className={contentType === type.id ? 'text-[#D4AF37]' : ''}>
                    {type.icon}
                  </div>
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
              Thema / Anlass *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Produktlaunch der neuen Sommer-Kollektion"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
              Zusätzliche Anweisungen
            </label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="z.B. Nutze viele Emojis, Fokus auf Nachhaltigkeit..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] focus:ring-0 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <AIGenerator
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generatedContent={generatedContent}
            brandContext={brandDNA ? {
              brandName: brandDNA.brandName,
              toneOfVoice: brandDNA.toneOfVoice || undefined
            } : undefined}
            buttonText="Content Generieren"
            placeholder="Wähle ein Format und Thema, um passenden Content zu erstellen..."
          />

          {generatedContent && (
            <div className="flex justify-end">
               <DocumentExport 
                 content={generatedContent} 
                 filename={`marketing-${contentType}-${new Date().toISOString().split('T')[0]}`} 
                 format="txt"
               />
            </div>
          )}
        </div>
      </div>
    </StudioShell>
  );
}