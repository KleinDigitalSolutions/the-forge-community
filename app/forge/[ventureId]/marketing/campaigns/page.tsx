'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StudioShell } from '@/app/components/forge/StudioShell';
import { CampaignCard } from '@/app/components/marketing/CampaignCard';
import { AddCampaignModal } from '@/app/components/marketing/AddCampaignModal';
import { TrendingUp, Plus, BarChart3, Clock, Calendar } from 'lucide-react';

export default function CampaignsPage() {
  const params = useParams();
  const ventureId = params.ventureId as string;

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/marketing/campaigns`);
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [ventureId]);

  // Calculated Stats
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalPosts = campaigns.reduce((acc, c) => acc + (c._count?.posts || 0), 0);
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budgetAmount || 0), 0);

  return (
    <StudioShell
      title="Kampagnen-Manager"
      description="Plane und verwalte deine Marketing-Initiativen."
      icon={<TrendingUp className="w-6 h-6 text-[#D4AF37]" />}
    >
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Aktive Kampagnen</p>
              <p className="text-2xl font-instrument-serif text-white">{activeCampaigns}</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Geplante Posts</p>
              <p className="text-2xl font-instrument-serif text-white">{totalPosts}</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Gesamtbudget</p>
              <p className="text-2xl font-instrument-serif text-white">€{totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-instrument-serif text-white">Alle Kampagnen</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Neue Kampagne
            </button>
          </div>

          {loading ? (
             <div className="flex items-center justify-center h-64 text-white/40">
                <Clock className="w-6 h-6 animate-spin mr-2" />
                Lade Kampagnen...
             </div>
          ) : campaigns.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl border border-white/10 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-xl font-instrument-serif text-white">Keine Kampagnen gefunden</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                Starte deine erste Marketing-Kampagne, um Posts zu planen und Ziele zu verfolgen.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Jetzt starten
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  ventureId={ventureId}
                  name={campaign.name}
                  status={campaign.status}
                  postsCount={campaign._count?.posts || 0}
                  budget={campaign.budgetAmount}
                  startDate={campaign.startDate}
                  endDate={campaign.endDate}
                  goal={campaign.goal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddCampaignModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCampaigns}
        ventureId={ventureId}
      />
    </StudioShell>
  );
}
