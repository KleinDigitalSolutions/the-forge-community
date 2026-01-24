# ⚡ THE FORGE - Community Venture Studio

> **Stake & Scale** – Das KI-gestützte SaaS-Betriebssystem für Solo-Gründer, um gemeinsam skalierbare Ventures zu bauen.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

---

## 🚀 SaaS & Growth Modell (TikTok-Ready)

The Forge nutzt ein **Product-Led Growth** Modell für maximale Konvertierung von Social-Media-Traffic:

*   **Open Access:** Jeder kann sich per Magic Link (Email) sofort registrieren.
*   **Energy System (AI Credits):** Neue User starten mit **50 Credits** (⚡️), um das System unentgeltlich zu testen.
*   **Freemium:** Core-Workflows (Venture Creation, Brand DNA, Roadmap) sind gratis. AI-gestützte Features (Content Generation, Legal Drafting) kosten Credits.

---

## 🧾 Bisher programmiert

### Heute

*   **AI Sourcing (DB-only):** "AI Discovery" liefert jetzt nur echte Treffer aus der `Resource`-Datenbank inklusive Matching-Erklaerung.
*   **Sourcing Match UI:** Modaltexte angepasst (DB-Matching statt Gemini-Halluzinationen).
*   **AI Communication Page:** Neue `/communication` Seite als zentrale Chat-UI (Gemini aktiv, eigene API disabled).
*   **UI Sound FX:** GTA-Menu-Sound bei Forum-Post und Message-Send (nur bei Erfolg).
*   **Static Asset:** Sound liegt jetzt unter `public/audio/gta-menu.mp3`.
*   **Account Settings:** Neue `/settings`‑Seite mit Notification‑Prefs, Privacy‑Prefs und sofortiger Account‑Löschung (mit Sicherheitsarchiv).
*   **Deletion Flow:** `AccountStatus` + Tombstone/Anonymisierung, Sign‑In Lockout, Retention in `UserDeletion`.
*   **DM‑Moderation:** Nachrichten werden wie Forum‑Posts moderiert (Toxicity‑Check + Warnung), Fehler wird im UI gezeigt.
*   **Privacy Controls:** Profil‑Sichtbarkeit und Follower‑Counts serverseitig enforced.
*   **Forum Mobile Revamp:** Reddit‑like Card‑Style, kompakte Actions, fixes für Editor‑Modal, Emoji‑Picker und Toolbar‑Breiten.
*   **Mobile Navigation:** Header/Tab‑Bar, Account‑Eintrag im Hamburger‑Menü, Hub‑Badge entfernt.

---

## 🤖 Context-Aware AI Sidebar
... (bestehender Teil) ...

The Forge includes a persistent AI assistant that adapts to what the user is currently doing.

### How to use it for future features:
To add AI support to any new page or modal, simply:

1. **Import the Context**:
   ```tsx
   import { useAIContext } from '@/app/context/AIContext';
   ```

2. **Set the Context**:
   Inside your component or modal, use a `useEffect` to update the AI's focus:
   ```tsx
   const { setContext } = useAIContext();

   useEffect(() => {
     setContext("Erstelle gerade ein Sourcing-Sample. Hilf dem User bei Qualitätsmerkmalen.");
     
     // Optional: reset when leaving
     return () => setContext("Forge Dashboard");
   }, []);
   ```

3. **Profit**:
   The AI Sidebar will instantly adapt to that new context and provide relevant advice based on the user's current page and your description. 🚀


### Voraussetzungen
- Node.js 18+ & npm
- PostgreSQL-Datenbank (empfohlen: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres))
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### Installation

