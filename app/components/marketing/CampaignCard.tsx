'use client';

import Link from 'next/link';
import { Calendar, Target, TrendingUp, ArrowRight, FileText } from 'lucide-react';

interface CampaignCardProps {
  id: string;
  ventureId: string;
  name: string;
  status: string;
  postsCount: number;
  budget?: number | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  goal?: string | null;
}

export function CampaignCard({ id, ventureId, name, status, postsCount, budget, startDate, endDate, goal }: CampaignCardProps) {
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'COMPLETED': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'PAUSED': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-white/60 border-white/10 bg-white/5';
    }
  };

  return (
    <Link href={`/forge/${ventureId}/marketing/campaigns/${id}`}>
      <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#D4AF37]/50 transition-all group h-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(status)}`}>
                {status}
              </span>
              {goal && (
                <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1">
                  <Target className="w-3 h-3" /> {goal}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-instrument-serif text-white group-hover:text-[#D4AF37] transition-colors line-clamp-2">
              {name}
            </h3>
            
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                {postsCount} Posts
              </div>
              {budget && (
                <div className="flex items-center gap-2">
                  <span className="text-white/40">Budget:</span>
                  €{budget.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar className="w-3 h-3" />
            {startDate ? new Date(startDate).toLocaleDateString() : 'TBD'} 
            {' - '}
            {endDate ? new Date(endDate).toLocaleDateString() : 'TBD'}
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}
