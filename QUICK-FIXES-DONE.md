# ✅ Quick Fixes - Erledigt

## Was wurde sofort gefixt:

### 1. ✅ Kritischer Build-Fehler behoben
**Problem**: `/app/api/admin/applicants/route.ts` nutzte `notion.databases.query()`, was mit Notion SDK v5+ nicht funktioniert.

**Lösung**: Ersetzt durch native Fetch-API (wie in allen anderen Notion-Funktionen):
```typescript
const response = await fetch(`https://api.notion.com/v1/databases/${groupsDbId}/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sorts: [{ property: 'Name', direction: 'ascending' }],
  }),
});
```

**Datei**: `app/api/admin/applicants/route.ts:24-44`

---

### 2. ✅ Admin-Authentifizierung aktiviert
**Problem**: Admin-Route war ohne Auth-Check (auskommentiert für Dev).

**Lösung**: Auth-Check aktiviert - nur `ADMIN_EMAIL` hat Zugriff auf `/api/admin/*`:
```typescript
if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

**Datei**: `app/api/admin/applicants/route.ts:10-12`

---

### 3. ✅ Founder Role/Capital/Skill Tracking hinzugefügt
**Problem**: Frontend sendet `role`, `capital`, `skill` - wurden aber nicht in Notion gespeichert.

**Lösung**:
- API Route erweitert: `app/api/founders/add/route.ts:8`
- Notion `addFounder()` Funktion erweitert: `lib/notion.ts:182-293`
- Neue Properties automatisch in Notion gespeichert (wenn vorhanden):
  - **Role**: Select field (Investor/Builder)
  - **Capital**: Rich Text (z.B. "25k Gruppe")
  - **Skill**: Rich Text (z.B. "Frontend Dev")

**Dateien**:
- `app/api/founders/add/route.ts`
- `lib/notion.ts`

---

### 4. ✅ Build erfolgreich getestet
```bash
npm run build
# ✓ Compiled successfully
# ✓ TypeScript passed
# ✓ All routes generated
```

---

## 🎯 Nächste Schritte (KRITISCH!)

### LEGAL (sofort angehen):
- [ ] **Anwalt konsultieren** (Gesellschaftsrecht)
- [ ] **BaFin-Check**: Prospektpflicht für Crowdfunding?
- [ ] **Gesellschaftsvertrag** (GbR/UG/GmbH?)
- [ ] **Founder Agreement Template** rechtssicher machen
- [ ] **Exit-Klauseln** definieren

### NOTION SETUP (vor Go-Live):
Folgende Properties in der Founders Database anlegen:
- `Role` (Select: Investor, Builder)
- `Capital` (Text)
- `Skill` (Text)

Oder: Die vorhandenen Property-Namen in `.env` mapppen falls anders benannt.

### OPERATIONS:
- [ ] Steuerberater einbinden (UG-Gründung)
- [ ] Geschäftskonto eröffnen
- [ ] Buchhaltung-Setup (Lexoffice/DATEV)
- [ ] Email-Server (Resend für Notifications)
- [ ] Domain kaufen + DNS konfigurieren

### PAYMENT:
- [ ] Stripe Live-Mode aktivieren
- [ ] Escrow-Account prüfen
- [ ] Rechnungsstellung automatisieren

---

## 📝 ENV-Variablen Check

Stelle sicher, dass folgende ENV-Variablen gesetzt sind:

```bash
# Admin Access
ADMIN_EMAIL=deine-admin-email@example.com

# Notion
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=...
NOTION_GROUPS_DATABASE_ID=...
NOTION_VOTES_DATABASE_ID=...
NOTION_TRANSACTIONS_DATABASE_ID=...
NOTION_ANNOUNCEMENTS_DATABASE_ID=...
NOTION_TASKS_DATABASE_ID=...
NOTION_DOCUMENTS_DATABASE_ID=...
NOTION_EVENTS_DATABASE_ID=...
NOTION_FORUM_DATABASE_ID=...

# Auth
AUTH_SECRET=...
AUTH_URL=https://stakeandscale.de
AUTH_RESEND_KEY=...

# Database
DATABASE_URL=postgresql://...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI
GROQ_API_KEY=gsk_...
```

---

## 🚀 Deployment Checklist

Vor Go-Live:
- [ ] Alle ENV-Variablen in Vercel gesetzt
- [ ] Stripe auf Live-Mode umstellen
- [ ] ADMIN_EMAIL korrekt setzen
- [ ] Domain mit SSL konfiguriert
- [ ] Datenschutzerklärung reviewed
- [ ] Impressum vollständig
- [ ] AGB von Anwalt geprüft
- [ ] Notion-Datenbanken alle angelegt
- [ ] Test-Bewerbung durchlaufen

---

## ⚠️ Bekannte Limitierungen

1. **Squad Management**: UI zum Anlegen neuer Squads fehlt (nur via Notion)
2. **Email-Benachrichtigungen**: Nicht implementiert (Resend-Key vorhanden)
3. **KYC/AML**: Nicht implementiert (für 50k/100k Tier empfohlen)
4. **Rate Limiting**: Nicht implementiert
5. **2FA**: Nicht implementiert
6. **Founder Agreement Signing**: Nicht automatisiert

---

Generiert am: 2026-01-17
