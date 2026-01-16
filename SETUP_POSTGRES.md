# Vercel Postgres Setup für Authentication

## Problem
NextAuth v5 mit Resend (Magic Links) benötigt eine Datenbank. Ohne DB gibt es 500 Errors.

## Lösung
Ich habe den Code bereits vorbereitet. Du musst nur noch Postgres im Vercel Dashboard erstellen.

## Schritte

### 1. Vercel Postgres erstellen
1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Wähle dein Projekt "the-forge-community"
3. Gehe zu **Storage** Tab
4. Klicke auf **Create Database**
5. Wähle **Postgres**
6. Region: **Frankfurt** (am nächsten zu Deutschland)
7. Name: `forge-auth-db` (oder beliebig)
8. Klicke **Create**

### 2. Datenbank-Schema erstellen
Nach dem Erstellen der Datenbank:

1. Im Vercel Dashboard → **Storage** → Deine neue DB
2. Klicke auf **Query** Tab (oder "Data" → ".sql" Tab)
3. Kopiere den Inhalt von `scripts/setup-auth-db.sql`
4. Führe das SQL aus

**ODER** lokal ausführen (wenn POSTGRES_URL automatisch zu .env.local hinzugefügt wurde):
```bash
npm install -g vercel
vercel env pull .env.local
```

### 3. Deploy
```bash
git add .
git commit -m "Add Vercel Postgres adapter for NextAuth"
git push
```

Vercel wird automatisch neu deployen und die Postgres Environment Variables werden automatisch hinzugefügt.

### 4. Testen
1. Gehe zu https://www.stakeandscale.de/login
2. Gib deine E-Mail ein (die in Notion als Founder eingetragen ist)
3. Du bekommst einen Magic Link per E-Mail
4. Klicke auf den Link → Du bist eingeloggt!

## Was wurde geändert?

### auth.ts
```typescript
import { sql } from '@vercel/postgres';
import PostgresAdapter from '@auth/pg-adapter';

export const { auth, signIn, signOut, handlers } = NextAuth({
  adapter: PostgresAdapter(sql),  // ← NEU!
  // ... rest bleibt gleich
});
```

### Packages
```bash
npm install @vercel/postgres @auth/pg-adapter
```

## Kosten
- **Vercel Postgres Hobby**: Kostenlos bis 256 MB
- Mehr als genug für Authentication (ein User = ~1KB)
- Du kannst ~250.000 User speichern kostenlos

## Troubleshooting

### "POSTGRES_URL not found"
→ Warte 1-2 Minuten nach DB-Erstellung, dann deploy nochmal

### "Table does not exist"
→ Führe das SQL-Schema aus (Schritt 2)

### Immer noch 500 Error?
→ Checke Vercel Logs: `vercel logs --follow`
