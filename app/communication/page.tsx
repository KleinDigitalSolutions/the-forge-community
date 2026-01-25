import PageShell from '@/app/components/PageShell';
import CommunicationClient from './CommunicationClient';
import ContractScanner from './ContractScanner';

export default function CommunicationPage() {
  return (
    <PageShell
      contentClassName="flex-1 relative overflow-hidden px-0 pb-0 pt-0 sm:px-0 lg:ml-64 lg:p-0 transition-all"
      containerClassName="relative w-full"
      showGlow={false}
    >
      <div className="relative min-h-screen text-white overflow-hidden bg-[#07080a] w-full">
        <div className="absolute inset-0 pointer-events-none bg-[#0b1220]/85" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative h-full w-full bg-[radial-gradient(70%_110%_at_50%_10%,rgba(255,255,255,0.14)_0%,rgba(20,136,252,0.10)_45%,rgba(7,8,10,0)_80%)]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-32">
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/60">
              AI Communication
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Deine AI-Kommunikationszentrale
            </h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              Stelle Fragen, klaere Entscheidungen, baue Prompts. Der Chat nutzt aktuell unsere Gemini-API.
            </p>
          </header>

          <CommunicationClient />
          <ContractScanner />
        </div>
      </div>
    </PageShell>
  );
}
