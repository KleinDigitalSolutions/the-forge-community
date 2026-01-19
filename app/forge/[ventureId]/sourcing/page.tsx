import { Factory } from 'lucide-react';

export default function SourcingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Factory className="w-10 h-10 text-[#D4AF37]" />
        <div>
          <h1 className="text-4xl font-instrument-serif text-white">Sourcing</h1>
          <p className="text-white/60">Find suppliers and manage production</p>
        </div>
      </div>

      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <p className="text-white/40">Coming soon...</p>
      </div>
    </div>
  );
}
