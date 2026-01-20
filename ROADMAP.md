# 🚀 THE FORGE - Entwicklungs-Roadmap

> **Stand:** 20. Januar 2025
> **Weekly API Uses:** 98 / 1000 verbraucht (2% remaining)

---

## ✅ FERTIGGESTELLT (100%)

### 1. Brand DNA Studio
**Status:** 🟢 Vollständig funktionsfähig

**Features:**
- ✅ Markenidentität-Editor (Name, Slogan, Mission, Vision)
- ✅ Stimme & Ton (Tonfall, Persönlichkeitsmerkmale, Schreibstil)
- ✅ Zielgruppen-Definition (Alter, Standort, Persona)
- ✅ Produkt/Service-Merkmale
- ✅ KI-Kontext & Anweisungen für Content-Generierung
- ✅ Speichern & Laden via API (`/api/ventures/[id]/brand-dna`)
- ✅ Vollständig auf Deutsch übersetzt

**Technische Details:**
- Prisma-Modell: `BrandDNA` (1:1 mit `Venture`)
- Route: `/forge/[ventureId]/brand`
- API: `GET/PUT /api/ventures/[id]/brand-dna`

---

### 2. Legal Studio (Vertragsmanagement)
**Status:** 🟢 Vollständig funktionsfähig

**Features:**
- ✅ Template-Auswahl (NDA, Service Agreement, Employment, Supply Agreement, Freelance)
- ✅ KI-gestützter Vertragsgenerator
- ✅ Formular mit Partnerinformationen & Vertragsbedingungen
- ✅ PDF/DOCX Export
- ✅ Dokumenten-Dashboard mit Stats (Total, Drafts, Signed)
- ✅ Recent Documents Liste
- ✅ Status-Tracking (DRAFT, REVIEW, SENT, SIGNED, ARCHIVED, REJECTED)

**Technische Details:**
- Prisma-Modell: `LegalDocument`
- Routes:
  - `/forge/[ventureId]/legal` (Übersicht)
  - `/forge/[ventureId]/legal/contracts/new` (Generator)
- API: `/api/ventures/[id]/legal/generate`
- Templates: `types/legal.ts` → `LEGAL_DOCUMENT_TEMPLATES`

---

## 🚧 COMING SOON (In Entwicklung)

### 3. Marketing Studio (KI-Kampagnen)
**Status:** 🔴 Coming Soon
**Priorität:** 🔥 Hoch

**Route:** `/forge/[ventureId]/marketing`

**Geplante Features:**
- [ ] **Content-Generator**
  - Social Media Posts (Instagram, LinkedIn, Twitter/X)
  - Blog-Artikel & SEO-Texte
  - E-Mail-Kampagnen
  - Ad Copy (Google Ads, Meta Ads)
  - Verwendung von Brand DNA als Kontext

- [ ] **Kampagnen-Manager**
  - Kampagnen erstellen & planen
  - Multi-Channel Publishing
  - Performance-Tracking (Impressions, Clicks, Conversions)

- [ ] **Content-Kalender**
  - Redaktionsplanung
  - Automatische Posting-Vorschläge
  - Integrationen (Meta, LinkedIn API)

- [ ] **Analytics Dashboard**
  - Engagement-Metriken
  - ROI-Berechnung
  - A/B-Testing Ergebnisse

**Technische Anforderungen:**
- Neue Prisma-Modelle: `MarketingCampaign`, `ContentPost`
- API-Integration: Meta Graph API, LinkedIn API
- AI-Service: Gemini Flash 2.0 für Content-Generierung
- Storage: Vercel Blob für Media-Assets

---

### 4. Sourcing Studio (Lieferanten & Produktion)
**Status:** 🔴 Coming Soon
**Priorität:** 🔥 Hoch

**Route:** `/forge/[ventureId]/sourcing`

**Geplante Features:**
- [ ] **Supplier Database**
  - Lieferanten-Verzeichnis mit Suchfiltern
  - Kategorien (Material, Produktion, Verpackung, Logistik)
  - Bewertungssystem & Reviews
  - Kontaktmanagement

- [ ] **Sample Tracking**
  - Musterbestellungen verwalten
  - Status-Tracking (Ordered, In Transit, Received, Approved)
  - Qualitätsbewertungen & Notizen
  - Kostenübersicht

- [ ] **Production Orders**
  - Bestellungen erstellen & verfolgen
  - MOQ (Minimum Order Quantity) Management
  - Lead Time Tracking
  - Zahlungsstatus & Invoices

- [ ] **Supplier Communication Hub**
  - E-Mail-Integration
  - Document Sharing (NDAs, Specs, Drawings)
  - Price Negotiation History

