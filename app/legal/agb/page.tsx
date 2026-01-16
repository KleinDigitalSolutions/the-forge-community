import { Scale, Users, TrendingUp, Vote, Shield, AlertTriangle, Check } from 'lucide-react';

export default function AGBPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">AGB</h1>
        <p className="text-lg text-gray-600">
          Die Spielregeln für THE FORGE. Fair, transparent, verständlich.
        </p>
      </div>

      {/* Core Principles */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Die 3 Grundprinzipien</h3>
        <div className="space-y-2 text-gray-700">
          <div className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span><strong>Fair Play:</strong> Alle Founder einer Gruppe haben die gleichen Rechte (max. 25)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span><strong>Transparenz:</strong> Jeder Euro, jede Entscheidung ist öffentlich</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span><strong>Community First:</strong> Die Mehrheit entscheidet</span>
          </div>
        </div>
      </div>

      {/* Section 1: The Deal */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">§1 - Der Deal</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Was du bekommst</h3>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Gleicher Anteil</strong> am jeweiligen Projekt (Anteil = 1 / Mitgliederzahl)</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Stimmrecht</strong> bei allen wichtigen Entscheidungen</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>50% Gewinnbeteiligung</strong> anteilig zu deinem Anteil</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Full Transparency</strong> zu allen Finanzen</span>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Was du investierst</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Beitrag je Founder</strong> = Zielkapital / Mitgliederzahl (Start-Tiers: 25k / 50k / 100k)</p>
              <p><strong>Mitgliedsgebühr</strong> für Plattformzugang (monatlich, Höhe laut Preisblatt)</p>
              <p><strong>Service-Provision</strong> für Betrieb & Automatisierung (projektspezifisch, transparent ausgewiesen)</p>
              <p>Zahlung innerhalb von <strong>14 Tagen</strong> nach Annahme</p>
              <p>Zahlungsmethoden: Banküberweisung, Stripe, PayPal</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Rechtliche Form</h3>
            <p className="text-gray-700">
              Sobald die Gruppe vollständig ist (max. 25) und das Zielkapital steht, gründen wir eine <strong>GmbH</strong>.
              Bis dahin läuft alles über mich als Einzelunternehmer. Alle Investments werden auf einem
              <strong> separaten Treuhandkonto</strong> verwahrt.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Rights & Responsibilities */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">§2 - Deine Rechte & Pflichten</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Deine Rechte</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <strong className="block text-gray-900 mb-1">Stimmrecht</strong>
                <p className="text-sm text-gray-600">1 Founder = 1 Vote bei allen wichtigen Entscheidungen</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <strong className="block text-gray-900 mb-1">Gewinnbeteiligung</strong>
                <p className="text-sm text-gray-600">Anteilig am Gewinn des Projekts, quartalsweise</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <strong className="block text-gray-900 mb-1">Transparenz</strong>
                <p className="text-sm text-gray-600">Zugang zum kompletten Dashboard</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <strong className="block text-gray-900 mb-1">Exit-Option</strong>
                <p className="text-sm text-gray-600">Verkauf nach 6 Monaten Haltefrist</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Deine Pflichten</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Aktive Teilnahme:</strong> Bei Votings abstimmen (min. 70%)</p>
              <p><strong>Respektvoller Umgang:</strong> Mit anderen Founders</p>
              <p><strong>Vertraulichkeit:</strong> Interne Infos bleiben intern</p>
              <p><strong>Fair Play:</strong> Keine Manipulation</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Plattformrechte</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Plattformbetrieb:</strong> STAKE &amp; SCALE (Klein Digital Solutions) betreibt die Plattform und stellt Infrastruktur, Tools und Automatisierung.</p>
              <p><strong>Hausrecht:</strong> Bei Regelverstoß, Zahlungsverzug oder Missbrauch kann die Mitgliedschaft pausiert oder beendet werden.</p>
              <p><strong>IP &amp; Systeme:</strong> Die Plattform-Software und Automationen bleiben Eigentum der Plattform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Voting */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Vote className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">§3 - Abstimmungen & Entscheidungen</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Was wird abgestimmt?</h3>
            <div className="space-y-1 text-gray-700">
              <p>• Serviceumfang & Pakete</p>
              <p>• Carrier- und Partnerwahl</p>
              <p>• WMS/Portal-Features</p>
              <p>• Marketing- und Vertriebsbudget</p>
              <p>• Große Ausgaben (&gt;2.000€)</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Abstimmungsregeln</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <strong className="block text-gray-900 mb-2">Einfache Mehrheit (&gt;50%)</strong>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Serviceumfang</li>
                  <li>• Feature-Entscheidungen</li>
                  <li>• Marketing-Kampagnen</li>
                </ul>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <strong className="block text-gray-900 mb-2">Qualifizierte Mehrheit (&gt;66%)</strong>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Änderung der AGB</li>
                  <li>• Verkauf des Projekts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-700">
              <strong>Voting-Zeitraum:</strong> 7 Tage. Nicht abstimmen = Enthaltung (zählt NICHT für Mehrheit).
            </p>
            <p className="text-gray-700 mt-3">
              <strong>Plattform-Entscheidungen:</strong> Aufnahme/Ausschluss von Mitgliedern, Compliance und Systembetrieb
              liegen bei der Plattformleitung.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Profit Distribution */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">§4 - Gewinnverteilung</h2>
        </div>

        <div className="space-y-6">
          <div className="text-gray-700">
            Service-Provisionen für Betrieb und Automatisierung werden als Betriebskosten transparent ausgewiesen.
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Die 50/50 Regel</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <strong className="block text-green-700 mb-2">50% an Founders</strong>
                <p className="text-sm text-gray-700">Aufgeteilt zu gleichen Teilen auf alle Founder der Gruppe (Anteil = 1 / Mitgliederzahl)</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <strong className="block text-blue-700 mb-2">50% an Operations</strong>
                <p className="text-sm text-gray-700">Für Reinvestment, neue Projekte, Wachstum</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Auszahlung</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Quartalsweise</strong> (Ende März, Juni, September, Dezember)</p>
              <p>Automatische Überweisung auf dein hinterlegtes Konto</p>
              <p>Mindestbetrag: 10€ (sonst Übertrag ins nächste Quartal)</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-700">
              <strong>Steuern:</strong> Du zahlst Kapitalertragssteuer auf deine Gewinne (25% + Soli).
              Wir schicken dir alle Infos für deine Steuererklärung.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Exit */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">§5 - Exit & Übertragung</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Verkaufen deines Anteils</h3>
            <div className="space-y-2 text-gray-700">
              <p><strong>Haltefrist:</strong> Minimum 6 Monate</p>
              <p><strong>Vorkaufsrecht:</strong> Andere Founders haben Vorrang</p>
              <p><strong>Preis:</strong> Aktueller Unternehmenswert / Anzahl Founder der Gruppe</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Rücktritt</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-gray-700">
                <strong>Innerhalb von 14 Tagen:</strong> Volle Rückerstattung deines geleisteten Beitrags<br />
                <strong>Nach 14 Tagen:</strong> Verkauf zum aktuellen Wert
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Liability */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-gray-700" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">§6 - Haftung & Risiken</h2>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Wichtig zu wissen:</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Risiko:</strong> Du kannst deinen Beitrag verlieren</p>
            <p><strong>Keine Garantie:</strong> Wir versprechen keine Gewinne</p>
            <p><strong>Haftungsbeschränkung:</strong> Maximum = geleisteter Beitrag</p>
            <p><strong>Unternehmerisches Risiko:</strong> Das ist kein Sparbuch</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Was wir garantieren:</h3>
          <div className="space-y-2 text-gray-700">
            <p className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              100% Transparenz über alle Ausgaben
            </p>
            <p className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              Faire Behandlung aller Founders
            </p>
            <p className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              Demokratische Entscheidungen
            </p>
          </div>
        </div>
      </div>

      {/* Section 7: Final */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">§7 - Schlussbestimmungen</h2>

        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Änderungen der AGB</h3>
            <p>Änderungen brauchen <strong>66% Zustimmung</strong> aller Founders. Du wirst 30 Tage vorher informiert.</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Streitbeilegung</h3>
            <p>Bei Konflikten: Erst reden. Dann Mediator. Als letztes Gericht. Gerichtsstand: Dortmund, Deutschland.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Häufige Fragen</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Kann ich mehrere Anteile kaufen?</h3>
            <p className="text-gray-600">
              Nein. 1 Person = 1 Founder-Spot = gleicher Anteil (1 / Mitgliederzahl). Das ist fair für alle.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Was wenn ich länger krank bin und nicht voten kann?</h3>
            <p className="text-gray-600">
              Sag Bescheid. Wir sind Menschen, keine Roboter. Bei längerer Abwesenheit gibt&apos;s eine Pause-Funktion.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Kann THE FORGE pleite gehen?</h3>
            <p className="text-gray-600">
              Theoretisch ja. Dann: Liquidation, Schulden zahlen, Rest verteilen. Aber wir tun alles um das zu verhindern.
            </p>
          </div>
        </div>
      </div>

      {/* Acceptance */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Verstanden?</h3>
        <p className="text-gray-700 mb-4">
          Mit deiner Zahlung deines Beitrags und dem Start der Mitgliedschaft akzeptierst du diese AGB automatisch.<br />
          Innerhalb von 14 Tagen kannst du kostenlos zurücktreten.
        </p>
        <p className="text-sm text-gray-500">
          Stand: Januar 2026 • Version 1.0
        </p>
      </div>
    </div>
  );
}
