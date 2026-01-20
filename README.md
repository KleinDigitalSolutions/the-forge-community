# ⚡ THE FORGE - Community Venture Studio

> **Stake & Scale** – Die Plattform für Solo-Gründer, um gemeinsam Ventures zu bauen.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

---

## 🤖 Context-Aware AI Sidebar

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

## 📦 Tech Stack

| Technologie | Verwendung |
|------------|------------|
| **Next.js 16** | App Router, React Server Components |
| **TypeScript** | Type-safe Code |
| **Prisma 7** | ORM & Database Migrations |
| **PostgreSQL** | Relationele Datenbank mit RLS |
| **NextAuth v5** | Magic Link Authentication |
| **Stripe** | Subscriptions & Connect (Marketplace) |
| **Gemini AI** | Content-Generierung & Chatbot |
| **Tailwind CSS v4** | Styling |
| **Vercel** | Deployment & Serverless Functions |

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
│   │   ├── marketing/        # 🚧 Marketing Studio (Coming Soon)
│   │   ├── sourcing/         # 🚧 Sourcing Studio (Coming Soon)
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

# AI
GEMINI_API_KEY="xxx"                 # Google AI Studio
GROQ_API_KEY="xxx"                   # Groq (Optional, Fallback)

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"

# Admin
ADMIN_EMAIL="admin@example.com"

# Notion (Legacy, nur für Auth)
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

- **Brand DNA Studio** – KI-Kontext für Content-Generierung konfigurieren
- **Legal Studio** – Verträge mit KI generieren (NDA, Service Agreement, etc.)
- **Venture Wizard** – Guided Setup für neue Ventures
- **Squad Marketplace** – Teams finden und beitreten
- **AI Chatbot** – Integrierter Advisor mit Marken-Kontext

### 🚧 In Entwicklung (siehe [ROADMAP.md](ROADMAP.md))

- **Marketing Studio** – Social Media, Blog-Posts, Kampagnen
- **Sourcing Studio** – Lieferanten-Datenbank, Sample-Tracking
- **Admin Studio** – Budget-Management, Team-Verwaltung

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