```bash
# Repository klonen
git clone <repo-url>
cd the-forge-community

# Dependencies installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env.local
# .env.local mit deinen Credentials befüllen

# Datenbank-Schema anwenden
npx prisma generate
npx prisma db push

# Development Server starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

---

## 🏗️ Core Engine & Professional Architecture (Updated Jan 2026)

Das Projekt wurde auf eine professionelle **Multi-Tenant Architektur** für skalierbare Venture-Entwicklung gehoben:

### 1. Venture Phase Engine (Automatisierter Workflow)
*   **Logik:** Ein zentraler Service (`lib/ventures.ts`) steuert den Fortschritt über 6 Phasen (Ideation → Branding → Legal → Sourcing → Marketing → Launch).
*   **Trigger:** Jede Aktion in den Studios (z.B. Brand DNA Speicherung, Lieferant-Übernahme) triggert automatisch eine Neuberechnung des Projektstatus.
*   **Personalisiert:** Fortschritt und Berechtigungen sind strikt an `ownerId` oder `squadId` gekoppelt.

### 2. AI Sourcing Agent (Enterprise Level)
*   **Discovery:** Neuer "AI Discovery" Button im Sourcing Studio.
*   **Kontext:** Nutzt die **Brand DNA** (Kategorie, Zielmarkt, Werte), um per Gemini Flash 2.0 gezielt Lieferanten weltweit zu identifizieren.
*   **UX:** Modulares UI-Modal zur Prüfung und selektiven Übernahme von KI-Vorschlägen in die Datenbank.

### 3. Squad Safe (Financial Transparency)
*   **Wallet:** Integriertes `SquadWallet` System für jede Gruppe.
*   **Transparency:** Neues Dashboard zeigt Budget-Verteilung (Samples, Produktion, Marketing) und eine lückenlose Transaktionshistorie mit Klarnamen der Ersteller.
*   **Stripe Ready:** Vorbereitet für Einzahlungen direkt auf Squad-Connected-Accounts.

### 4. Technical Excellence
*   **Prisma 7 Migration:** Schema bereinigt, `DATABASE_URL` Management über `prisma.config.ts` (Next-Gen Standard).
*   **TypeScript Mastery:** Vollständige Umstellung auf CamelCase, typsichere API-Routen über Prisma-Relationen statt SQL.
*   **Stability:** Build-geprüfte Codebase mit robusten Error-Boundaries und expliziten Interfaces.

---

## 📦 Tech Stack

| Technologie | Verwendung |
|------------|------------|
| **Next.js 16** | App Router, React Server Components |
| **TypeScript** | Type-safe Code |
| **Prisma 7** | ORM & Database Migrations |
| **PostgreSQL** | Relationale Datenbank mit RLS |
| **NextAuth v5** | Open Magic Link Registration |
| **Energy System** | Custom AI Credit Management |
| **Stripe** | Subscriptions & Connect (Marketplace) |
| **Gemini AI** | Content-Generierung & Chatbot |
| **Tailwind CSS v4** | Styling |
| **Vercel** | Deployment & Serverless Functions |
| **date-fns** | Date formatting (Locale de) |

---

## 🏗️ Projektstruktur

```
the-forge-community/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   ├── components/           # React Components
│   ├── forge/[ventureId]/    # Venture Workspace (The Forge)
│   │   ├── brand/            # ✅ Brand DNA Studio
│   │   ├── legal/            # ✅ Legal Studio (Contracts)
│   │   ├── marketing/        # ✅ Marketing Studio (AI-Campaigns)
│   │   ├── sourcing/         # ✅ Sourcing Studio (Suppliers/Samples)
│   │   ├── decisions/        # ✅ Decision Hall (Voting)
│   │   └── admin/            # 🚧 Admin Studio (Coming Soon)
│   ├── ventures/             # Venture Management
│   └── squads/               # Squad Marketplace
├── lib/                      # Shared Utilities
│   ├── prisma.ts             # Database Client
│   ├── ai.ts                 # AI Service (Gemini/Groq)
│   └── stripe.ts             # Stripe Integration
├── prisma/                   # Database Schema
├── migrations/               # SQL Migrations (Manual)
├── types/                    # TypeScript Definitions
└── public/                   # Static Assets
```

---

## 🔑 Umgebungsvariablen

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Auth (NextAuth v5)
AUTH_SECRET="xxx"                    # Generieren: npx auth secret
AUTH_RESEND_KEY="re_xxx"             # Resend.com API Key
AUTH_URL="http://localhost:3000"

# AI & SaaS
GEMINI_API_KEY="xxx"                 # Google AI Studio
GROQ_API_KEY="xxx"                   # Groq (Optional, Fallback)
INITIAL_CREDITS=50                   # Startguthaben für neue User

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"

# Admin
ADMIN_EMAIL="admin@example.com"

# Notion (Legacy)
NOTION_API_KEY="secret_xxx"
NOTION_DATABASE_ID="xxx"
```

