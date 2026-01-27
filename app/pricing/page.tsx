'use client';

import { useState } from 'react';
import { PricingTable } from '@/app/components/PricingTable';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelectPlan = async (type: 'subscription' | 'credits', priceId: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, priceId }),
      });

      if (!response.ok) {
        throw new Error('Checkout failed');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (error: any) {
      console.error('[PRICING] Error:', error);
      alert('Fehler beim Checkout. Bitte nochmal versuchen.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] py-20">
      <div className="container mx-auto px-4 mb-12 text-center">
        <h1 className="text-5xl font-instrument-serif text-white mb-4">
          Pricing
        </h1>
        <p className="text-xl text-white/60">
          Platform Access oder AI Credits kaufen
        </p>
      </div>

      <PricingTable onSelectPlan={handleSelectPlan} isLoading={isLoading} />
    </div>
  );
}
