import { Megaphone } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Megaphone className="w-10 h-10 text-[#D4AF37]" />
        <div>
          <h1 className="text-4xl font-instrument-serif text-white">Marketing</h1>
          <p className="text-white/60">AI-powered campaigns and content</p>
        </div>
      </div>

      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <p className="text-white/40">Coming soon...</p>
      </div>
    </div>
  );
}
