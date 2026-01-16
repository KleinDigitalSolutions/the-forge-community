# THE FORGE - Community Fulfillment Hub

Eine Community-Plattform fuer 50 Founders, die gemeinsam SmartStore bauen.

## Features

### 1. Landing Page
- Hero-Section mit Live Founder Counter
- SmartStore Pitch (Problem, Loesung, Roadmap)
- Bewerbungsformular mit Notion-Anbindung
- Animierte UI mit Framer Motion

### 2. Community Dashboard (`/dashboard`)
- Live Statistiken (Founders, Capital, Progress)
- Projekt Voting (SmartStore)
- Founders Gallery mit Status
- Transparency Dashboard (Finanzen, Timeline)

### 3. Forum (`/forum`)
- Community Diskussionen
- Kategorien (Product Ideas, Strategy, Collaboration, etc.)
- Post-System mit Likes und Replies
- Echtzeit-Updates

### 4. Notion Integration
- Automatische Founder-Verwaltung
- API-Endpoints für Datenabfrage
- Member Tracking
 - Votes & Transactions via Notion

## Setup

### 1. Dependencies installieren
```bash
cd the-forge-community
npm install
```

### 2. Notion Integration einrichten

#### Schritt 1: Notion Integration erstellen
1. Gehe zu https://www.notion.so/my-integrations
2. Klicke auf "+ New integration"
3. Name: "THE FORGE"
4. Wähle den Workspace
5. Kopiere den "Internal Integration Token"

#### Schritt 2: Notion Database erstellen
Erstelle eine neue Notion Database mit folgenden Properties:

**Founders Database:**
- Name (Title)
- Email (Email)
- Phone (Phone Number)
- Instagram (Text)
- Why Join (Text)
- Founder Number (Number)
- Joined Date (Date)
- Status (Select: pending, active, inactive)
- Investment Paid (Checkbox)

**Votes Database (neu):**
- Name (Title)
- Description (Text)
- Votes (Number)
- Status (Select: active, closed, winner)
- Metrics (Text)
- Highlights (Text)
- Timeline (Text)
- Start Date (Date)
- End Date (Date)

**Forum Database (neu):**
- Name (Title)
- Content (Text)
- Author (Text)
- Founder Number (Number)
- Category (Select)
- Likes (Number)

#### Schritt 3: Database mit Integration verbinden
1. Öffne deine Notion Database
2. Klicke auf "..." (oben rechts)
3. Wähle "Add connections"
4. Wähle "THE FORGE" Integration

#### Schritt 4: Database ID kopieren
Die Database ID findest du in der URL:
```
https://notion.so/your-workspace/DATABASE_ID?v=...
```

### 3. Environment Variables konfigurieren

Bearbeite `.env.local`:
```bash
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
NOTION_VOTES_DATABASE_ID=your_votes_database_id
NOTION_FORUM_DATABASE_ID=your_forum_database_id
NOTION_PARENT_PAGE_ID=optional_parent_page_id

`NOTION_PARENT_PAGE_ID` wird nur benoetigt, wenn du die Datenbanken per Script anlegst.
```

### 4. Development Server starten
```bash
npm run dev
```

Öffne http://localhost:3000

## Bewerbungsformular

Das Formular auf der Landing Page sendet Bewerbungen an `/api/founders/add`
und legt sie direkt in Notion an. Stelle sicher, dass `NOTION_API_KEY`
und `NOTION_DATABASE_ID` gesetzt sind.

## Project Structure

```
the-forge-community/
├── app/
│   ├── page.tsx                 # Landing Page
│   ├── dashboard/
│   │   └── page.tsx            # Community Dashboard
│   ├── forum/
│   │   └── page.tsx            # Discussion Forum
│   └── api/
│       └── founders/
│           ├── route.ts        # Get founders
│           └── add/
│               └── route.ts    # Add new founder
├── lib/
│   └── notion.ts               # Notion API helpers
└── .env.local                  # Environment variables
```

## API Endpoints

### GET `/api/founders`
Gibt alle Founders zurück
```json
{
  "success": true,
  "count": 7,
  "founders": [
    {
      "founderNumber": 1,
      "name": "Max Mueller",
      "joinedDate": "2024-01-15",
      "status": "active"
    }
  ]
}
```

### POST `/api/founders/add`
Fügt neuen Founder hinzu
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+49123456789",
  "instagram": "@johndoe",
  "why": "Ich will die Brand-Welt demokratisieren..."
}
```

## Deployment

### Vercel (empfohlen)
```bash
npm install -g vercel
vercel
```

Environment Variables in Vercel Dashboard eintragen:
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`

### Andere Plattformen
- Stelle sicher, dass Node.js 18+ verfügbar ist
- Setze Environment Variables
- Build Command: `npm run build`
- Start Command: `npm start`

## Naechste Schritte

### Phase 1: Launch vorbereiten
- [ ] Tally Form erstellen und einbinden
- [ ] Notion Database aufsetzen
- [ ] Email für Contact eintragen
- [ ] Domain kaufen und verbinden

### Phase 2: Features erweitern
- [ ] User Authentication (NextAuth)
- [ ] Real-time Updates (Pusher oder Socket.io)
- [ ] Payment Integration (Stripe)
- [ ] Email Notifications (Resend oder SendGrid)
- [ ] File Uploads (fuer Projektvorschlaege)

### Phase 3: Skalierung
- [ ] Admin Dashboard
- [ ] Analytics Dashboard
- [ ] Mobile App (React Native)
- [ ] Community Features (DMs, Groups)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Backend:** Notion API
- **Forms:** Tally.so
- **Deployment:** Vercel

## Support

Bei Fragen oder Problemen:
- GitHub Issues
- Email: your-email@theforge.com

## License

Proprietary - THE FORGE Community Brand Factory
