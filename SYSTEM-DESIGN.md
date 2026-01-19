# 🏗️ THE FORGE - SYSTEM DESIGN (Reality Check)

**Problem:** Menschen haben Ideen + Skills, aber kein Kapital (keine 25k solo).
**Lösung:** Kollektives Brand Building mit strukturiertem Prozess.

---

## 🎯 CORE MECHANICS (Was wir WIRKLICH bauen müssen)

### 1. SQUAD FORMATION (Wie kommen Teams zusammen?)

#### Option A: Manual Matching (MVP - einfach)
```
User Profile → Skills/Interests → Admin matched manually → Squad erstellt
```
**Pros:**
- Einfach zu bauen (1-2 Tage)
- Bessere Qualität (kuratiert)
- Schnell live

**Cons:**
- Nicht skalierbar (bei 5000 Members unmöglich)
- Admin Bottleneck

---

#### Option B: Self-Service Squads (Skalierbar)
```
User → Browse Open Squads → Apply to Join → Squad Lead approved → Member
```
**Pros:**
- Skaliert zu 5000+ Members
- User haben Kontrolle
- Dezentral

**Cons:**
- Komplexer (Squad Roles, Permissions)
- Braucht Governance (wer ist Lead?)

---

#### Option C: Algorithmus (Future - Nice to Have)
```
User Skills + Interests → ML Matching → Suggested Squads
```
**Pros:**
- Fully automated
- Beste Matches

**Cons:**
- Komplex (braucht Training Data)
- Erst bei >500 Users sinnvoll

---

### **EMPFEHLUNG:**
**Phase 1 (MVP):** Manual Matching (Admin)
**Phase 2 (100+ Users):** Self-Service Squads
**Phase 3 (500+ Users):** Algorithmus-Assist

---

## 2. SQUAD STRUKTUR (Was ist ein Squad?)

```typescript
Squad {
  id: string
  name: string
  mission: string // "Build a sustainable fashion brand"
  status: "forming" | "planning" | "building" | "launched" | "archived"

  // Members
  members: Member[] // 2-5 Menschen optimal
  lead: User // Squad Lead (decision maker bei tie)

  // Venture (was sie bauen)
  venture: Venture // Das Projekt

  // Communication
  privateForumId: string // Private Squad Forum

  // Progress
  currentPhase: number // 1-6 (Venture Creation Wizard)
  tasksCompleted: number
  deadlinesMissed: number

  // Finance
  capitalContributed: number // Wie viel haben sie eingezahlt?
  capitalRequired: number // Wie viel brauchen sie total?

  created: Date
  launched?: Date
}
```

---

## 3. VENTURE BUILDING FLOW (Step by Step)

### Phase 1: IDEATION (Squad Formation)
**Goal:** Finde 2-5 Co-Founders
**Tasks:**
- [ ] Profile erstellen (Skills, Budget, Commitment)
- [ ] Squad beitreten oder erstellen
- [ ] Squad Agreement unterschreiben (Equity Split)

**Output:** Squad ist "formed"

---

### Phase 2: CONCEPT (Produktwahl)
**Goal:** Was bauen wir?
**Tasks:**
- [ ] Produktkategorie wählen (Fashion, Food, Tech, etc.)
- [ ] Zielgruppe definieren (Persona)
- [ ] USP definieren (Was macht uns unique?)
- [ ] Abstimmung: Go/No-Go

**Tools:**
- Voting System (jeder 1 Vote)
- Discussion im Squad Forum

**Output:** Venture Concept Document

---

### Phase 3: BRANDING (Name, Logo, Identity)
**Goal:** Brand Identity schaffen
**Tasks:**
- [ ] Name Brainstorming (jeder 3 Vorschläge)
- [ ] Abstimmung: Final Name
- [ ] Domain checken + kaufen
- [ ] Logo Design (DIY oder Designer)
- [ ] Brand Guidelines (Farben, Fonts, Tone)

**Tools:**
- Voting System
- File Upload (Logo Variants)
- External Links (Figma, Canva)

**Output:** Brand Book

---

### Phase 4: SOURCING (Hersteller/Supplier finden)
**Goal:** Produktionspartner finden
**Tasks:**
- [ ] Supplier-Datenbank durchsuchen (Platform Feature!)
- [ ] Anfragen schicken (Min. 3 Suppliers)
- [ ] Samples bestellen
- [ ] Qualität bewerten
- [ ] Supplier wählen (Abstimmung)

**Tools:**
- Supplier Directory (mit Ratings!)
- Sample Tracker (Status: Ordered → Received → Reviewed)
- Cost Calculator

**Output:** Signed Supplier Agreement

---

### Phase 5: PROTOTYPING (Samples & Iteration)
**Goal:** Produkt perfektionieren
**Tasks:**
- [ ] Sample Round 1 bestellen
- [ ] Team Review (Fotos, Feedback)
- [ ] Änderungen dokumentieren
- [ ] Sample Round 2
- [ ] Final Approval (Abstimmung)

