import { Shield, Database, Lock, Eye, Trash2, Check } from 'lucide-react';

export default function DatenschutzPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Datenschutzerklärung</h1>
        <p className="text-lg text-gray-600">
          Deine Daten gehören dir. Punkt. Hier erfährst du genau, was wir mit ihnen machen.
        </p>
      </div>

      {/* DSGVO Principles */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Unsere Prinzipien</h3>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Wir sammeln nur, was wir wirklich brauchen
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Wir verkaufen NIEMALS deine Daten
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Du kannst jederzeit alles löschen lassen
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Alle Founders-Daten sind verschlüsselt
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Responsible Party */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verantwortlicher</h2>
        <p className="text-gray-600 mb-4">
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
        </p>
        <div className="text-gray-700">
          <p>
            Özgür Azap<br />
            Wittbräuckerstraße 109<br />
            44287 Dortmund<br />
            Deutschland
          </p>
          <p className="mt-4">
            E-Mail: <a href="mailto:info@kleindigitalsolutions.de" className="text-gray-900 hover:underline font-medium">info@kleindigitalsolutions.de</a>
          </p>
        </div>
      </div>

      {/* Data We Collect */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Welche Daten wir sammeln</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Bei der Bewerbung als Founder:</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Name:</strong> Um dich zu identifizieren</p>
              <p><strong>E-Mail:</strong> Um mit dir zu kommunizieren</p>
              <p><strong>Telefon:</strong> Für wichtige Rückfragen</p>
              <p><strong>Instagram Handle:</strong> Um dein Profil zu checken</p>
              <p><strong>Motivation:</strong> Warum du mitmachen willst</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Automatisch erfasste Daten:</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>IP-Adresse:</strong> Technisch notwendig für Website-Betrieb</p>
              <p><strong>Browser-Info:</strong> Um die Seite korrekt anzuzeigen</p>
              <p><strong>Zugriffszeitpunkt:</strong> Für Sicherheit und Error-Tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* How We Use Data */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Wofür wir deine Daten nutzen</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">1. Founder-Auswahl & Onboarding</h3>
            <p className="text-sm text-gray-600 mb-2">Um deine Bewerbung zu prüfen und dich als Founder anzulegen.</p>
            <p className="text-xs text-gray-500">Rechtsgrundlage: Vertragsanbahnung (Art. 6 Abs. 1 lit. b DSGVO)</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">2. Kommunikation</h3>
            <p className="text-sm text-gray-600 mb-2">Um dich über Updates, Votings und wichtige Entscheidungen zu informieren.</p>
            <p className="text-xs text-gray-500">Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">3. Transparenz Dashboard</h3>
            <p className="text-sm text-gray-600 mb-2">Dein Name erscheint bei Investments & Transaktionen, die du tätigst.</p>
            <p className="text-xs text-gray-500">Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">4. Rechtliche Verpflichtungen</h3>
            <p className="text-sm text-gray-600 mb-2">Für Verträge, Steuer, Buchhaltung.</p>
            <p className="text-xs text-gray-500">Rechtsgrundlage: Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO)</p>
          </div>
        </div>
      </div>

      {/* Third Party Services */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Externe Dienste</h2>
        </div>

        <div className="space-y-4">
          <div className="border-l-4 border-blue-400 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Notion (Datenbank)</h3>
            <p className="text-sm text-gray-600 mb-2">
              Wir speichern Founder-Daten in Notion (US-Unternehmen).
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Notion Labs Inc., San Francisco, CA, USA</li>
              <li>• Datenübermittlung auf Basis von EU-Standardvertragsklauseln</li>
              <li>• <a href="https://www.notion.so/de-de/privacy" target="_blank" className="hover:underline">Datenschutzerklärung</a></li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-400 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Vercel (Hosting)</h3>
            <p className="text-sm text-gray-600 mb-2">
              Diese Website läuft auf Vercel (US-Unternehmen).
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Vercel Inc., Covina, CA, USA</li>
              <li>• Datenübermittlung auf Basis von EU-Standardvertragsklauseln</li>
              <li>• <a href="https://vercel.com/legal/privacy-policy" target="_blank" className="hover:underline">Datenschutzerklärung</a></li>
            </ul>
          </div>

          <div className="border-l-4 border-green-400 pl-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tally (Bewerbungsformular)</h3>
            <p className="text-sm text-gray-600 mb-2">
              Bewerbungen laufen über Tally Forms (EU-konform).
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Tally, Bruxelles, Belgien (EU)</li>
              <li>• DSGVO-konform, Server in der EU</li>
              <li>• <a href="https://tally.so/help/privacy-policy" target="_blank" className="hover:underline">Datenschutzerklärung</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Your Rights */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Deine Rechte</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl text-gray-400">→</div>
            <div>
              <h3 className="font-semibold text-gray-900">Auskunft (Art. 15 DSGVO)</h3>
              <p className="text-sm text-gray-600">Wir sagen dir genau, welche Daten wir von dir haben.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-2xl text-gray-400">→</div>
            <div>
              <h3 className="font-semibold text-gray-900">Berichtigung (Art. 16 DSGVO)</h3>
              <p className="text-sm text-gray-600">Falsche Daten? Wir korrigieren sie sofort.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-2xl text-gray-400">→</div>
            <div>
              <h3 className="font-semibold text-gray-900">Löschung (Art. 17 DSGVO)</h3>
              <p className="text-sm text-gray-600">Du willst raus? Wir löschen alles (außer rechtlich Notwendiges).</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-2xl text-gray-400">→</div>
            <div>
              <h3 className="font-semibold text-gray-900">Datenübertragbarkeit (Art. 20 DSGVO)</h3>
              <p className="text-sm text-gray-600">Du bekommst deine Daten als Download (JSON/CSV).</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">So einfach geht&apos;s:</span><br />
            E-Mail an <a href="mailto:datenschutz@theforge.community" className="text-gray-900 hover:underline font-medium">datenschutz@theforge.community</a> mit deinem Anliegen.
            Antwort binnen 48h.
          </p>
        </div>
      </div>

      {/* Data Security */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Wie wir deine Daten schützen</h2>

        <div className="space-y-3 text-gray-700">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>HTTPS/SSL:</strong> Alle Verbindungen verschlüsselt</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>Zugriffskontrolle:</strong> Nur autorisierte Personen</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>Regelmäßige Backups:</strong> Verschlüsselt gespeichert</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span><strong>Keine Weitergabe:</strong> An niemanden, niemals</span>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Häufige Fragen</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Sehen andere Founders meine persönlichen Daten?</h3>
            <p className="text-gray-600">
              Nein. Andere Founders sehen nur deinen Namen und Founder-Nummer im Dashboard.
              E-Mail, Telefon, etc. bleiben privat.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Was passiert mit meinen Daten wenn ich aussteige?</h3>
            <p className="text-gray-600">
              Wir löschen alles außer: Name + Investment-Betrag (für Buchhaltung, 10 Jahre Aufbewahrungspflicht).
              Alles andere weg.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Nutzt ihr Cookies?</h3>
            <p className="text-gray-600">
              Aktuell nur technisch notwendige (Session-Cookies für Login). Kein Tracking, keine Analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Stand: Januar 2026
      </div>
    </div>
  );
}