**Technische Anforderungen:**
- Neue Prisma-Modelle: `Supplier`, `Sample`, `ProductionOrder`
- File Upload: Vercel Blob für Specs & Verträge
- API: `/api/ventures/[id]/sourcing/*`

---

### 5. Admin Studio (Budget, Team, Settings)
**Status:** 🔴 Coming Soon
**Priorität:** 🟡 Mittel

**Route:** `/forge/[ventureId]/admin`

**Geplante Features:**
- [ ] **Budget Manager**
  - Budget-Kategorien (Marketing, Production, Operations)
  - Ausgaben-Tracking
  - Burn Rate & Runway Calculation
  - Monatliche Reports

- [ ] **Team Management**
  - Squad-Mitglieder verwalten
  - Rollen & Berechtigungen (Owner, Lead, Member)
  - Equity-Verteilung
  - Activity Log

- [ ] **Venture Settings**
  - Grundinformationen bearbeiten
  - Launch Timeline anpassen
  - Archivierung & Löschung

- [ ] **Integrations**
  - Stripe Connect Onboarding
  - Payment Settings
  - API Keys Management

**Technische Anforderungen:**
- Erweiterte Prisma-Modelle: `VentureBudget`, `Expense`
- Stripe Connect Integration (bereits vorbereitet)
- Permissions-System basierend auf `SquadMember.role`

---

## 📋 BACKLOG (Niedrige Priorität)

### 6. Analytics & Reporting
- Dashboard mit KPIs (Revenue, Costs, Profit)
- Custom Reports exportieren
- Forecasting mit AI

### 7. Collaboration Features
- Kommentare & Feedback-System
- Task Assignments innerhalb der Studios
- Notifications & Activity Feed

### 8. Mobile App
- React Native App (iOS + Android)
- Mobile-optimierte Studios
- Push Notifications

### 9. API für Drittanbieter
- Public API für Partner-Integrationen
- Webhooks
- OAuth 2.0 Authentication

---

## 🛠️ TECHNISCHE SCHULDEN & AUFRÄUMARBEITEN

### Zu löschen (veraltet/unnötig):
- [ ] `app/page_old.tsx` (alte Landing Page)
- [ ] `find-ids.js` (Debug-Script)
- [ ] `push-to-vercel-full.js` (manuelles Deploy-Script)
- [ ] `add-vercel-env.sh` / `cleanup-vercel-env.sh` (nicht mehr nötig)
- [ ] `.env.production`, `.env.vercel` (Duplikate, Vercel nutzt Dashboard)
- [ ] Alte `.DS_Store` Dateien

### Zu vereinfachen:
- [ ] README.md erstellen (fokussiert auf Quick Start)
- [ ] CLAUDE.md vereinfachen (zu lang, wichtigste Punkte extrahieren)
- [ ] Migrations-Dateien dokumentieren (aktuell nur SQL, keine Beschreibung)

---

## 🎯 NÄCHSTE SCHRITTE (Empfehlung)

### Phase 1: Marketing Studio (Woche 1-2)
1. Content-Generator implementieren
2. Social Media Templates erstellen
3. Brand DNA Integration testen
4. UI/UX Design finalisieren

### Phase 2: Sourcing Studio (Woche 3-4)
1. Supplier Database aufbauen
2. Sample Tracking implementieren
3. Production Orders entwickeln
4. File Upload für Specs

### Phase 3: Admin Studio (Woche 5)
1. Budget Manager implementieren
2. Team Management UI
3. Settings-Seite

### Phase 4: Polish & Testing (Woche 6)
1. Bug-Fixing
2. Performance-Optimierung
3. Übersetzungen vervollständigen
4. User Testing

---

## 📊 RESSOURCEN-STATUS

### API Limits (Weekly)
- **Gemini Flash 2.0:** 15 req/min (Free Tier)
- **Groq Llama 3.3:** 30 req/min (Free Tier)
- **Vercel:** 1000 Serverless Function Executions (Hobby Plan)

### Storage
- **Vercel Blob:** 100 MB (Hobby Plan)
- **Postgres:** 512 MB (Vercel Postgres Starter)

### Skalierungsbedarf (bei hoher Auslastung):
- Upgrade auf Gemini Pro (60 req/min)
- Vercel Pro Plan ($20/mo, 100k Functions)
- Postgres-Upgrade (2 GB, $10/mo)

---

## 🤝 BEITRAGEN

Dieses Projekt wird von [info@kleindigitalsolutions.de](mailto:info@kleindigitalsolutions.de) entwickelt.

**Feedback & Feature-Requests:**
Bitte per E-Mail oder direkt im Code-Review.

---

**Letzte Aktualisierung:** 20. Januar 2025, 10:30 Uhr
