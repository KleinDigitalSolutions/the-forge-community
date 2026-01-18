'use client';

import { Check } from 'lucide-react';

type PlanType = 'starter' | 'growth' | 'premium';

interface PricingTableProps {
  onSelectPlan: (plan: PlanType) => void;
  isLoading: boolean;
}

export function PricingTable({ onSelectPlan, isLoading }: PricingTableProps) {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
      {/* STARTER */}
      <div className="group bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 flex flex-col relative hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1">
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold text-[var(--foreground)] uppercase tracking-wide">Starter</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium uppercase tracking-widest">Low-Friction Entry</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-display font-bold text-[var(--foreground)]">69€</span>
          <span className="text-[var(--muted-foreground)]">/Monat</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]"><strong>15%</strong> Rohertrag Share</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Zugang zur Community</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Basic Support</span>
          </li>
        </ul>
        <button
          onClick={() => onSelectPlan('starter')}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-transparent border border-[var(--border)] text-[var(--foreground)] rounded-xl font-bold uppercase tracking-widest text-xs hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Starter wählen'}
        </button>
      </div>

      {/* GROWTH */}
      <div className="group bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 flex flex-col relative hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1">
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold text-[var(--foreground)] uppercase tracking-wide">Growth</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium uppercase tracking-widest">Order-Based Scale</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-display font-bold text-[var(--foreground)]">99€</span>
          <span className="text-[var(--muted-foreground)]">/Monat</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]"><strong>10%</strong> Rohertrag Share</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">2€ pro Order Gebühr</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Full Community Access</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Priority Support</span>
          </li>
        </ul>
        <button
          onClick={() => onSelectPlan('growth')}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-transparent border border-[var(--border)] text-[var(--foreground)] rounded-xl font-bold uppercase tracking-widest text-xs hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Growth wählen'}
        </button>
      </div>

      {/* PREMIUM */}
      <div className="group bg-[var(--surface-muted)] rounded-2xl border border-[var(--accent)] p-8 flex flex-col relative transform hover:-translate-y-2 transition-all duration-300 shadow-[0_0_30px_-10px_rgba(212,175,55,0.15)]">
        <div className="absolute top-0 right-0 left-0 -mt-3 flex justify-center">
          <span className="bg-[var(--accent)] text-[var(--accent-foreground)] text-[0.6rem] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
            Best Value
          </span>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold text-[var(--accent)] uppercase tracking-wide">Premium</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-2 font-medium uppercase tracking-widest">High Volume Pro</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-display font-bold text-[var(--foreground)]">149€</span>
          <span className="text-[var(--muted-foreground)]">/Monat</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--foreground)] font-medium"><strong>5%</strong> Rohertrag Share</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Keine Order-Gebühr</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Voting Power x2</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span className="text-sm text-[var(--secondary)]">Direct Founder Access</span>
          </li>
        </ul>
        <button
          onClick={() => onSelectPlan('premium')}
          disabled={isLoading}
          className="ember-glow w-full py-3 px-4 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-xl font-bold hover:brightness-110 transition-all shadow-lg disabled:opacity-50 uppercase text-xs tracking-[0.15em]"
        >
          {isLoading ? 'Laden...' : 'Premium wählen'}
        </button>
      </div>
    </div>
  );
}