**Tools:**
- Sample Log (Fotos, Kosten, Feedback)
- Change Requests Tracker

**Output:** Production-Ready Product

---

### Phase 6: LAUNCH PREP (Go-to-Market)
**Goal:** Sales-Ready machen
**Tasks:**
- [ ] Website/Shop Setup (Shopify?)
- [ ] Social Media Accounts
- [ ] Product Photography
- [ ] First Order platzieren (MOQ)
- [ ] Marketing Campaign planen
- [ ] Launch Date setzen

**Tools:**
- Task Checklist
- Budget Tracker
- Launch Countdown

**Output:** LIVE BRAND 🚀

---

## 4. FORUM SYSTEM (Kommunikation)

### Public Forum (alle User)
- General Discussions
- Success Stories
- Resource Sharing
- Questions

### Squad Forum (private, nur Squad Members)
- Internal Discussions
- Decision Making
- File Sharing
- Voting

**Implementierung:**
```typescript
Forum {
  id: string
  type: "public" | "squad"
  squadId?: string // null wenn public

  posts: Post[]

  // Permissions
  canView: User[] // Bei Squad: nur Members
  canPost: User[] // Bei Squad: nur Members
}

Post {
  id: string
  forumId: string
  author: User
  content: string
  attachments: File[]

  // Voting
  upvotes: number
  downvotes: number

  // Threading
  comments: Comment[]

  // Polls/Decisions
  poll?: Poll // "Welchen Namen wählen wir?"
}
```

---

## 5. VOTING SYSTEM (Demokratische Entscheidungen)

**Use Cases:**
- Name wählen
- Logo wählen
- Supplier wählen
- Budget Decisions
- Go/No-Go Decisions

**Types:**
1. **Simple Vote** (Ja/Nein)
2. **Multiple Choice** (Option A, B, C)
3. **Ranking** (1st, 2nd, 3rd choice)

```typescript
Vote {
  id: string
  squadId: string
  question: string
  type: "yes-no" | "multiple-choice" | "ranking"
  options: string[]

  // Results
  votes: { userId: string, choice: string }[]
  status: "open" | "closed"
  deadline: Date

  // Governance
  requiredQuorum: number // z.B. 80% müssen voten
  winningThreshold: number // z.B. 60% für Ja
}
```

---

## 6. SUPPLIER DIRECTORY (Platform Feature!)

**Das ist der GAME CHANGER!**

Statt dass jedes Squad selbst Hersteller suchen muss → Du baust eine kuratierte Datenbank.

```typescript
Supplier {
  id: string
  name: string
  country: string
  category: string[] // "Fashion", "Packaging", "Electronics"

  // Quality Metrics
  rating: number // 1-5 Stars (von anderen Squads)
  ordersCompleted: number
  responseTime: string // "< 24h"

  // Capabilities
  moq: number // Minimum Order Quantity
  leadTime: number // days
  certifications: string[] // "GOTS", "Fair Trade"

  // Contact
  website: string
  email: string
  contactPerson: string

  // Reviews (von anderen Squads)
  reviews: Review[]
}
```

**Warum das wichtig ist:**
- Squads sparen Zeit (nicht jeder muss googlen)
- Quality Control (nur geprüfte Supplier)
- Community Ratings (Transparency)
- Platform Value (das können sie woanders nicht bekommen!)

---

## 7. SAMPLE MANAGEMENT (Execution Tracking)

```typescript
Sample {
  id: string
  squadId: string
  supplierId: string

  // Details
  productType: string
  quantity: number
  cost: number
  shippingCost: number

  // Timeline
  orderedAt: Date
  expectedDelivery: Date
  receivedAt?: Date

  // Review
  photos: string[]
  feedback: string
  rating: number
  approved: boolean

  // Changes
  changeRequests: string[]
}
```

---

## 8. FINANCIAL SYSTEM (Money Flow)

### Konzept:
Jeder Founder zahlt z.B. **69€/mo** → Wo geht das hin?

**Option A: Platform Fee Model**
```
69€/mo → Platform Kosten (Hosting, Support, Tools)
Squad Budget = Separate (Members zahlen extra für Produktion)
```

**Option B: Shared Pool Model**
```
69€/mo → 50% Platform, 50% Squad Budget Pool
Jeder Squad hat "Credits" für Samples, Production
```

**Option C: Equity-Based**
```
69€/mo → Platform
User kauft "Anteile" am Squad (z.B. 1000€ = 20% Equity)
Revenue Share später
```

---

### **EMPFEHLUNG:**
**Platform Fee + Squad Wallet**

