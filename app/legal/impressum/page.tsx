import { Building2, Mail, Info } from 'lucide-react';

export default function ImpressumPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Impressum</h1>
        <p className="text-lg text-gray-600">
          Alle Infos gemäß § 5 TMG. Transparent und vollständig.
        </p>
      </div>

      {/* Transparency Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Transparenz First</h3>
            <p className="text-sm text-gray-700">
              Das Impressum ist gesetzlich vorgeschrieben. Wir gehen weiter:
              Alle Founder der jeweiligen Gruppe (max. 25) bekommen Einblick in alle Finanzen, Verträge und Entscheidungen.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Angaben gemäß § 5 TMG</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Klein Digital Solutions (Einzelunternehmen)</h3>
            <p className="text-gray-600">
              Özgür Azap<br />
              Wittbräuckerstraße 109<br />
              44287 Dortmund<br />
              Deutschland
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Kontakt</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href="mailto:info@kleindigitalsolutions.de" className="hover:text-gray-900">
                  info@kleindigitalsolutions.de
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Umsatzsteuer-ID</h3>
            <p className="text-gray-600 mb-2">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
              <span className="font-mono">DE456989341</span>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Verantwortlich für den Inhalt</h3>
            <p className="text-gray-600">
              Özgür Azap<br />
              Wittbräuckerstraße 109<br />
              44287 Dortmund<br />
              Deutschland
            </p>
          </div>
        </div>
      </div>

      {/* EU Dispute Resolution */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">EU-Streitschlichtung</h2>
        <p className="text-gray-600 mb-3">
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
        </p>
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-900 hover:underline font-medium"
        >
          https://ec.europa.eu/consumers/odr
        </a>
        <p className="text-gray-600 mt-3">
          Unsere E-Mail-Adresse findest du oben im Impressum.
        </p>
      </div>

      {/* Verbraucher­streit­beilegung */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verbraucherstreitbeilegung</h2>
        <p className="text-gray-600 mb-3">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
        <p className="text-gray-700 font-medium">
          Aber ehrlich: Wenn du ein Problem hast, schreib uns einfach.
          Wir lösen das direkt und transparent mit dir.
        </p>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Häufige Fragen</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Warum steht hier eine Privatadresse?</h3>
            <p className="text-gray-600">
              THE FORGE ist (noch) kein eingetragenes Unternehmen. Sobald eine Gruppe vollständig ist
              und die GmbH gegründet ist, wird hier die Firmenadresse stehen.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Wer haftet für was?</h3>
            <p className="text-gray-600">
              Aktuell: Ich als Gründer. Nach GmbH-Gründung: Die GmbH mit dem Stammkapital.
              Alle Founders sind über den Gesellschaftervertrag abgesichert.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Kann ich die Adresse für offizielle Dokumente nutzen?</h3>
            <p className="text-gray-600">
              Ja, diese Adresse ist für alle rechtlichen Anfragen gültig. Nach Gründung wird
              die offizielle Geschäftsadresse hier stehen.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Message */}
      <div className="text-center bg-gray-50 border border-gray-200 rounded-xl p-8">
        <p className="text-gray-700">
          <span className="font-semibold text-gray-900">Keine versteckten Infos.</span><br />
          Wenn du irgendwas wissen willst, frag einfach.
        </p>
      </div>
    </div>
  );
}
