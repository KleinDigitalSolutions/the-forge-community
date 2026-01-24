import PageShell from '@/app/components/PageShell';
import CommunicationClient from './CommunicationClient';

export default function CommunicationPage() {
  return (
    <PageShell>
      <div className="min-h-screen text-white">
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-32">
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
        </div>
      </div>
    </PageShell>
  );
}
