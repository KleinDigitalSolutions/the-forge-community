import { FileText, Download, Check, Info } from 'lucide-react';

export default function VertragPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Founder-Vertrag</h1>
        <p className="text-lg text-gray-600">
          Der offizielle Vertrag zwischen dir und THE FORGE. Schwarz auf weiß.
        </p>
      </div>

      {/* Download CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-3">
            <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Vertrag als Vorschau ansehen</h3>
              <p className="text-sm text-gray-700">
                Lies ihn in Ruhe durch. Zeig ihn deinem Anwalt. Keine Eile.
              </p>
            </div>
          </div>
          <a
            href="#vertrag-vorschau"
            className="flex items-center gap-2 text-sm bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Zur Vorschau
          </a>
        </div>
      </div>

      {/* What's in the contract */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Was steht im Vertrag?</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'Deine Rechte', desc: 'Anteil = 1 / Mitgliederzahl, Stimmrecht, Gewinnbeteiligung' },
            { title: 'Deine Pflichten', desc: 'Beitrag je Gruppe, Mitgliedsgebühr, aktive Teilnahme' },
            { title: 'Gewinnverteilung', desc: '50/50 Split, quartalsweise Auszahlung' },
            { title: 'Exit-Regelung', desc: 'Verkauf nach 6 Monaten, Vorkaufsrecht' },
            { title: 'Haftungsbeschränkung', desc: 'Maximum = geleisteter Beitrag' },
            { title: 'Transparenzpflicht', desc: 'Alle Finanzen öffentlich, kein Kleingedrucktes' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contract Preview */}
      <div id="vertrag-vorschau" className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Vertrags-Vorschau</h2>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-sm leading-relaxed max-h-[600px] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">FOUNDER-BETEILIGUNGSVERTRAG</h1>
            <p className="text-gray-600">THE FORGE Community Fulfillment Hub</p>
          </div>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Präambel</h2>
              <p>
                THE FORGE ist ein Community-basierter Fulfillment Hub, der es bis zu 25 Personen ermoeglicht,
                gemeinsam SmartStore aufzubauen und anteilig am Erfolg teilzuhaben.
                Dieser Vertrag regelt die Beteiligung als Founder.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§1 Vertragsparteien</h2>
              <div className="pl-4">
                <p className="mb-2"><strong>Zwischen:</strong></p>
                <p className="mb-2">
                  Özgür Azap<br />
                  Klein Digital Solutions (Einzelunternehmen)<br />
                  Wittbräuckerstraße 109<br />
                  44287 Dortmund<br />
                  Deutschland<br />
                  (nachfolgend „THE FORGE&quot; genannt)
                </p>
                <p className="mt-4 mb-2"><strong>und</strong></p>
                <p>
                  [Name des Founders]<br />
                  [Adresse des Founders]<br />
                  (nachfolgend „Founder&quot; genannt)
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§2 Gegenstand des Vertrages</h2>
              <div className="pl-4 space-y-2">
                <p><strong>2.1</strong> Der Founder erwirbt durch Zahlung seines Beitrags eine gleichberechtigte Beteiligung am Projekt (Anteil = 1 / Mitgliederzahl).</p>
                <p><strong>2.2</strong> Der Beitrag ergibt sich aus dem Zielkapital der Gruppe geteilt durch die Mitgliederzahl (Start-Tiers: 25k / 50k / 100k).</p>
                <p><strong>2.3</strong> Zusätzlich fällt eine monatliche Mitgliedsgebühr für den Plattformzugang an (Höhe gemäß Preisblatt).</p>
                <p><strong>2.4</strong> Für Betrieb und Automatisierung wird eine Service-Provision erhoben, die transparent ausgewiesen wird.</p>
                <p><strong>2.5</strong> Die Beteiligung wird nach Gründung einer GmbH in Gesellschaftsanteile umgewandelt.</p>
                <p><strong>2.6</strong> Bis zur GmbH-Gründung werden alle Investments auf einem separaten Treuhandkonto verwahrt.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§3 Rechte des Founders</h2>
              <div className="pl-4 space-y-2">
                <p><strong>3.1 Ownership:</strong> Anteil = 1 / Mitgliederzahl am Projekt</p>
                <p><strong>3.2 Stimmrecht:</strong> 1 Vote bei allen wichtigen Entscheidungen</p>
                <p><strong>3.3 Gewinnbeteiligung:</strong> Anteilige Beteiligung an 50% aller Gewinne, quartalsweise</p>
                <p><strong>3.4 Transparenz:</strong> Vollständiger Zugang zum Transparency Dashboard</p>
                <p><strong>3.5 Exit-Option:</strong> Verkaufsmöglichkeit nach 6 Monaten</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§4 Pflichten des Founders</h2>
              <div className="pl-4 space-y-2">
                <p><strong>4.1 Investment:</strong> Zahlung des Beitrags innerhalb von 14 Tagen</p>
                <p><strong>4.2 Mitgliedsgebühr:</strong> Monatliche Gebühr für Plattformzugang gemäß Preisblatt</p>
                <p><strong>4.3 Aktive Teilnahme:</strong> Mindestens 70% bei Abstimmungen</p>
                <p><strong>4.4 Vertraulichkeit:</strong> Interne Informationen bleiben vertraulich</p>
                <p><strong>4.5 Fair Play:</strong> Respektvoller Umgang mit anderen Founders</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§5 Gewinnverteilung</h2>
              <div className="pl-4 space-y-2">
                <p><strong>5.1</strong> Direkte Betriebskosten und vereinbarte Service-Provisionen werden vor der Gewinnverteilung berücksichtigt.</p>
                <p><strong>5.2</strong> Von allen Gewinnen werden 50% an die Founders ausgeschüttet, 50% verbleiben bei Operations.</p>
                <p><strong>5.3</strong> Die Founder-Anteile (50%) werden zu gleichen Teilen auf alle Founder der Gruppe verteilt (Anteil = 1 / Mitgliederzahl).</p>
                <p><strong>5.4</strong> Auszahlungen erfolgen quartalsweise.</p>
                <p><strong>5.5</strong> Mindestbetrag pro Auszahlung: 10€.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§6 Abstimmungen</h2>
              <div className="pl-4 space-y-2">
                <p><strong>6.1</strong> Einfache Mehrheit (&gt;50%): Serviceumfang, WMS/Portal, Marketing</p>
                <p><strong>6.2</strong> Qualifizierte Mehrheit (&gt;66%): AGB-Änderungen, Verkauf des Projekts</p>
                <p><strong>6.3</strong> Voting-Zeitraum: 7 Tage</p>
                <p><strong>6.4</strong> Aufnahme/Ausschluss von Mitgliedern sowie Compliance und Plattformbetrieb liegen bei der Plattformleitung.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§7 Haftung</h2>
              <div className="pl-4 space-y-2">
                <p><strong>7.1</strong> Die Haftung des Founders ist auf den geleisteten Beitrag beschränkt.</p>
                <p><strong>7.2</strong> THE FORGE haftet nicht für Verluste oder entgangene Gewinne.</p>
                <p><strong>7.3</strong> Bei grober Fahrlässigkeit oder Vorsatz gelten die gesetzlichen Haftungsregeln.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§8 Kündigung & Exit</h2>
              <div className="pl-4 space-y-2">
                <p><strong>8.1</strong> Widerruf innerhalb 14 Tagen: Volle Rückerstattung des geleisteten Beitrags</p>
                <p><strong>8.2</strong> Nach 14 Tagen: Verkauf zum aktuellen Wert</p>
                <p><strong>8.3</strong> Haltefrist: Minimum 6 Monate</p>
                <p><strong>8.4</strong> Vorkaufsrecht: Andere Founders haben bei Verkauf Vorrang</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">§9 Schlussbestimmungen</h2>
              <div className="pl-4 space-y-2">
                <p><strong>9.1</strong> Änderungen des Vertrages bedürfen der Schriftform und 66% Zustimmung.</p>
                <p><strong>9.2</strong> Sollten einzelne Bestimmungen unwirksam sein, bleibt der restliche Vertrag gültig.</p>
                <p><strong>9.3</strong> Es gilt deutsches Recht.</p>
                <p><strong>9.4</strong> Gerichtsstand ist Dortmund, Deutschland.</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t-2 border-gray-300">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="mb-2">_______________________</p>
                  <p className="text-sm">Ort, Datum</p>
                  <p className="mt-4 mb-2">_______________________</p>
                  <p className="text-sm">Unterschrift THE FORGE</p>
                </div>
                <div>
                  <p className="mb-2">_______________________</p>
                  <p className="text-sm">Ort, Datum</p>
                  <p className="mt-4 mb-2">_______________________</p>
                  <p className="text-sm">Unterschrift Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Hinweis:</strong> Dies ist eine Vorschau. Der finale Vertrag wird von einem Anwalt geprüft und notariell beglaubigt.
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Wichtig zu wissen</h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-lg font-bold text-gray-400">1.</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Lass den Vertrag prüfen</h3>
              <p className="text-gray-600">Zeig ihn deinem Anwalt. Wir wollen, dass du dich sicher fühlst.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg font-bold text-gray-400">2.</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">14 Tage Widerrufsrecht</h3>
              <p className="text-gray-600">Du kannst innerhalb von 14 Tagen ohne Angabe von Gründen zurücktreten. Geld zurück, keine Fragen.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg font-bold text-gray-400">3.</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Notarielle Beglaubigung</h3>
              <p className="text-gray-600">Nach GmbH-Gründung wird der Vertrag notariell beglaubigt. Kosten übernimmt THE FORGE.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg font-bold text-gray-400">4.</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Digitale Unterschrift</h3>
              <p className="text-gray-600">Du kannst digital signieren (rechtsgültig) oder per Post schicken. Beides okay.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Häufige Fragen zum Vertrag</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Muss ich den Vertrag unterschreiben bevor ich zahle?</h3>
            <p className="text-gray-600">
              Ja. Erst unterschreiben, dann zahlen. So bist du rechtlich abgesichert.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Was wenn ich den Vertrag nicht verstehe?</h3>
            <p className="text-gray-600">
              Schreib uns. Wir erklären dir alles in einem 1:1 Call. Oder frag deinen Anwalt.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">Kann ich den Vertrag verhandeln?</h3>
            <p className="text-gray-600">
              Die Grundbedingungen sind für alle gleich (Fairness). Bei speziellen Fällen können wir reden.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-blue-50 border border-blue-200 rounded-xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Bereit zu unterschreiben?</h3>
        <p className="text-gray-700 mb-6">
          Schau dir die Vorschau an, lies alles in Ruhe, und wenn alles klar ist:<br />
          Wir sehen uns als Founder.
        </p>
        <a
          href="#vertrag-vorschau"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Vertrag ansehen
        </a>
      </div>
    </div>
  );
}