---

## 📖 Wichtige Kommandos

```bash
# Development
npm run dev              # Dev Server starten (Port 3000)
npm run build            # Production Build
npm start                # Production Server

# Datenbank
npx prisma generate      # Prisma Client generieren (nach Schema-Änderungen)
npx prisma db push       # Schema-Änderungen pushen (Development)
npx prisma studio        # GUI für Datenbank

# Deployment
vercel                   # Deployment auf Vercel
```

---

## 🎯 Features-Übersicht

### ✅ Fertiggestellt

- **Founder-Cockpit (Dashboard)** – Dynamische Übersicht der eigenen Ventures & Onboarding.
- **Decision Hall** – Professionelles Voting-System für demokratische Squad-Entscheidungen.
- **Brand DNA Studio** – KI-Kontext für konsistente Markenidentität.
- **Marketing Studio** – KI-Generierung für Instagram, LinkedIn, Ads & E-Mail.
- **Sourcing Studio** – Management von Lieferanten, Musterbestellungen und POs.
- **Legal Studio** – Verträge mit KI generieren (NDA, Service Agreement, etc.).
- **Venture Wizard** – Schritt-für-Schritt Setup für neue Business-Ideen.
- **Roadmap Voting** – Upvote-System für Community-Feature-Wünsche.

### 🚧 In Entwicklung (siehe [ROADMAP.md](ROADMAP.md))

- **Admin Studio** – Budget-Management, Team-Verwaltung & Squad-Settings.
- **Stripe Connect Payouts** – Automatisierte Auszahlungen für Squad-Umsätze.

---

## 📚 Dokumentation

- **[ROADMAP.md](ROADMAP.md)** – Feature-Planung & Coming Soon Features
- **[CLAUDE.md](CLAUDE.md)** – Ausführliche Entwickler-Dokumentation (für AI-Assistenten)
- **[Migrations](migrations/)** – Manuelle SQL-Migrations (für RLS-Policies)

---

## 🛡️ Sicherheit

### Row-Level Security (RLS)
Das Projekt nutzt PostgreSQL RLS für Multi-Tenant-Datenisolierung.

**Geschützte Tabellen:**
- `User`, `Venture`, `BrandDNA`
- `Squad`, `SquadMember`, `SquadTransaction`
- `VentureTask`, `LegalDocument`

**Access Control:**
- User sehen nur ihre eigenen Ventures
- Squad-Mitglieder sehen Squad-Ventures (bei aktiver Membership)
- Admins bypassen alle Policies

Details: [migrations/004_enable_rls.sql](migrations/004_enable_rls.sql)

---

## 🤝 Support & Kontakt

**Entwicklung:** [info@kleindigitalsolutions.de](mailto:info@kleindigitalsolutions.de)

**Feature-Requests:** Siehe [ROADMAP.md](ROADMAP.md) für geplante Features.

---

## 📄 Lizenz

Proprietary – Alle Rechte vorbehalten.

Dieses Projekt ist nicht Open Source. Verwendung nur mit ausdrücklicher Genehmigung.

---

**Built with ⚡ by Klein Digital Solutions**
