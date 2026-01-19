import { Wallet } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Wallet className="w-10 h-10 text-[#D4AF37]" />
        <div>
          <h1 className="text-4xl font-instrument-serif text-white">Admin</h1>
          <p className="text-white/60">Budget, team, and settings</p>
        </div>
      </div>

      <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
        <p className="text-white/40">Coming soon...</p>
      </div>
    </div>
  );
}
