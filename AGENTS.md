# Repository Guidelines

## Projektstruktur & Module
- `app/` – Next.js App Router (Pages, API-Routen unter `app/api`, UI-Komponenten unter `app/components`).
- `lib/` – Services/Utils (Prisma-Client, AI- und Notion-Helper, Moderation).
- `prisma/` – Datenbank-Schema; `migrations/` für SQL-Migrationen.
- `public/` – statische Assets; `scripts/` – Hilfsskripte (Forum-Analyse/Seeding).
- Typen unter `types/`, globale Configs (`next.config.ts`, `eslint.config.mjs`, `tsconfig.json`).

## Build, Test & Dev
- `npm run dev` – lokalen Dev-Server starten.
- `npm run build` – Production-Build (läuft Prisma Generate + Next Build).
- `npm start` – Production-Server.
- `npm run lint` – ESLint-Check (TS/Next).

## Coding Style & Naming
- TypeScript + React (Next.js 16, App Router). Bevorzugt funktionale Komponenten.
- Indent: 2 Spaces; Strings: einfache oder doppelte Anführungszeichen konsistent pro Datei.
- Tailwind v4 für Styling; vermeide Inline-Styles, nutze bestehende Variablen (`--accent`, etc.).
- API-Routen unter `app/api/.../route.ts`; Komponenten unter `app/components/...`.

## Testing
- Keine formalisierte Testsuite vorhanden. Falls Tests ergänzt werden: Jest/React Testing Library bevorzugt; Dateien nahe am Modul (`*.test.ts(x)`).

## Commits & PRs
- Git-Historie nutzt kurze, einfache Messages (“init”). Empfehlung: `type: scope – message` (z.B. `feat: forum ai menu`).
- PRs: kurze Beschreibung, Screenshots für UI-Changes, Hinweis auf relevante Routes/Env-Variablen; verlinke Issues/Tasks.

## Sicherheit & Konfiguration
- Env: `.env.local` (DB/Auth/Stripe/Gemini/Groq). Prisma nutzt Postgres; Vercel Blob für Uploads.
- CSP in `next.config.ts`: img-src enthält Blob-Domain (`*.vercel-storage.com`). Achte auf neue externe Hosts.
- Auth: NextAuth v5 (Magic Link). API-Routen prüfen Session (`auth()`).
- Daten: Forum teils Notion-basiert; Votes in Postgres via Prisma.

## Agent-spezifische Hinweise
- AI/Forum: `/api/forum/ai-action` nutzt `lib/ai` + Rate Limiter. Context-AI (`lib/knowledge-base`) liefert Links.
- Uploads: `/api/forum/upload` legt Dateien in Vercel Blob ab; Markdown-Einbindung im Forum-Composer.
