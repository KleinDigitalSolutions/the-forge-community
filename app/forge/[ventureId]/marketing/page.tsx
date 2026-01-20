'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudioShell } from '@/app/components/forge/StudioShell';
import { AIGenerator } from '@/app/components/forge/AIGenerator';
import { DocumentExport } from '@/app/components/forge/DocumentExport';
import { Megaphone, Share2, LayoutTemplate, Mail, TrendingUp } from 'lucide-react';
import type { BrandDNA } from '@prisma/client';
import { useAIContext } from '@/app/context/AIContext';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const ventureId = params.ventureId as string;
  const campaignId = searchParams.get('campaignId');
  const { setContext } = useAIContext();

  const [brandDNA, setBrandDNA] = useState<BrandDNA | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Generation State
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].id);
  const [topic, setTopic] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  useEffect(() => {
    setContext('Marketing Studio - Content Generator. Hilf beim Erstellen von Posts, Ads und Emails.');
  }, []);

  // Load Brand DNA and Campaign (if present)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandRes, campaignRes] = await Promise.all([
          fetch(`/api/ventures/${ventureId}/brand-dna`),
          campaignId ? fetch(`/api/ventures/${ventureId}/marketing/campaigns/${campaignId}`) : Promise.resolve(null)
        ]);

        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrandDNA(data);
        }

        if (campaignRes && campaignRes.ok) {
          const campaignData = await campaignRes.json();
          setActiveCampaign(campaignData);
          setTopic(campaignData.name + (campaignData.goal ? ` - Ziel: ${campaignData.goal}` : '')); // Pre-fill topic
        }
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ventureId, campaignId]);

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
        
        // If coming from a campaign, auto-save as draft post
        if (campaignId) {
          await saveToCampaign(data.content);
        }

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

  const saveToCampaign = async (content: string) => {
    try {
      await fetch(`/api/ventures/${ventureId}/marketing/campaigns/${campaignId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          content: content,
          contentType: contentType,
          status: 'DRAFT'
        })
      });
      // Optional: Notify user
    } catch (err) {
      console.error('Failed to save to campaign', err);
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
      headerAction={
        <Link 
          href={`/forge/${ventureId}/marketing/campaigns`}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <TrendingUp className="w-4 h-4" />
          Kampagnen Manager
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Configuration */}
        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-instrument-serif text-white">Content Konfiguration</h2>
             {activeCampaign && (
                <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded border border-[#D4AF37]/30">
                   Teil von: {activeCampaign.name}
                </span>
             )}
          </div>

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