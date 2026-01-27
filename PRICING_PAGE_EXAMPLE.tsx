/**
 * Beispiel-Integration der neuen PricingTable in deine Landing Page
 *
 * So bindest du die modernisierte PricingTable ein:
 */

'use client';

import { useState } from 'react';
import { PricingTable } from '@/app/components/PricingTable';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // Falls du sonner für Toasts nutzt

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handler für Plan-Auswahl
  const handleSelectPlan = async (type: 'subscription' | 'credits', priceId: string) => {
    setIsLoading(true);

    try {
      // API Call zu deiner Checkout Route
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, priceId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Checkout failed');
      }

      const { url } = await response.json();

      // Weiterleitung zu Stripe Checkout
      window.location.href = url;

    } catch (error: any) {
      console.error('[PRICING] Checkout error:', error);

      // Toast-Notification (optional)
      if (typeof toast !== 'undefined') {
        toast.error('Fehler beim Checkout', {
          description: error.message || 'Bitte versuche es später erneut.',
        });
      } else {
        alert(`Checkout Fehler: ${error.message}`);
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-instrument-serif text-white mb-6">
          Pricing & AI Credits
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Wähle den Plan, der zu deinem Venture passt. Monatlich kündbar, keine Überraschungen.
        </p>
      </div>

      {/* Pricing Table */}
      <PricingTable
        onSelectPlan={handleSelectPlan}
        isLoading={isLoading}
      />

      {/* FAQ Section (Optional) */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-instrument-serif text-white text-center mb-12">
          Häufige Fragen
        </h2>

        <div className="max-w-3xl mx-auto space-y-6">
          <FAQItem
            question="Kann ich jederzeit kündigen?"
            answer="Ja, dein Abo ist monatlich kündbar. Keine Kündigungsfrist, keine versteckten Kosten."
          />
          <FAQItem
            question="Verfallen AI Credits?"
            answer="Nein! Einmal gekaufte Credits verfallen nie. Du kannst sie nutzen, wann immer du willst."
          />
          <FAQItem
            question="Sind die Preise inkl. MwSt.?"
            answer="Ja, alle angezeigten Preise sind Endpreise inkl. deutscher MwSt. (19%)."
          />
          <FAQItem
            question="Kann ich Credits und Abo kombinieren?"
            answer="Ja! Platform Access gibt dir 200 Credits/Monat. Du kannst jederzeit Credit Packs dazukaufen."
          />
        </div>
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border border-white/10 rounded-xl p-6 cursor-pointer hover:border-white/20 transition-colors"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">{question}</h3>
        <span className="text-[var(--accent)] text-2xl">
          {isOpen ? '−' : '+'}
        </span>
      </div>
      {isOpen && (
        <p className="mt-4 text-white/60 text-sm leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

/**
 * ALTERNATIVE: Direkt in Landing Page integrieren
 *
 * Falls du die PricingTable direkt in deiner Landing Page (z.B. app/page.tsx) einbinden möchtest:
 */

/*
import { PricingTable } from '@/app/components/PricingTable';

export default function HomePage() {
  const handleSelectPlan = async (type, priceId) => {
    // ... siehe oben
  };

  return (
    <>
      // ... Hero Section, Features, etc.

      <section id="pricing" className="py-20">
        <PricingTable onSelectPlan={handleSelectPlan} />
      </section>

      // ... Footer, etc.
    </>
  );
}
*/

/**
 * SUCCESS HANDLING in /dashboard
 *
 * In deiner Dashboard-Seite kannst du den payment=success Parameter abfangen:
 */

/*
// app/dashboard/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get('payment');
  const paymentType = searchParams.get('type');

  useEffect(() => {
    if (paymentSuccess === 'success') {
      if (paymentType === 'credits') {
        toast.success('Credits erfolgreich gekauft!', {
          description: 'Deine AI Credits wurden deinem Account gutgeschrieben.',
        });
      } else if (paymentType === 'subscription') {
        toast.success('Willkommen bei The Forge!', {
          description: 'Dein Platform Access ist jetzt aktiv. 200 Credits warten auf dich.',
        });
      }

      // URL bereinigen (Payment-Parameter entfernen)
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [paymentSuccess, paymentType]);

  return (
    // ... Dashboard Content
  );
}
*/
