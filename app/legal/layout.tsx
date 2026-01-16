import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl font-semibold text-gray-900">THE FORGE</div>
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/transparency" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Transparency
            </Link>
          </nav>
        </div>
      </header>

      {/* Legal Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Rechtliches</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-gray-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Rechtliche Dokumente</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/legal/impressum"
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Impressum
            </Link>
            <Link
              href="/legal/datenschutz"
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Datenschutz
            </Link>
            <Link
              href="/legal/agb"
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              AGB
            </Link>
            <Link
              href="/legal/vertrag"
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
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
      <div className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-600">
            Fragen zu den rechtlichen Dokumenten?{' '}
            <a href="mailto:legal@theforge.community" className="text-gray-900 hover:underline font-medium">
              legal@theforge.community
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
