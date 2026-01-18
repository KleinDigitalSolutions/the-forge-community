import { Scale, Users, TrendingUp, Vote, Shield, AlertTriangle, Check, Zap } from 'lucide-react';

export default function AGBPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="space-y-6">
        <h2 className="text-4xl md:text-5xl text-white mb-4">Allgemeine Geschäftsbedingungen</h2>
        <p className="text-lg text-white/50 leading-relaxed">
          Die operativen Spielregeln für THE FORGE. Fair, transparent und auf kollektives Wachstum ausgelegt.
        </p>
      </section>

      {/* Core Principles */}
      <div className="glass-card border border-[var(--accent)]/20 bg-[var(--accent)]/[0.02] rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="flex items-start gap-5 relative z-10">
          <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-instrument-serif text-white mb-4 uppercase tracking-wider">Das Forge-Manifest</h3>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex gap-3"><span className="text-[var(--accent)] font-mono">01</span> <strong>Fair Play:</strong> Alle Founder einer Squad haben exakt gleiche Rechte.</li>
              <li className="flex gap-3"><span className="text-[var(--accent)] font-mono">02</span> <strong>Transparenz:</strong> Jeder Euro, jede Entscheidung ist systemweit einsehbar.</li>
              <li className="flex gap-3"><span className="text-[var(--accent)] font-mono">03</span> <strong>Mehrheit:</strong> Operative Entscheidungen werden demokratisch getroffen.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-12">
        {/* Section 1: The Deal */}
        <section className="p-10 glass-card rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white/40" />
            </div>
            <h3 className="text-2xl font-instrument-serif text-white">§1 - Operative Struktur</h3>
          </div>

          <div className="space-y-10">
            <div>
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Leistungsumfang</h4>
              <ul className="grid md:grid-cols-2 gap-6 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <span><strong>Anteil:</strong> Gleiches Eigentum (1 / Mitgliederzahl)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <span><strong>Stimme:</strong> Volles Stimmrecht bei Squad-Entscheidungen</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <span><strong>Ertrag:</strong> 50% Gewinnbeteiligung anteilig zum Investment</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-[var(--accent)] mt-1 flex-shrink-0" />
                  <span><strong>Einsicht:</strong> Zugriff auf das Finanz-Dashboard</span>
                </li>
              </ul>
            </div>

            <div className="pt-10 border-t border-white/5">
              <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Investitions-Parameter</h4>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Der Beitrag richtet sich nach dem Squad-Zielkapital (25k / 50k / 100k). 
                Zusätzlich fällt eine Plattformgebühr für die Infrastruktur an.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                Zahlungsfrist: 14 Tage nach Annahme des Dossiers.
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Voting */}
        <section className="p-10 glass-card rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Vote className="w-5 h-5 text-white/40" />
            </div>
            <h3 className="text-2xl font-instrument-serif text-white">§2 - Entscheidungs-Protokolle</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm">Einfache Mehrheit (&gt;50%)</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                Marketing-Kampagnen, Feature-Priorisierung, Wahl der Partner-Carrier.
              </p>
            </div>
            <div className="space-y-4 border-l border-white/5 pl-10">
              <h4 className="text-white font-bold text-sm">Qualifizierte Mehrheit (&gt;66%)</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                Änderung der AGB, Verkauf von Projekt-Assets, Squad-Auflösung.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Risks */}
        <section className="p-10 bg-red-500/[0.03] border border-red-500/20 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-2xl font-instrument-serif text-white">§3 - Risiko-Aufklärung</h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-8 max-w-2xl">
            Das Investment in Squads ist mit unternehmerischem Risiko verbunden. 
            Ein Totalverlust des Kapitals ist möglich. THE FORGE garantiert keine Gewinne.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">Kein Sparbuch</span>
            <span className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">Kapital-Risiko</span>
            <span className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">Keine Garantie</span>
          </div>
        </section>
      </div>

      <div className="pt-12 text-center border-t border-white/5">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Stand: Januar 2026 • Protokoll v1.0-AGB</p>
      </div>
    </div>
  );
}