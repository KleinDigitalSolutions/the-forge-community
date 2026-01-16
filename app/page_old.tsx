'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Vote, Rocket, TrendingUp, Heart, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Home() {
  const [foundersCount, setFoundersCount] = useState(3);

  useEffect(() => {
    async function fetchFoundersCount() {
      try {
        const response = await fetch('/api/founders');
        if (response.ok) {
          const founders = await response.json();
          // Count active founders
          const activeCount = founders.filter((f: any) => f.status === 'active').length;
          setFoundersCount(activeCount);
        }
      } catch (error) {
        console.error('Error fetching founders count:', error);
      }
    }

    fetchFoundersCount();
  }, []);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const particles = isMounted ? [...Array(20)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
  })) : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-slate-900/30" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-9xl font-black mb-6 bg-gradient-to-r from-red-600 to-slate-200 bg-clip-text text-transparent">
              THE FORGE
            </h1>
            <p className="text-2xl md:text-4xl font-bold mb-4 text-gray-300">
              Community Brand Factory
            </p>
            <p className="text-4xl md:text-6xl font-black mb-8 text-white">
              50 Founders. Eine Mission. <br />
              <span className="bg-gradient-to-r from-red-600 to-slate-400 bg-clip-text text-transparent">
                Echte Brands.
              </span>
            </p>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Du hast keine 100.000€ für ein Startup? Wir auch nicht.<br />
              <span className="text-white font-bold">Aber zusammen haben wir alles was wir brauchen.</span>
            </p>

            {/* Live Counter */}
            <div className="inline-block bg-gradient-to-r from-red-900/40 to-slate-900/40 border border-red-600/50 rounded-2xl p-8 mb-12">
              <div className="text-6xl font-black text-red-600 mb-2">
                {foundersCount}/50
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-widest">
                Founders Joined
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#join" className="group bg-gradient-to-r from-red-600 to-slate-800 text-white px-12 py-6 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-2xl shadow-red-600/50">
                Founder werden
                <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#how" className="bg-white/10 backdrop-blur-sm text-white px-12 py-6 rounded-full text-xl font-bold hover:bg-white/20 transition-all border border-white/20">
                Wie es funktioniert
              </a>
            </div>
          </motion.div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-red-600/30 rounded-full"
              style={{
                left: p.left,
                top: p.top,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
              }}
            />
          ))}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 bg-gradient-to-b from-black to-red-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8">Das Problem</h2>
            <div className="space-y-6 text-2xl text-gray-400 max-w-4xl mx-auto">
              <p>Große Brands gehören wenigen.</p>
              <p>Gute Ideen scheitern an fehlendem Kapital.</p>
              <p>Normale Leute bleiben außen vor.</p>
              <p className="text-4xl font-bold text-red-600 pt-8">
                Das ändert sich jetzt.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-32 bg-gradient-to-b from-red-950/20 to-black">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-12">Die Lösung</h2>
            <div className="bg-gradient-to-r from-red-900/40 to-slate-900/40 border border-red-600/50 rounded-3xl p-12 mb-12">
              <p className="text-3xl md:text-5xl font-black mb-6">
                50 Leute. 500€ pro Person.<br />
                <span className="text-red-600">25.000€ Startkapital.</span>
              </p>
              <p className="text-2xl text-gray-300">
                Wir bauen nicht für einen CEO – <span className="text-white font-bold">wir bauen für uns alle.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-20 text-center">
            Wie THE FORGE funktioniert
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Vote,
                title: "1. VOTE",
                description: "Die Community entscheidet welches Produkt wir bauen. Demokratisch. Transparent.",
                color: "orange"
              },
              {
                icon: Rocket,
                title: "2. BUILD",
                description: "Ich kümmere mich um Supplier, Produktion, Qualitätskontrolle. Du verfolgst jeden Schritt live.",
                color: "purple"
              },
              {
                icon: TrendingUp,
                title: "3. LAUNCH",
                description: "Wir bringen das Produkt gemeinsam auf den Markt. Jeder Founder wird zum Markenbotschafter.",
                color: "orange"
              },
              {
                icon: Heart,
                title: "4. SPLIT",
                description: "Gewinne werden 50/50 geteilt: 50% für Operations, 50% zurück an die 50 Founders.",
                color: "purple"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-red-900/20 to-black border border-red-600/30 rounded-2xl p-8 hover:border-red-600/60 transition-all"
              >
                <step.icon className="w-16 h-16 mb-6 text-red-600" />
                <h3 className="text-2xl font-black mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-gradient-to-b from-black to-purple-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-20 text-center">
            Was du als Founder bekommst
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "2% Ownership der ersten Brand",
              "Stimmrecht bei allen wichtigen Entscheidungen",
              "Gewinnbeteiligung – echter Cash, kein Spielgeld",
              "Insider-Access zum kompletten Produktionsprozess",
              "Community von 49 anderen Mitgründern",
              "Transparenz – alle Zahlen, alle Kosten, alles offen"
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all border border-white/10"
              >
                <CheckCircle2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <p className="text-lg font-medium">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Deal */}
      <section className="py-32 bg-gradient-to-b from-purple-950/20 to-black">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-black mb-12 text-center">
            Der Deal
            <br />
            <span className="text-2xl text-gray-400">(schwarz auf weiß)</span>
          </h2>

          <div className="bg-gradient-to-br from-red-900/40 to-slate-900/40 border-2 border-red-600/50 rounded-3xl p-12">
            <div className="space-y-6 text-xl">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-gray-400">Dein Investment:</span>
                <span className="font-black text-2xl text-red-600">500€ einmalig</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-gray-400">Dein Anteil:</span>
                <span className="font-black text-2xl">2% der ersten Brand</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-gray-400">Gewinn-Split:</span>
                <span className="font-black text-2xl">50/50</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-gray-400">Zeitrahmen:</span>
                <span className="font-black text-2xl">3-6 Monate</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-gray-400">Risiko:</span>
                <span className="font-black text-2xl text-red-400">Max. 500€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Upside:</span>
                <span className="font-black text-2xl text-green-400">Unbegrenzt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="join" className="py-32 bg-gradient-to-b from-black to-orange-950/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            Die ersten 50
          </h2>
          <p className="text-3xl font-bold mb-12 text-red-600">
            Nur 50 Plätze. Wenn voll, dann voll.
          </p>

          <div className="bg-black/50 backdrop-blur-sm border border-red-600/50 rounded-3xl p-12 mb-12">
            <p className="text-2xl mb-8 font-bold">Frühe Founders bekommen:</p>
            <div className="space-y-4 text-lg text-gray-300">
              <p>✨ Niedrigere Nummer (#001-050)</p>
              <p>🎯 Vorzug bei zukünftigen Brands</p>
              <p>👑 Founder-Status für immer</p>
            </div>
          </div>

          {/* Tally Form Embed */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <h3 className="text-3xl font-black mb-8">Ready?</h3>
            <p className="text-xl text-gray-400 mb-8">
              Die nächste Brand gehört nicht einem CEO.<br />
              Sie gehört 50 Menschen die den Mut hatten, zusammen anzufangen.<br />
              <span className="text-white font-bold text-2xl">Bist du einer davon?</span>
            </p>

            {/* Replace with your actual Tally form embed */}
            <div className="min-h-[600px] bg-white/10 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 mb-4">Tally Form Embed hier einfügen:</p>
                <code className="text-sm text-red-600 bg-black/50 px-4 py-2 rounded">
                  {`<iframe src="your-tally-form-url" width="100%" height="500"></iframe>`}
                </code>
                <div className="mt-8">
                  <a
                    href="https://tally.so"
                    target="_blank"
                    className="bg-gradient-to-r from-red-600 to-slate-800 text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-all inline-block"
                  >
                    Zur Bewerbung →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <p className="text-2xl font-black mb-2 bg-gradient-to-r from-red-600 to-slate-400 bg-clip-text text-transparent">
                THE FORGE
              </p>
              <p className="text-gray-400 mb-4">Where Brands Are Born Together</p>
              <p className="text-sm text-gray-500">
                50 Founders. Eine Mission. Echte Brands.
              </p>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-bold mb-4">Rechtliches</h3>
              <div className="flex flex-col gap-2">
                <Link href="/legal/impressum" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Impressum
                </Link>
                <Link href="/legal/datenschutz" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Datenschutz
                </Link>
                <Link href="/legal/agb" className="text-gray-400 hover:text-white transition-colors text-sm">
                  AGB
                </Link>
                <Link href="/legal/vertrag" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Founder-Vertrag
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link href="/transparency" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Transparency Dashboard
                </Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Founder Dashboard
                </Link>
                <a href="mailto:info@theforge.community" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Kontakt
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2026 THE FORGE Community Brand Factory. Made with ❤️ by 50 Founders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
