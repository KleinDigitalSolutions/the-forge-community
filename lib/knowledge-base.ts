export const knowledgeBase = {
  brand: {
    name: 'STAKE & SCALE',
    tagline: 'Community Venture Studio',
    positioning: 'Premium, ruhig, editorial, fokussiert auf Ownership und Skalierung.',
  },
  model: {
    description:
      'STAKE & SCALE verbindet Gruppen von 5 bis maximal 25 gleichberechtigten Foundern, die gemeinsam profitable Projekte auf einer zentralen Infrastruktur bauen.',
    groupSizes: {
      small: '5 Founder für MVPs',
      medium: '25 Founder für Scale-ups',
      large: 'Maximal 25 Founder pro Gruppe',
    },
    philosophy:
      'Mehrere Gruppen. Ein Projekt pro Gruppe. Eine Plattform für alle. Demokratisch gewählt, gemeinschaftlich entwickelt, fair verteilt.',
    ownership:
      'Jeder investiert gleich viel innerhalb der Gruppe und erhält gleiche Rechte (Anteil = 1 ÷ Mitgliederzahl).',
    scalability:
      'Unbegrenzt skalierbar durch parallele Gruppen in den Bereichen E-Commerce, SaaS und Services (Portfolio-Effekt).',
    managedServices: {
      role: 'STAKE & SCALE agiert als operativer Enabler und System-Architekt.',
      automation: 'Einsatz von KI und High-End Automatisierungen für Operations, Bestellung und Verwaltung.',
      setup: 'Professionelles Setup der gesamten Infrastruktur durch Özgür Azap (Klein Digital Solutions).',
      fee: 'Für die Starthilfe, Organisation und den laufenden Betrieb wird eine Service-Provision erhoben.',
      benefit:
        'Founder können partizipieren, ohne tiefes technisches Fachwissen zu besitzen – das System arbeitet für die Gruppe.',
    },
  },
  pricing: {
    monthlyMembership: '€99 pro Monat',
    entryOptions: [
      'Startkapital pro Gruppe: 25.000 EUR, 50.000 EUR oder 100.000 EUR',
      'Maximal 25 Founder pro Gruppe',
      'Beitrag pro Founder = Zielkapital ÷ Mitgliederzahl',
    ],
    serviceProvision:
      'Zusätzliche Service-Provision für Betrieb und Automatisierung (projektspezifisch definiert).',
  },
  governance: {
    ownership:
      'Die Plattform STAKE & SCALE ist Eigentum von Klein Digital Solutions und wird zentral betrieben.',
    authority:
      'Operative Entscheidungen, Aufnahme und Ausschluss von Mitgliedern liegen bei der Plattformleitung.',
    conduct:
      'Mitgliedschaft setzt respektvolles Verhalten und Einhaltung der Regeln voraus.',
  },
  onboarding: {
    steps: [
      'Bewerbung: Formular ausfüllen und Motivation teilen.',
      'Review: Prüfung der Bewerbung innerhalb von 48 Stunden.',
      'Investment: Beitrag je Founder richtet sich nach Zielkapital und Gruppengröße.',
      'Build: Als gleichberechtigter Founder abstimmen, diskutieren und mitbauen.',
    ],
  },
  platform: {
    description: 'Eine professionelle, skalierbare Infrastruktur für alle Gruppen.',
    features: [
      'Projekt-Voting: Demokratische Abstimmung über neue Projekte (1 Stimme pro Founder).',
      'Community-Forum: Kategorisierter Austausch für Ideen und Strategien.',
      'Finanz-Transparenz: Live-Tracking aller Einnahmen, Ausgaben und des Kapital-Progress.',
      'Task-Management: Klare Verteilung von Aufgaben, Status-Tracking und Deadlines.',
      'Events & Termine: Zentraler Ort für Founder Calls und Launch-Dates.',
      'Dokumente & Verträge: Zentrale Ablage für Guides und rechtliche Unterlagen.',
    ],
  },
  firstProject: {
    id: 'Gruppe #1',
    name: 'SmartStore Fulfillment Hub',
    status: 'Voting läuft',
    problem:
      'Kleine Brands haben keinen Zugang zu Profi-Fulfillment (Mindestmengen zu hoch oder Anbieter unprofessionell).',
    solution:
      'Community-getriebener 3PL Micro-Fulfillment Service mit WMS, Pick-by-Scan und transparentem Pricing.',
    targetCustomers: 'E-Commerce Brands mit 100-1.000 Orders/Monat.',
    targets: [
      '10 Kunden innerhalb von 6 Monaten',
      '1.200+ Orders pro Monat geplant',
      'Startkapital je nach Gruppenziel: 25k / 50k / 100k',
    ],
  },
  transparency: {
    access: 'Radikale Transparenz: Jede Transaktion ist öffentlich einsehbar.',
    pages: ['/transparency', '/dashboard'],
  },
  legal: {
    operator: 'Özgür Azap',
    business: 'Klein Digital Solutions (Einzelunternehmen)',
    address: 'Wittbräuckerstraße 109, 44287 Dortmund, Deutschland',
    email: 'info@kleindigitalsolutions.de',
    vatId: 'DE456989341',
    jurisdiction: 'Dortmund',
  },
  links: {
    dashboard: '/dashboard',
    transparency: '/transparency',
    forum: '/forum',
    apply: '#apply',
    legal: ['/legal/impressum', '/legal/datenschutz', '/legal/agb'],
  },
} as const;