```typescript
SquadWallet {
  id: string
  squadId: string

  // Balance
  balance: number // EUR

  // Transactions
  deposits: { userId: string, amount: number, date: Date }[]
  expenses: { type: string, amount: number, description: string }[]

  // Budget Planning
  budgetTotal: number // z.B. 5000€ für First Production Run
  budgetAllocated: {
    samples: 500,
    production: 3000,
    marketing: 1000,
    misc: 500
  }
}
```

**Flow:**
1. Squad Member zahlt 69€/mo Platform Fee
2. Squad beschließt Budget (z.B. 5000€ total)
3. Jeder Member zahlt Anteil (z.B. 1000€ bei 5 Members)
4. Wallet wird gefüllt
5. Squad gibt aus (Samples, Production)
6. Alle Expenses transparent im Dashboard

---

## 9. SKALIERBARKEIT (0 → 5000 Members)

### Database Strategy

**Aktuell:** Notion + Postgres
**Problem:** Notion API ist langsam bei >1000 Records

**Lösung:**
```
Postgres = Source of Truth (Users, Squads, Ventures, Votes)
Notion = CMS (Announcements, Documents, Knowledge Base)
```

**Schema:**
```sql
-- USERS
users (
  id, email, name, status, plan,
  skills[], bio, phone, address
)

-- SQUADS
squads (
  id, name, status, lead_id,
  created_at, launched_at
)

squad_members (
  squad_id, user_id, role, equity_share, joined_at
)

-- VENTURES
ventures (
  id, squad_id, name, category, status,
  phase, brand_name, domain, logo_url
)

venture_tasks (
  id, venture_id, title, assignee_id,
  status, due_date, priority
)

-- FORUMS
forums (
  id, type, squad_id, name
)

posts (
  id, forum_id, author_id, content,
  upvotes, downvotes, created_at
)

comments (
  id, post_id, author_id, content
)

-- VOTING
votes (
  id, squad_id, question, type, options[],
  status, deadline, required_quorum
)

vote_responses (
  vote_id, user_id, choice, voted_at
)

-- SUPPLIERS
suppliers (
  id, name, country, category[],
  moq, lead_time, rating, contact
)

supplier_reviews (
  id, supplier_id, squad_id, rating, review
)

-- SAMPLES
samples (
  id, squad_id, supplier_id,
  cost, status, ordered_at, received_at,
  approved, photos[], feedback
)

-- FINANCE
squad_wallets (
  id, squad_id, balance
)

transactions (
  id, wallet_id, type, amount,
  description, created_at
)
```

---

## 10. MVP FEATURE SET (Was bauen wir ZUERST?)

### 🔴 PHASE 1 - MVP (2-3 Wochen)

**MUSS FUNKTIONIEREN:**
1. ✅ User Registration + Login
2. ✅ Profile (Skills, Bio)
3. ✅ Manual Squad Creation (Admin)
4. ⚠️ Squad Dashboard (Members, Budget, Tasks)
5. ⚠️ Private Squad Forum (Posts, Comments)
6. ⚠️ Task Management (Checklists)
7. ⚠️ Simple Voting (Ja/Nein Polls)
8. ⚠️ File Uploads (Logo, Photos)

**KANN WARTEN:**
- Algorithmic Matching
- Supplier Directory (start with Google Sheet)
- Advanced Analytics
- Email Notifications

---

### 🟡 PHASE 2 - SCALE (1-2 Monate)

**NACHDEM MVP LÄUFT:**
9. Squad Marketplace (Browse, Apply)
10. Supplier Directory (Database)
11. Sample Tracker
12. Budget Tracker (Squad Wallet)
13. Venture Phases (1-6 mit Progress)
14. Advanced Voting (Multi-Choice, Ranking)
15. Notifications (Email, In-App)

---

### 🟢 PHASE 3 - OPTIMIZE (3+ Monate)

**BEI >100 USERS:**
16. Algorithmic Squad Matching
17. Analytics Dashboard
18. Revenue Sharing System
19. Mobile App
20. API for Integrations

---

## 11. USER JOURNEY (So soll es laufen)

### Day 1: ONBOARDING
```
1. User landet auf Landing Page
2. Bewirbt sich (Form: Skills, Budget, Commitment)
3. Admin reviewed → Approval
4. Email: "Welcome + Magic Link"
5. User loggt ein → Onboarding Tour
6. Profile ausfüllen (Bio, Skills, Ziele)
```

### Week 1: SQUAD FORMATION
```
7. Admin matched User zu Squad (manual)
8. Email: "Du wurdest zu Squad 'GreenThreads' hinzugefügt"
9. User geht zu Squad Dashboard
10. Sieht Co-Founders, Mission, Status
11. Squad Forum: Introductions
```

