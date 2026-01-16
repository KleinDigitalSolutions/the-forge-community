import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl font-black bg-gradient-to-r from-red-600 to-slate-400 bg-clip-text text-transparent">
              THE FORGE
            </div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/transparency" className="text-gray-400 hover:text-white transition-colors">
              Transparency
            </Link>
          </nav>
        </div>
      </header>

      {/* Legal Navigation */}
      <div className="border-b border-white/10 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-bold">Rechtliches</h1>
          </div>
          <nav className="flex flex-wrap gap-4">
            <Link
              href="/legal/impressum"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Impressum
            </Link>
            <Link
              href="/legal/datenschutz"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Datenschutz
            </Link>
            <Link
              href="/legal/agb"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              AGB
            </Link>
            <Link
              href="/legal/vertrag"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Founder-Vertrag
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </div>

      {/* Footer Note */}
      <div className="border-t border-white/10 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            Fragen zu den rechtlichen Dokumenten?{' '}
            <a href="mailto:legal@theforge.com" className="text-red-600 hover:underline">
              legal@theforge.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