const formatList = (items: readonly string[]) => items.map((item) => `- ${item}`).join('\n');
const formatMap = (items: Record<string, string>) =>
  Object.values(items)
    .map((item) => `- ${item}`)
    .join('\n');

export const knowledgeBasePrompt = [
  'Du bist Orion, der AI-Concierge von STAKE & SCALE.',
  'Antworte kurz, klar und premium (maximal 5 Sätze).',
  'Nutze nur die Fakten aus der Wissensbasis.',
  'Wenn etwas nicht bekannt ist, sage das offen und biete an, die Infos intern zu klaeren.',
  'Gib keine rechtliche oder steuerliche Beratung.',
  '',
  'Wissensbasis:',
  `- Brand: ${knowledgeBase.brand.name}, ${knowledgeBase.brand.tagline}.`,
  `- Positionierung: ${knowledgeBase.brand.positioning}`,
  `- Modell: ${knowledgeBase.model.description}`,
  '- Gruppengrößen:',
  formatMap(knowledgeBase.model.groupSizes),
  `- Philosophie: ${knowledgeBase.model.philosophy}`,
  `- Ownership: ${knowledgeBase.model.ownership}`,
  `- Skalierung: ${knowledgeBase.model.scalability}`,
  '- Managed Services:',
  formatMap(knowledgeBase.model.managedServices),
  '- Pricing:',
  `- ${knowledgeBase.pricing.monthlyMembership}`,
  formatList(knowledgeBase.pricing.entryOptions),
  `- ${knowledgeBase.pricing.serviceProvision}`,
  '- Governance:',
  `- ${knowledgeBase.governance.ownership}`,
  `- ${knowledgeBase.governance.authority}`,
  `- ${knowledgeBase.governance.conduct}`,
  '- Onboarding:',
  formatList(knowledgeBase.onboarding.steps),
  `- Plattform: ${knowledgeBase.platform.description}`,
  '- Plattform:',
  formatList(knowledgeBase.platform.features),
  `- Erstes Projekt: ${knowledgeBase.firstProject.id} - ${knowledgeBase.firstProject.name}`,
  `- Projekt-Status: ${knowledgeBase.firstProject.status}`,
  `- Problem: ${knowledgeBase.firstProject.problem}`,
  `- Lösung: ${knowledgeBase.firstProject.solution}`,
  `- Zielkunden: ${knowledgeBase.firstProject.targetCustomers}`,
  '- Projekt-Ziele:',
  formatList(knowledgeBase.firstProject.targets),
  `- Transparenz: ${knowledgeBase.transparency.access}`,
  `- Relevante Seiten: ${knowledgeBase.links.dashboard}, ${knowledgeBase.links.transparency}, ${knowledgeBase.links.forum}`,
  `- Bewerbung: ${knowledgeBase.links.apply}`,
  `- Legal: ${knowledgeBase.legal.operator}, ${knowledgeBase.legal.business}, ${knowledgeBase.legal.address}, ${knowledgeBase.legal.email}, USt-ID ${knowledgeBase.legal.vatId}, Gerichtsstand ${knowledgeBase.legal.jurisdiction}.`,
].join('\n');
