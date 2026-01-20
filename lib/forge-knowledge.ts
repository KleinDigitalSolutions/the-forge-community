/**
 * THE FORGE - Central Knowledge Base
 * This file contains the definitive information about the Forge system modules.
 * Inject this into AI system prompts to ensure consistent and accurate knowledge.
 */

export const FORGE_SYSTEM_KNOWLEDGE = {
  name: "THE FORGE - Community Venture Studio",
  philosophy: "Viele Founder. 1 Brand. Volle Transparenz. Wir bündeln Kapital und Skills, während die Execution im Forge-Hub zentralisiert wird.",
  
  modules: [
    {
      id: "01",
      name: "Admin Shield",
      description: "Rechtssichere Verträge & Compliance",
      action: "AUTO-GENERIERUNG",
      status: "ACTIVE",
      details: "Automatische Erstellung von NDAs, Service Agreements und Gründerverträgen. Spart bis zu 90% der Anwaltskosten."
    },
    {
      id: "02",
      name: "Market Radar",
      description: "Konkurrenz-Analyse & Ad-Scanning",
      action: "24/7 WATCHTOWER",
      status: "SCANNING",
      details: "Überwacht Wettbewerber, scannt Werbeanzeigen und erkennt Trends in Echtzeit, um den Product-Market-Fit zu sichern."
    },
    {
      id: "03",
      name: "Supply Chain Command",
      description: "Manufaktur-Netzwerk & Sourcing",
      action: "GLOBAL ACCESS",
      status: "CONNECTED",
      details: "Direkter Zugriff auf ein globales Netzwerk von geprüften Lieferanten. Management von Mustern (Samples) und Produktionsaufträgen."
    },
    {
      id: "04",
      name: "Commerce Engine",
      description: "Shop-Deployment & Infrastructure",
      action: "VERCEL/STRIPE",
      status: "READY",
      details: "Zentralisiertes Tech-Setup mit Vercel für Hosting und Stripe für Zahlungsabwicklung. Schnelles Deployment von E-Commerce Brands."
    },
    {
      id: "05",
      name: "Logistics Grid",
      description: "Fulfillment & Lager-Buchung",
      action: "PAY-PER-USE",
      status: "STANDBY",
      details: "Anbindung an 3PL-Provider für Lagerung und Versand. Skalierbare Logistik ohne Fixkosten."
    }
  ],

  legalStructure: {
    model: "Slicing Pie (Fair Equity)",
    explanation: "Anteile werden basierend auf dem realen Beitrag (Zeit, Kapital, Know-how) verteilt, um maximale Fairness zu garantieren."
  },

  membershipTiers: [
    { name: "Starter (Founder)", price: "69€/Monat", focus: "Zutritt zur Schmiede & Netzwerk" },
    { name: "Growth", price: "99€/Monat", focus: "Erweiterte AI-Features & Support" },
    { name: "Premium (Enterprise)", price: "149€/Monat", focus: "Volle Skalierung & Priority Execution" }
  ]
};

/**
 * Helper to format the knowledge for an AI system prompt
 */
export function getForgePromptContext() {
  const modulesStr = FORGE_SYSTEM_KNOWLEDGE.modules
    .map(m => `#${m.id} ${m.name}: ${m.description} (${m.details}) - Status: ${m.status}`)
    .join('\n');

  return `
WISSENSBASIS "THE FORGE":
${FORGE_SYSTEM_KNOWLEDGE.philosophy}

CORE MODULES (SYSTEM_MODULES.CONFIG):
${modulesStr}

RECHTLICHE STRUKTUR:
${FORGE_SYSTEM_KNOWLEDGE.legalStructure.model}: ${FORGE_SYSTEM_KNOWLEDGE.legalStructure.explanation}

MITGLIEDSCHAFTEN:
${FORGE_SYSTEM_KNOWLEDGE.membershipTiers.map(t => `- ${t.name}: ${t.price} (${t.focus})`).join('\n')}
`;
}
