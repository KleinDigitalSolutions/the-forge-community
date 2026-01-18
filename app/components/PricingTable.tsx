'use client';

import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanType = 'starter' | 'growth' | 'premium';

interface PricingTableProps {
  onSelectPlan: (plan: PlanType) => void;
  isLoading: boolean;
}

export function PricingTable({ onSelectPlan, isLoading }: PricingTableProps) {
  const plans = [
    {
      id: 'starter' as PlanType,
      name: 'Starter',
      subtitle: 'Low-Friction Entry',
      price: '69',
      features: [
        { text: '15% Rohertrag Share', highlight: true },
        { text: 'Zugang zur Community', highlight: false },
        { text: 'Basic Support', highlight: false },
      ],
      cta: 'Choose Starter',
      featured: false,
    },
    {
      id: 'growth' as PlanType,
      name: 'Growth',
      subtitle: 'Order-Based Scale',
      price: '99',
      features: [
        { text: '10% Rohertrag Share', highlight: true },
        { text: '2€ pro Order Gebühr', highlight: false },
        { text: 'Full Community Access', highlight: false },
        { text: 'Priority Support', highlight: false },
      ],
      cta: 'Choose Growth',
      featured: false,
    },
    {
      id: 'premium' as PlanType,
      name: 'Premium',
      subtitle: 'High Volume Pro',
      price: '149',
      features: [
        { text: '5% Rohertrag Share', highlight: true },
        { text: 'Keine Order-Gebühr', highlight: false },
        { text: 'Voting Power x2', highlight: true },
        { text: 'Direct Founder Access', highlight: false },
      ],
      cta: 'Select Premium',
      featured: true,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch px-4">
      {plans.map((plan) => (
        <div 
          key={plan.id}
          className={cn(
            "relative group flex flex-col p-10 rounded-3xl transition-all duration-700 overflow-hidden border",
            plan.featured 
              ? "bg-[#0F1113] border-[var(--accent)]/40 shadow-[0_0_50px_-12px_rgba(212,175,55,0.2)]" 
              : "bg-white/[0.02] border-white/10 hover:border-white/20 shadow-2xl"
          )}
        >
          {plan.featured && (
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
              <Zap className="w-20 h-20 text-[var(--accent)]" />
            </div>
          )}
          
          <div className="relative z-10 mb-10">
            <div className="flex items-center justify-between mb-4">
               <h3 className={cn(
                 "text-2xl font-instrument-serif",
                 plan.featured ? "text-[var(--accent)]" : "text-white"
               )}>
                 {plan.name}
               </h3>
               {plan.featured && (
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--accent)] text-[var(--accent-foreground)] px-3 py-1 rounded-full">
                    Best Value
                 </span>
               )}
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
              {plan.subtitle}
            </p>
          </div>

          <div className="relative z-10 mb-10">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-instrument-serif text-white">{plan.price}€</span>
              <span className="text-xs text-white/30 uppercase tracking-widest">/mo</span>
            </div>
          </div>

          <ul className="relative z-10 space-y-5 mb-12 flex-1">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-4 group/item">
                <Check className={cn(
                  "w-4 h-4 mt-0.5 transition-colors",
                  feature.highlight ? "text-[var(--accent)]" : "text-white/20"
                )} />
                <span className={cn(
                  "text-sm leading-relaxed transition-colors",
                  feature.highlight ? "text-white font-medium" : "text-white/50 group-hover/item:text-white/70"
                )}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onSelectPlan(plan.id)}
            disabled={isLoading}
            className={cn(
              "relative z-10 w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-500",
              plan.featured 
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-lg hover:brightness-110 active:scale-[0.98]" 
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10 active:scale-[0.98]"
            )}
          >
            {isLoading ? 'Processing...' : plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