### Week 2-3: PLANNING
```
12. Squad erstellt Venture (Wizard: Step 1-3)
   - Produktkategorie wählen
   - Zielgruppe definieren
   - Name Brainstorming
13. Voting: "Welchen Namen?"
14. Ergebnis: "EcoWear" gewinnt
15. Tasks werden erstellt (Domain kaufen, Logo design)
16. Jeder übernimmt Tasks
```

### Month 2-3: BUILDING
```
17. Supplier Directory durchsuchen
18. 3 Hersteller anfragen
19. Samples bestellen (€500 Budget)
20. Sample Log: Fotos, Feedback
21. Voting: "Supplier B approved"
22. First Order (MOQ 100 units)
23. Budget Tracker: €3000 spent / €5000 total
```

### Month 4: LAUNCH
```
24. Shopify Store live
25. Product Photos gemacht
26. Social Media live
27. Launch Countdown
28. 🚀 FIRST SALE!
29. Revenue Dashboard
30. Payout: Profit / Equity Split
```

---

## 12. TECH STACK (Realistic)

**Frontend:**
- Next.js 14 (App Router) ✅ Already
- Tailwind CSS ✅ Already
- Framer Motion ✅ Already
- React Hook Form (Forms)

**Backend:**
- Next.js API Routes ✅ Already
- NextAuth (Auth) ✅ Already
- Vercel Postgres ✅ Already
- Vercel Blob (File Upload) ✅ Already

**Third-Party:**
- Resend (Emails) ✅ Already
- Stripe (Payments) ✅ Already
- Groq (AI Chatbot) ✅ Already
- Notion (CMS only) ⚠️ Downgrade role

**New Tools:**
- **Upstash Redis** (Caching, Rate Limiting)
- **Trigger.dev** (Background Jobs - Email Digests, etc.)
- **Sentry** (Error Tracking)
- **PostHog** (Analytics)

---

## 13. KOSTEN (Bei 5000 Members)

**Infrastructure:**
- Vercel Pro: ~$20/mo (Hobby ist free)
- Postgres: ~$50/mo (bei 5k users)
- Blob Storage: ~$10/mo
- Resend: ~$50/mo (50k emails)
- Upstash Redis: ~$20/mo

**Total: ~$150/mo bei 5000 Users**

**Revenue:**
- 5000 Users × 69€/mo = 345.000€/mo
- Platform Fee = ~10% = 34.500€/mo

**Kosten sind ein Witz im Vergleich zu Revenue. Skaliert perfekt.**

---

## 14. RISIKEN & MITIGATION

### Risk 1: Squads finden sich nicht
**Mitigation:**
- Manual Matching am Anfang
- Community Events (Virtual Meetups)
- Success Stories pushen

### Risk 2: Squads starten, aber launchen nicht
**Mitigation:**
- Deadlines mit Consequences
- Squad Lead Accountability
- Progress Tracking öffentlich machen

### Risk 3: Schlechte Supplier
**Mitigation:**
- Kuratierte Supplier List
- Rating System
- Platform nimmt Haftung (Geld-zurück-Garantie)

### Risk 4: Equity Disputes
**Mitigation:**
- Legal Agreement am Anfang
- Clear Equity Split Tool
- Platform ist neutral Mediator

---

## 15. LAUNCH STRATEGIE

### Soft Launch (Batch #001)
- 25 Founders (wie geplant)
- 5 Squads × 5 Members
- 1-2 erfolgreiche Launches
- Case Studies sammeln

### Public Launch (Batch #002)
- 100 Founders
- Warteliste aufbauen
- Influencer Marketing
- PR: "Das kollektive Venture Studio"

### Scale (Batch #003+)
- Open Application
- Self-Service Squads
- 500 → 1000 → 5000 Members

---

## 🚀 NEXT STEPS (Was wir JETZT tun müssen)

### Diese Woche:
1. **Fix /api/me Error** (Dashboard läuft)
2. **Squad Model bauen** (Postgres Schema)
3. **Squad Dashboard** (minimale Version)
4. **Private Forum** (Squad-only posts)

### Nächste Woche:
5. **Voting System** (Simple Polls)
6. **Task Manager** (Squad-specific)
7. **File Uploads** (Logo, Samples)
8. **Budget Tracker** (Basic)

### In 2 Wochen:
9. **Manual Testing** (mit dir als Test-User)
10. **5 Beta Founders** einladen
11. **Feedback** sammeln
12. **Iterate**

---

## ❓ FRAGEN AN DICH:

1. **Squad Size:** 2-5 Members oder flexibel?
2. **Equity Split:** Equal (20% each bei 5 Members) oder individuell?
3. **Budget Model:** Platform Fee (69€) + Squad investiert extra?
4. **Supplier:** Baust du die Database selbst oder crowdsourced?
5. **Launch Criteria:** Was muss ein Squad erreichen um "launched" zu sein?

---

**Was sagst du? Realistisch genug? Soll ich anfangen das zu bauen?** 🔨
