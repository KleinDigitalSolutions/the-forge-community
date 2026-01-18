# THE FORGE - Community OS

Dieses Projekt ist das digitale Betriebssystem für **The Forge**, eine exklusive Gründer-Community. Es verbindet administrative Kontrolle (Notion) mit einer hochperformanten Web-Plattform (Next.js).

## 🚀 Technologie-Stack

- **Frontend:** Next.js 15+ (App Router), Tailwind CSS, Framer Motion.
- **Backend:** Next.js API Routes.
- **Datenbank (Hybrid):** 
  - **Notion:** "Source of Truth" für Mitgliederlisten, Finanzen und Administration.
  - **Vercel Postgres:** Schneller Speicher für App-Interaktionen (Profile, Foren-Votes, Sessions).
- **Authentifizierung:** NextAuth mit Magic Links (Resend).
- **Storage:** Vercel Blob für Bilduploads im Forum.

## 🛠 Aktueller Funktionsumfang

### 1. Reddit-style Forum (`/forum`)
- **Echte Identität:** Posts sind fest an den Founder-Account gekoppelt (u/name #id).
- **Pro-Features:** Markdown-Support, Bilduploads (Vercel Blob), Threaded Comments (eingerückt).
- **Interaktion:** Reddit-style Upvote/Downvote System & Karma-Anzeige pro User.
- **AI-Bot:** Automatisierte Erst-Antworten durch Forge AI (Groq/Llama 3).

### 2. Founder Dossier (`/profile`)
- **Daten-Erfassung:** Rechtlicher Name, Geburtstag, Adresse, Telefon (WA/Signal).
- **Skill-Matrix:** Erfassung von Expertise (Tech, Sales, etc.) für späteres Squad-Matching.
- **Hybrid-Sync:** Daten werden in Postgres gespeichert und automatisch in Notion gespiegelt.

### 3. Admin & Gatekeeping
- **Login-Sperre:** Nur Emails, die in der Notion "Founders" Datenbank stehen, erhalten einen Login-Link.
- **Database Migration:** `/api/admin/migrate-db` initialisiert das Postgres-Schema für Profil-Erweiterungen.

## 📡 Wichtige Datenbank-IDs (Notion)
*Siehe `.env.local` für die UUIDs.*
- `NOTION_DATABASE_ID`: Haupt-Mitgliederliste (Founders).
- `NOTION_FORUM_DATABASE_ID`: Forum-Inhalte.
- `NOTION_TRANSACTIONS_DATABASE_ID`: Finanzdaten.

## ⚠️ Bekannte "Special Fixes" (Wichtig für neue Sessions!)
- **Notion SDK Bug:** In der aktuell installierten Version liegen `query` Funktionen oft unter `dataSources` statt `databases`. In `lib/notion.ts` gibt es dafür die `performQuery` Wrapper-Funktion. **Immer diese nutzen!**
- **UUID Validation:** Alle IDs aus `.env` werden mit `.trim()` bereinigt, um Zeilenumbruch-Fehler bei Notion zu vermeiden.

## 📋 Nächste Schritte
- [ ] **Squad Matching:** Automatisches Gruppieren von Foundern basierend auf ihren Skills.
- [ ] **Finanz-Dashboard:** Visualisierung der Notion-Transaktionsdaten mit Recharts.
- [ ] **Echtes Karma:** Persistentes Speichern des Nutzer-Karmas in Postgres.

---
*Dokumentiert am 18. Januar 2026*