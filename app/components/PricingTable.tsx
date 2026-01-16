'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

type PlanType = 'starter' | 'growth' | 'premium';

interface PricingTableProps {
  onSelectPlan: (plan: PlanType) => void;
  isLoading: boolean;
}

export function PricingTable({ onSelectPlan, isLoading }: PricingTableProps) {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {/* STARTER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col relative hover:border-gray-300 transition-colors">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Starter / Low-Friction</h3>
          <p className="text-sm text-gray-500 mt-2">Perfekt für den Einstieg ohne Risiko.</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">69€</span>
          <span className="text-gray-500">/Monat</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700"><strong>15%</strong> Rohertrag Share</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Zugang zur Community</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Basic Support</span>
          </li>
        </ul>
        <button
          onClick={() => onSelectPlan('starter')}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Starter wählen'}
        </button>
      </div>

      {/* GROWTH (Order Based) */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-600 p-8 flex flex-col relative transform scale-105 z-10">
        <div className="absolute top-0 right-0 left-0 -mt-4 flex justify-center">
          <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Empfohlen
          </span>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Growth / Order-Based</h3>
          <p className="text-sm text-gray-500 mt-2">Für Shops mit moderatem Volumen.</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">99€</span>
          <span className="text-gray-500">/Monat</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm text-gray-700"><strong>10%</strong> Rohertrag Share</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm text-gray-700">2€ pro Order Gebühr</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm text-gray-700">Full Community Access</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="text-sm text-gray-700">Priority Support</span>
          </li>
        </ul>
        <button
          onClick={() => onSelectPlan('growth')}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Growth wählen'}
        </button>
      </div>

      {/* PREMIUM */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col relative hover:border-gray-300 transition-colors">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Premium / High Volume</h3>
          <p className="text-sm text-gray-500 mt-2">Maximaler Cashflow für Profis.</p>
        </div>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">149€</span>
          <span className="text-gray-500">/Monat</span>
        </div>
        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700"><strong>5%</strong> Rohertrag Share</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Keine Order-Gebühr</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Voting Power x2</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Direct Founder Access</span>
          </li>
        </ul>
        <button
          onClick={() => onSelectPlan('premium')}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : 'Premium wählen'}
        </button>
      </div>
    </div>
  );
}
