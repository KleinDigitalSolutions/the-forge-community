import PageShell from '@/app/components/PageShell';
import CommunicationClient from './CommunicationClient';
import ContractScanner from './ContractScanner';
import { Brain, Zap, FileText, CheckCircle2 } from 'lucide-react';

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
          <header className="text-center space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/60">
              AI Communication
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Orion: Dein AI Co-Founder
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
              Ein AI-Assistent, der <span className="text-[#D4AF37] font-semibold">deine Ventures kennt</span>, sich <span className="text-[#D4AF37] font-semibold">Präferenzen merkt</span> und <span className="text-[#D4AF37] font-semibold">Verträge analysiert</span>. Jarvis-Mode für Founder.
            </p>

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mt-12 text-left">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">Langzeitgedächtnis</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Sag "Merk dir, dass ich nur B2B mache" – Orion speichert es dauerhaft.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">Venture-Kontext</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Kennt deine Projekte, Brand DNA, Squads – ohne dass du es jedes Mal erklären musst.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">Contract Risk Scanner</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      PDF rein → Risiko-Score, Kostenfallen, Gegenangebot-Email raus. In 30 Sekunden.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm">Email Drafts</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Generiert professionelle Antworten mit konkreten Verhandlungsvorschlägen.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Case Examples */}
            <div className="mt-10 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6 text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-3">
                Was du fragen kannst:
              </div>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">→</span>
                  <span>"Welche Ventures habe ich gerade in Phase 2?"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">→</span>
                  <span>"Merk dir: Ich arbeite nicht mit Dropshipping-Modellen."</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">→</span>
                  <span>"Analysiere diesen SaaS-Vertrag – was sind die Risiken?"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">→</span>
                  <span>"Schreibe eine Antwort-Email mit 3 Gegenangeboten."</span>
                </div>
              </div>
            </div>
          </header>

          <CommunicationClient />
          <ContractScanner />
        </div>
      </div>
    </PageShell>
  );
}
