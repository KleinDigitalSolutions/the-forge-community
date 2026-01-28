# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: STAKE & SCALE (The Forge Community)

**Community Venture Studio Platform** - Next.js 16 (App Router), TypeScript, Prisma 7, PostgreSQL, Stripe, Gemini AI

---

## Essential Commands

### Development
```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Prisma generate + Next.js build
npm start                # Production server
npm run lint             # Run ESLint
```

### Database
```bash
npx prisma generate      # Generate Prisma Client after schema changes
npx prisma db push       # Push schema changes to database (dev only)
npx prisma studio        # Open Prisma Studio GUI for database inspection
```

### Data Seeding
```bash
npm run seed:academy     # Seed academy/training course data locally
```

**Important:** This project uses **manual SQL migrations** stored in `/migrations/`. Do NOT use `prisma migrate` as it will conflict with the RLS policies.

---

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 16.1.2 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL (Vercel Postgres) + Prisma 7.2
- **Auth:** NextAuth v5 (JWT, Magic Links via Resend - Open Registration)
- **Payments:** Stripe (Subscriptions + Connect)
- **AI:** Gemini Flash 2.0 (primary), Groq (fallback)
- **Energy System:** Custom AI credit management (50 credits initial)
- **Storage:** Vercel Blob
- **Styling:** Tailwind CSS v4

### System Design Philosophy

**Multi-Tenant Venture Studio with AI-First Operations & Freemium Model**

1. **Open Registration** - Anyone can sign up via magic link (no approval needed)
2. **Energy System** - Users start with 50 AI credits; core workflows are free, AI features cost credits
3. **Squads** form to build ventures together (2-5 members)
4. **Ventures** are created via guided wizard (E-Commerce, SaaS, Service)
5. **The Forge** is the venture workspace (dashboard, brand DNA, tools)
6. **AI** powers content generation, moderation, advisor chatbot (credit-based)
7. **Product-Led Growth** - Freemium model optimized for TikTok/social media traffic conversion

---

## Critical Architecture Patterns

### 1. Dual Data Layer (Hybrid Approach)

**Prisma = Source of Truth** (User, Venture, Squad, Tasks, BrandDNA)
**Notion = Legacy System** (being phased out, still used for founder access control)

```typescript
// Pattern: Always check Prisma first
const user = await prisma.user.findUnique({ where: { email } });

// Notion only for auth gatekeeper
const founder = await getFounderByEmail(email); // lib/notion.ts
if (!founder) return false; // Access denied
```

**Why?** Notion API is slow at scale. Prisma handles high-frequency reads/writes.

### 2. Row-Level Security (RLS)

**Protected Tables:** User, Venture, VentureTask, BrandDNA, SquadMember, SquadTransaction

**Access Rules:**
- Users see only their own ventures + squad ventures
- Squad LEADs can edit squad ventures
- Admins bypass all policies

**RLS Files:**
- Schema: `prisma/schema.prisma`
- Policies: `migrations/004_enable_rls.sql`

**Usage:**
```typescript
// Session variables are set by secureQuery helper (lib/db-security.ts)
const result = await secureQuery(async () => {
  return await prisma.venture.findMany(); // Automatically filtered by RLS
});
```

### 3. Multi-Squad Membership (Many-to-Many)

**Structure:**
```
User ←→ SquadMember ←→ Squad
```

**NOT:**
```
User.squadId → Squad (old pattern, removed)
```

**Query Pattern:**
```typescript
// Get user's squads
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    squadMemberships: {
      where: { leftAt: null }, // Active memberships only
      include: { squad: true }
    }
  }
});

const squads = user.squadMemberships.map(m => m.squad);
```

### 4. Stripe Payment Architecture

**Two-Tier Model:**

1. **Platform Subscriptions** (User → Platform)
   - Direct Stripe payments (€69-99/mo)
   - Fields: `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`

2. **Squad Payments** (Customer → Squad via Stripe Connect)
   - Marketplace model with application fees
   - Squad fields: `stripeConnectedAccountId`, `stripeChargesEnabled`
   - Platform automatically receives 5-10% commission

**Critical Rule:** Platform NEVER holds squad money. All flows through Stripe Connect accounts.

```typescript
// Payment with platform fee
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // €100
  currency: 'eur',
  application_fee_amount: 500, // €5 for platform (5%)
  transfer_data: {
    destination: squad.stripeConnectedAccountId // €95 to squad
  }
});
```

---

## Database Schema Key Points

### Critical Tables

**User**
- `squadMemberships: SquadMember[]` (many-to-many, NOT `squadId`)
- `stripeCustomerId`, `stripeSubscriptionId` (platform subscription - legacy)
- `credits`, `totalCredits`, `creditsUsed` (Energy System for AI features)
- `toxicityWarnings`, `isBanned` (moderation system)
- `accountStatus` (ACTIVE, SUSPENDED, DELETED - for account deletion flow)

**Venture**
- `ownerId` (creator)
- `squadId` (optional, if built by squad)
- `brandDNA: BrandDNA` (1:1, AI context)
- `currentStep`, `completedSteps[]` (wizard progress)

**BrandDNA** (AI Context for Content Generation)
- `brandName`, `mission`, `vision`, `values[]`
- `toneOfVoice`, `personality[]`, `writingStyle`
- `targetAudience` (JSON), `customerPersona`
- `aiContext` (free text instructions for AI)
- `doNotMention[]` (topics to avoid)

**Squad**
- `members: SquadMember[]` (many-to-many)
- `stripeConnectedAccountId` (Stripe Connect)
- `stripeOnboardingComplete`, `stripeChargesEnabled` (payment status)

**SquadMember** (Join Table)
- `userId`, `squadId`
- `role`: LEAD (decision maker) | MEMBER | GUEST (observer)
- `equityShare` (optional, for revenue sharing)
- `leftAt` (soft delete, NULL = active)

**SquadTransaction** (Log Only, No Money Holding!)
- `type`: SALE | REFUND | PLATFORM_FEE | PAYOUT | SUBSCRIPTION
- `status`: PENDING | SUCCEEDED | FAILED | REFUNDED
- `stripePaymentIntentId`, `stripeChargeId` (tracking)

### Platform Finance & Billing System (PRODUCTION-READY)

**Purpose:** Automated Stripe billing with invoice generation, PDF archiving, and EÜR-ready bookkeeping for Finanzamt compliance.

**Status:** ✅ Fully implemented (27.01.2026)

**Database Models (8 tables):**
- `PlatformTaxProfile` - Business info (Kleinunternehmer, IBAN, tax data)
- `PlatformInvoice` - Invoices with sequential numbers (YYYY-NNNN)
- `PlatformInvoiceLine` - Line items per invoice
- `PlatformLedgerCategory` - EÜR categories (INCOME/EXPENSE)
- `PlatformLedgerEntry` - Ledger bookings for tax reporting
- `PlatformDocument` - PDF archive with 10-year retention (GoBD)
- `PlatformCreditPurchase` - Credit purchase tracking
- `PlatformCreditUsage` - Credit usage analytics

**Key Features:**
- ✅ Automated invoice generation on every purchase
- ✅ PDF rendering with @react-pdf/renderer
- ✅ Vercel Blob storage with SHA256 verification
- ✅ Sequential invoice numbers (2026-0001, 2026-0002, etc.)
- ✅ Kleinunternehmer compliant (§19 UStG)
- ✅ 10-year archiving (GoBD)
- ✅ Full EÜR bookkeeping (INCOME entries)

**Migration:** `prisma/migrations/20260308130000_platform_finance/migration.sql`

**Implementation Files:**
- `lib/platform-invoicing.ts` - Invoice + ledger creation
- `lib/invoice-pdf.tsx` - PDF generation
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `app/settings/billing/` - User-facing billing UI

**DB connectivity note:** Migrations should use **direct/unpooled** URL (e.g. `DATABASE_URL_UNPOOLED` or `POSTGRES_URL_NON_POOLING`). Pooler URLs are for runtime, not for `migrate`.

---

## Authentication Flow

### NextAuth v5 (Magic Link - Open Registration)

**Flow:**
1. User enters email at `/login`
2. Magic link sent via Resend (no approval needed)
3. User clicks link → JWT session created
4. New users automatically created with 50 AI credits (Energy System)
5. Protected routes check session via middleware

**Current SignIn Logic (Open Registration):**
```typescript
// auth.ts - signIn callback
async signIn({ user }) {
  if (!user?.email) return false;

  // Block deleted accounts from logging in
  const account = await prisma.user.findUnique({
    where: { email: user.email },
    select: { accountStatus: true }
  });

  if (account?.accountStatus === 'DELETED') return false;
  return true;
}
```

**Events:**
- `createUser`: Automatically assigns a unique founder number to new users via `assignFounderNumberIfMissing()`
- New users start with 50 credits (configurable via `INITIAL_CREDITS` env var)

**Important:** The platform uses **open registration** with a freemium model. No approval process required. Notion is legacy and should not be used for new features.

**Protected Route Config:**
```typescript
// auth.config.ts
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|legal).*)',
]
```

**Session Access:**
```typescript
// Server component
const session = await auth();

// Client component
const { data: session } = useSession();
```

---

## AI System Integration

### Multi-Provider Setup with Automatic Fallback

**Primary:** Gemini Flash 2.0 (`@ai-sdk/google`)
**Fallback:** Groq Llama 3.3 70B (`@ai-sdk/openai` with custom baseURL)

**Unified AI Call Pattern (Recommended):**
```typescript
import { callAI } from '@/lib/ai';

// Automatically tries Gemini first, falls back to Groq on failure
const response = await callAI(
  [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Generate content...' }
  ],
  { temperature: 0.7, maxTokens: 1000 }
);

console.log(response.content); // AI-generated text
console.log(response.provider); // 'gemini' or 'groq'
console.log(response.usage); // Token usage for cost tracking
```

**Why use callAI()?**
- Automatic provider failover (resilience)
- Consistent interface across providers
- Built-in token usage tracking
- Error handling abstraction

**Direct Provider Usage (Advanced):**
```typescript
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const result = await streamText({
  model: google('gemini-2.0-flash-exp'),
  messages: [...],
  maxTokens: 1000
});
```

### AI Integration Points

1. **Chatbot - "Orion"** (`/api/chat`)
   - Gemini-powered AI advisor with personality
   - Knowledge base injection (platform info, pricing)
   - User context (name, role, ventures)
   - German language, witty/slightly sarcastic tone ("Grok-style")
   - Gender-aware addressing based on username

2. **Forum AI Actions** (`lib/ai.ts`)
   - `summarize`: 2-sentence TL;DR (2-3 credits)
   - `feedback`: Constructive critique (3-5 credits)
   - `expand`: Brainstorming ideas (3-5 credits)
   - `factCheck`: Plausibility assessment (2-3 credits)
   - `mentionReply`: Answer @ai mentions (2-5 credits)

3. **Content Moderation** (`lib/moderation.ts`)
   - Toxicity detection (HARASSMENT, HATE_SPEECH, VIOLENCE, SPAM)
   - Applied to forum posts AND direct messages
   - 3-strike warning system
   - 4th strike = auto-ban
   - **Free operation** (no credits deducted - platform safety)

4. **Brand DNA Context**
   - Fetch `BrandDNA` for venture
   - Inject into content generation prompts
   - Ensures brand-consistent output

5. **AI Sourcing Discovery** (`/app/forge/[ventureId]/sourcing`)
   - Database-based supplier matching (no hallucinations)
   - Uses Brand DNA (category, market, values) for context
   - Returns real `Resource` entries with matching explanation
   - 10-15 credits per discovery session

6. **Veo 3.1 Studio (Cinematic Production)** (`/app/components/marketing/VeoStudio.tsx`)
   - High-end multi-step AI pipeline (implemented 28.01.2026)
   - **Phase 1: Brand Alchemy** (Nano Banana) blends Identity (Model) + Object (Product) into a consistent marketing shot.
   - **Phase 2: Cinematic Animation** (Veo 3.1) animates the blended image or a provided start frame.
   - **Frame Steering:** Supports `end_image` for precise motion interpolation between two frames.
   - **Backend:** `route.ts` handles complex chaining using `existingImageUrl` and `existingEndImageUrl`.

**Example:**
```typescript
const brandDNA = await prisma.brandDNA.findUnique({
  where: { ventureId }
});

const prompt = `
  Brand: ${brandDNA.brandName}
  Tone: ${brandDNA.toneOfVoice}
  Target: ${brandDNA.customerPersona}
  Instructions: ${brandDNA.aiContext}

  Task: Generate Instagram caption for product launch...
`;
```

---

## Energy System (AI Credits)

### Overview

The Energy System is a **freemium credit-based model** for AI feature access, designed for product-led growth from social media traffic.

**Key Principles:**
- New users receive **50 credits** on signup (configurable via `INITIAL_CREDITS` env var)
- Core workflows (Venture Creation, Brand DNA, Roadmap) are **free**
- AI-powered features consume credits:
  - Content generation (marketing, legal): 5-10 credits
  - Forum AI actions (summarize, feedback, expand): 2-5 credits
  - AI Chatbot interactions: 1-3 credits per message
  - AI Sourcing Discovery: 10-15 credits

### Database Schema

**User Fields:**
```typescript
{
  credits: number;        // Current balance (default: 50)
}
```

**EnergyTransaction Table:**
Tracks all credit operations with full audit trail:
- `type`: GRANT | SPEND | REFUND | ADJUSTMENT
- `status`: RESERVED | SETTLED | REFUNDED
- `delta`: Credit change amount
- `balanceAfter`: User's balance after transaction
- `requestId`: Deduplication key for idempotent operations
- `promptTokens`, `completionTokens`, `totalTokens`: Token usage tracking
- `relatedTransactionId`: Links refunds to original transactions

### Modern Reserve-Settle Pattern (CRITICAL)

**DO NOT use the old direct deduction pattern!** Use the modern reserve-settle pattern from `lib/energy.ts`:

```typescript
import { reserveEnergy, settleEnergy, refundEnergy, InsufficientEnergyError } from '@/lib/energy';

// 1. Reserve credits BEFORE AI call
const reservation = await reserveEnergy({
  userId,
  amount: 10, // Estimated cost
  feature: 'marketing-content',
  requestId: `unique-id-${Date.now()}`, // For idempotency
  provider: 'gemini',
  model: 'gemini-2.0-flash'
});

try {
  // 2. Perform AI operation
  const result = await callAI(...);

  // 3. Settle with actual cost (refunds excess automatically)
  await settleEnergy({
    reservationId: reservation.reservationId,
    finalCost: 7, // Actual cost (3 credits refunded automatically)
    usage: {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300
    }
  });
} catch (error) {
  // 4. Refund on failure
  await refundEnergy(reservation.reservationId, 'ai-generation-failed');
  throw error;
}
```

**Why this pattern?**
- Prevents race conditions (credits locked during operation)
- Automatic refunds for overestimation
- Full audit trail with token usage
- Idempotent (safe to retry with same `requestId`)
- Admin bypass for unlimited credits (if `ADMIN_UNLIMITED_ENERGY !== 'false'`)

### Rate Limiting

The Energy System includes quota management for abuse prevention:

```typescript
import { consumeHourlyQuota, consumeDailyQuota } from '@/lib/energy';

// Check hourly quota (e.g., 10 AI generations per hour)
const quota = await consumeHourlyQuota({
  userId,
  feature: 'ai-content-generation',
  limit: 10
});

if (!quota.allowed) {
  throw new Error(`Rate limit exceeded. Try again after ${quota.resetAt.toISOString()}`);
}

// For daily limits, use consumeDailyQuota
```

**RateLimitBucket Table:**
- Tracks usage windows per user+feature
- Automatically resets based on time window
- Composite key: `[userId, feature, windowStart]`

**Client-side display:**
```typescript
import { Zap } from 'lucide-react';

// Show credit balance in UI
<div className="flex items-center gap-1">
  <Zap className="w-4 h-4 text-yellow-500" />
  <span>{user.credits}</span>
</div>
```

### Credit Pricing

**Feature Cost Table:**
| Feature | Cost | Notes |
|---------|------|-------|
| Marketing Content (Instagram, LinkedIn, Email) | 5-10 | Depends on length |
| Veo 3.1 Cinematic Video | 58 | High-fidelity production |
| Kling 2.6 / Sora 2 Video | 55-60 | Cinema quality |
| Nano Banana Blending | 5 | Image-to-image mixing |
| Legal Document Generation | 10-15 | Contract complexity |
| Forum AI (Summarize, Feedback, Expand) | 2-5 | Per action |
| AI Chatbot Message | 1-3 | Per message |
| AI Sourcing Discovery | 10-15 | Bulk supplier search |
| Content Moderation | 0 | Free (platform safety) |

**Future Monetization:**
- Credit top-ups via Stripe (€9.99 for 100 credits)
- Premium subscriptions with higher credit allowances
- Squad shared credit pools

---

## File Structure Guide

### Key Directories

```
app/
├── (routes)/              # Public pages (landing, login, legal)
├── api/                   # API routes
│   ├── chat/             # AI chatbot (Orion)
│   ├── ventures/[id]/    # Venture management
│   │   └── brand-dna/   # BrandDNA CRUD
│   ├── webhooks/stripe/  # Stripe events
│   ├── forum/            # Forum AI actions
│   └── cron/             # Scheduled jobs
├── components/           # React components
│   ├── AuthGuard.tsx    # Session wrapper
│   ├── PageShell.tsx    # Main layout
│   ├── ForgeSidebar.tsx # Forge navigation
│   ├── ForgeTopBar.tsx  # Venture context bar
│   ├── ForumEditor.tsx  # Rich text editor with markdown
│   ├── LinkPreview.tsx  # URL preview cards
│   └── ui/              # Reusable UI components
├── context/              # React Context providers
│   └── AIContext.tsx    # Context-aware AI sidebar state
├── actions/              # Server Actions
│   └── ventures.ts      # Venture mutations
├── forge/[ventureId]/    # Venture workspace
│   ├── layout.tsx       # Forge shell
│   ├── page.tsx         # Dashboard
│   ├── brand/           # Brand DNA editor
│   ├── marketing/       # AI campaigns
│   ├── sourcing/        # Supplier database
│   ├── communication/   # AI communication center
│   ├── legal/           # Legal document generation
│   ├── decisions/       # Decision Hall (voting)
│   └── admin/           # Budget, team, settings
├── ventures/
│   ├── new/             # Venture wizard
│   └── [id]/            # Venture detail
├── squads/              # Squad marketplace
├── forum/               # Community forum
│   └── ForumClient.tsx # Main forum UI with AI features
├── settings/            # User account settings
│   ├── notifications/  # Notification preferences
│   └── privacy/        # Privacy controls
└── messages/            # Direct messaging (DM)

lib/
├── prisma.ts            # Database client (singleton)
├── ai.ts                # Unified AI helper (Gemini + Groq fallback)
├── energy.ts            # Energy System (reserve/settle/refund pattern)
├── moderation.ts        # Content moderation
├── stripe.ts            # Stripe SDK
├── notion.ts            # Notion API (legacy)
├── db-security.ts       # RLS helpers (secureQuery)
├── venture-templates.ts # Wizard templates
├── knowledge-base.ts    # AI chatbot knowledge
├── ai-legal.ts          # Legal document generation
├── ai-prompt-engine.ts  # Dynamic prompt builder
├── rate-limit.ts        # Rate limiting utilities
├── founder-number.ts    # Unique founder number assignment
├── achievements.ts      # Achievement/badge system
├── karma.ts             # Karma point system
├── notifications.ts     # Notification helper
└── ui-sound.ts          # Sound effect utilities

migrations/              # Manual SQL migrations
├── 001_add_brand_dna.sql
├── 002_add_squad_member.sql
├── 003_add_stripe_connect.sql
├── 004_enable_rls.sql
├── 005_add_legal_documents.sql
├── 005_add_decision_system.sql
├── 006_restore_roadmap_votes.sql
└── 007_add_user_credits.sql
```

### Naming Conventions

- **Components:** PascalCase (`PageShell.tsx`)
- **Routes:** kebab-case folders (`/ventures/new/`)
- **API Routes:** `route.ts` (Next.js standard)
- **Server Actions:** `actions.ts` or `actions/` directory
- **Client Components:** `'use client'` directive at top

### UX Enhancements

**Sound Effects:**
- GTA-menu-style sound on successful forum posts and messages
- Audio file: `public/audio/gta-menu.mp3`
- Only plays on successful operations (not on errors)

**Mobile Optimization:**
- Reddit-style card layout for forum posts
- Compact action buttons with icons
- Mobile-responsive navigation (hamburger menu + bottom tab bar)
- Rich text editor with emoji picker optimized for mobile
- Context-aware AI sidebar adapts to screen size

---

## Context-Aware AI Sidebar

### Overview

The platform includes a **persistent AI assistant** ("Orion") that adapts to what the user is currently doing.

**Key Features:**
- Always visible in the UI (right sidebar or bottom sheet on mobile)
- Dynamically updates based on current page/modal
- Maintains conversation context across page navigation
- Powered by Gemini Flash 2.0 with personality (witty, German, direct)

### Implementation Pattern

**For any new feature that needs AI support:**

1. **Import the Context:**
```typescript
import { useAIContext } from '@/app/context/AIContext';
```

2. **Set the Context:**
```typescript
const { setContext } = useAIContext();

useEffect(() => {
  setContext("Erstelle gerade ein Sourcing-Sample. Hilf dem User bei Qualitätsmerkmalen.");

  // Optional: reset when leaving
  return () => setContext("Forge Dashboard");
}, []);
```

3. **Result:**
The AI Sidebar instantly adapts and provides relevant advice based on your context description.

**Example Use Cases:**
- Brand DNA Editor: "Editing brand identity. Help with tone of voice options."
- Marketing Studio: "Creating Instagram campaign. Suggest hashtags and hooks."
- Legal Studio: "Drafting NDA. Explain key clauses in simple terms."
- Sourcing Discovery: "Finding suppliers. Recommend quality criteria."

**Files:**
- Context Provider: `app/context/AIContext.tsx`
- AI API: `/app/api/chat/route.ts`
- Knowledge Base: `lib/knowledge-base.ts`

---

## The Forge (Venture Workspace)

### Route Structure

```
/forge/[ventureId]/
├── /                 # Dashboard (stats, tasks, quick actions)
├── /brand            # Brand DNA editor
├── /marketing        # AI-powered campaigns
├── /sourcing         # Supplier database
└── /admin            # Budget, team, settings
```

### Access Control

**Layout:** `/app/forge/[ventureId]/layout.tsx`

```typescript
// Verify access
const venture = await prisma.venture.findFirst({
  where: {
    id: ventureId,
    OR: [
      { ownerId: user.id },              // Owner
      {
        squad: {
          members: {
            some: {
              userId: user.id,
              leftAt: null                // Active squad member
            }
          }
        }
      }
    ]
  }
});

if (!venture) return notFound();
```

### Brand DNA Editor

**Purpose:** Configure AI context for content generation

**Form Fields:**
- Core Identity (name, mission, vision, values)
- Voice & Tone (toneOfVoice, personality, writingStyle)
- Target Audience (age, location, persona)
- Product (category, features, USP)
- AI Instructions (aiContext, doNotMention)

**API:**
- `GET /api/ventures/[id]/brand-dna` - Fetch
- `PUT /api/ventures/[id]/brand-dna` - Upsert

---

## Venture Creation System

### Templates

**Location:** `lib/venture-templates.ts`

**Types:**
1. **E-Commerce** (90 days, 16 tasks)
   - Product definition → Branding → Suppliers → Launch
2. **SaaS** (120 days, 8 tasks)
   - Problem validation → MVP → Beta → Public launch
3. **Service Business** (60 days, 7 tasks)
   - Service definition → Pricing → Client acquisition

### Wizard Flow

**Entry:** `/app/ventures/new/page.tsx`

**Steps:**
1. Venture type (E-Commerce, SaaS, Service)
2. Basic info (name, description, target market)
3. Product details (productType)
4. Pricing strategy (basePrice, currency)
5. Budget planning (marketing, total)
6. Launch timeline (launchDate)

**Result:** Creates `Venture` + `VentureStep[]` + `VentureTask[]`

---

## Critical Gotchas

### 1. Database Migration Strategy

**DO NOT use `prisma migrate`!**

This project uses **manual SQL migrations** in `/migrations/` because:
- RLS policies require raw SQL
- More control over production deployments
- Easier rollback

**Workflow:**
1. Modify `prisma/schema.prisma`
2. Write SQL in `migrations/XXX_description.sql`
3. Run in Neon Console or via `psql`
4. Run `npx prisma generate`

### 2. Squad Membership Queries

**OLD (WRONG):**
```typescript
const user = await prisma.user.findUnique({
  where: { id },
  select: { squadId: true } // ❌ squadId doesn't exist anymore
});
```

**NEW (CORRECT):**
```typescript
const user = await prisma.user.findUnique({
  where: { id },
  include: {
    squadMemberships: {
      where: { leftAt: null }, // ✅ Active memberships only
      include: { squad: true }
    }
  }
});
```

### 3. Stripe Connect Checks

**Before creating payment:**
```typescript
if (!squad.stripeOnboardingComplete || !squad.stripeChargesEnabled) {
  throw new Error('Squad cannot accept payments');
}
```

### 4. AI Rate Limits

**Gemini Free Tier:** 15 requests/minute

**Fallback Pattern:**
```typescript
try {
  return await generateWithGemini(prompt);
} catch (error) {
  console.warn('Gemini failed, falling back to Groq');
  return await generateWithGroq(prompt);
}
```

### 5. Next.js 16 Async Params (BREAKING CHANGE)

**Next.js 16 requires async params and searchParams:**
```typescript
// ❌ Old (Next.js 15 and below)
export default function Page({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { q: string };
}) {
  const id = params.id;
  const query = searchParams.q;
}

// ✅ New (Next.js 16+)
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
}
```

**Also applies to:**
- `generateMetadata()` functions
- `generateStaticParams()` functions
- Layout components with dynamic segments

**Why?** Next.js 16 introduced async Request APIs for better edge runtime compatibility.

### 6. Squad Wallet vs Stripe Connect

**CRITICAL DISTINCTION:**

**Stripe Connect** = Real money flow (customer → squad via Stripe)
- `stripeConnectedAccountId`: Squad's Stripe account
- `stripeChargesEnabled`: Can accept payments
- Platform never holds money, only receives automatic fees

**Squad Wallet** = Internal budget tracking (NOT real money)
- `SquadWallet.balance`: Virtual tracking only
- `WalletTransaction`: Budget allocation log (samples, production, marketing)
- Used for expense management, not payment processing

**DO NOT confuse these systems!** Payments always go through Stripe Connect. The wallet is for internal budgeting.

### 7. Notion Sync

**Notion is legacy. For new features, use Prisma only.**

Notion is still used for:
- Founder access control (gatekeeper in `auth.ts` - being removed)
- Financial transaction logging (being migrated)

**Do NOT:**
- Write new features that depend on Notion
- Sync data bidirectionally (race conditions)

### 8. Content Moderation Everywhere

**Apply moderation to ALL user-generated content, not just public posts.**

**Critical Rule:** Direct messages (DMs) must also be moderated for toxicity.

**Pattern:**
```typescript
// Before saving ANY user content (forum, DM, comments, etc.)
import { moderateContent } from '@/lib/moderation';

const { isToxic, category, severity } = await moderateContent(message);

if (isToxic) {
  // Update user warnings
  await incrementToxicityWarnings(userId);

  // Reject the message
  throw new Error(`Content rejected: ${category}`);
}
```

**Why?** Prevents platform abuse and protects users from harassment in private communications.

---

## Environment Variables

**Required:**
```bash
# Database
DATABASE_URL=postgres://...

# Auth
AUTH_SECRET=xxx               # Generate: npx auth secret
AUTH_RESEND_KEY=re_xxx
AUTH_RESEND_FROM="STAKE & SCALE <info@stakeandscale.de>"  # Optional, defaults shown
AUTH_URL=http://localhost:3000

# AI & Energy System
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-2.0-flash       # Optional, auto-detects if not set
GROQ_API_KEY=xxx                    # Optional, fallback provider
INITIAL_CREDITS=50                  # Starting credits for new users (default: 50)
ADMIN_UNLIMITED_ENERGY=true         # Admin bypass for credit checks (default: true)

# Stripe (Billing System - PRODUCTION READY)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Stripe Products (Platform Access + AI Credits)
STRIPE_PRODUCT_PLATFORM_ACCESS=prod_xxx
STRIPE_PRICE_PLATFORM_ACCESS=price_xxx
STRIPE_PRODUCT_AI_CREDITS=prod_xxx
STRIPE_PRICE_CREDITS_SMALL=price_xxx
STRIPE_PRICE_CREDITS_MEDIUM=price_xxx
STRIPE_PRICE_CREDITS_LARGE=price_xxx

# Public Keys (Frontend - PricingTable)
NEXT_PUBLIC_STRIPE_PRICE_PLATFORM_ACCESS=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_SMALL=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_MEDIUM=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_LARGE=price_xxx

# Vercel Blob (Invoice PDF Storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# Admin
ADMIN_EMAIL=admin@example.com

# Notion (Legacy - being phased out)
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
```

**Location:** `.env.local` (dev), Vercel dashboard (production)

---

## Deployment (Vercel)

### Build Configuration

**Script:** `"build": "prisma generate && next build"`

**Why?** Prisma Client must be generated before Next.js build.

### Database

**Provider:** Vercel Postgres (serverless)
**Connection:** `@vercel/postgres` + `@prisma/adapter-pg`

### Edge Functions

**NOT USED.** All routes use Node.js runtime (Prisma requirement).

### Performance

**Prisma Singleton:**
```typescript
// lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why?** Prevents connection pool exhaustion in dev.

---

## Common Tasks

### Add New Venture Template

1. Edit `lib/venture-templates.ts`
2. Add new template config (steps, tasks, duration)
3. Update `VENTURE_TYPES` in `/app/ventures/new/page.tsx`
4. Add wizard UI for type-specific fields

### Add Forge Sub-Route

1. Create `/app/forge/[ventureId]/new-route/page.tsx`
2. Add entry to `FORGE_MENU` in `components/ForgeSidebar.tsx`
3. Implement access control (inherits from layout)

### Modify BrandDNA Fields

1. Update `prisma/schema.prisma` (BrandDNA model)
2. Write SQL migration (`migrations/XXX_update_brand_dna.sql`)
3. Run SQL in Neon Console
4. Run `npx prisma generate`
5. Update UI in `/app/forge/[ventureId]/brand/page.tsx`
6. Update API in `/app/api/ventures/[id]/brand-dna/route.ts`

### Add AI Action

1. Add function to `lib/ai.ts` (export new action)
2. Update `ForumAIActions` type
3. Add UI trigger in forum components
4. Update API route `/app/api/forum/ai-action/route.ts`

### Test Stripe Billing System

**Prerequisites:**
- Stripe CLI installed: `brew install stripe`
- Stripe webhook forwarding: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
- Test card: `4242 4242 4242 4242` (any CVV, future expiry)

**Test Flow:**
```bash
# 1. Start local dev
npm run dev

# 2. Forward webhooks (new terminal)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 3. Test credit purchase
# Navigate to http://localhost:3000/pricing
# Click "100 Credits kaufen" → Checkout → Complete with test card
# Check console logs for:
#   [CHECKOUT] ✅ 100 credits granted
#   [INVOICING] ✅ Created invoice 2026-0001

# 4. Verify in UI
# Go to /settings/billing
# Check: Credits updated, invoice visible, PDF downloadable

# 5. Test subscription
# Navigate to /pricing
# Click "Pro Plan" → Checkout → Complete
# Check logs for subscription activation
# Go to /settings/billing → Cancel subscription
```

**Production Deployment:**
1. Add all ENV vars to Vercel
2. Update Stripe webhook URL to `https://www.stakeandscale.de/api/webhooks/stripe`
3. Test with Stripe test mode first
4. Switch to live mode once verified

### Implement Account Deletion Flow

1. Update User model with `accountStatus` enum (ACTIVE, SUSPENDED, DELETED)
2. Create `UserDeletion` table for retention (audit trail)
3. Implement anonymization logic:
   - Set `accountStatus = 'DELETED'`
   - Store deletion metadata in `UserDeletion`
   - Create tombstone records for forum posts (author = "Deleted User")
4. Block sign-in for deleted accounts in `auth.ts` callback
5. Add UI in `/app/settings/page.tsx` with confirmation modal

### Add Privacy Controls

**User Preferences:**
- Profile visibility (PUBLIC, FRIENDS_ONLY, PRIVATE)
- Show follower counts (boolean)
- DM permissions (EVERYONE, SQUAD_ONLY, NOBODY)

**Implementation:**
1. Add fields to User model
2. Enforce in API routes (check preferences before showing data)
3. Add UI toggles in `/app/settings/privacy/page.tsx`
4. Update middleware to respect privacy settings

---

## Security & Rate Limiting (Production-Grade)

### Multi-Layer Defense Strategy

The platform implements **defense in depth** with multiple security layers:

1. **IP-Based Rate Limiting** - Prevents multi-account abuse
2. **User-Based Credit System** - Economic cost control
3. **Daily Quotas** - Hard limits on expensive operations
4. **CORS Protection** - Blocks cross-site attacks
5. **Content Moderation** - AI-powered toxicity detection

### IP Rate Limiting

**Location:** `lib/security/ip-rate-limit.ts`

**Features:**
- Database-backed persistence (reuses existing `RateLimitBucket` table)
- Memory fallback for development
- Fail-open on errors (allows request if DB fails)
- RFC 6585 compliant rate limit headers

**Configuration Tiers:**

| Tier | Default Limit | Window | Env Var |
|------|--------------|--------|---------|
| Global API | 200 req | 1 hour | `IP_RATE_LIMIT_GLOBAL` |
| Voice Gen | 20 req | 1 hour | `IP_RATE_LIMIT_VOICE` |
| Video Gen | 10 req | 1 hour | `IP_RATE_LIMIT_VIDEO` |
| Image Gen | 30 req | 1 hour | `IP_RATE_LIMIT_IMAGE` |
| Signup | 5 req | 24 hours | `IP_RATE_LIMIT_SIGNUP` |

**Usage (Automatic via Middleware):**
```typescript
// middleware.ts automatically applies IP limiting to all /api/* routes
// Rate limit headers are added to responses:
// X-RateLimit-Limit: 20
// X-RateLimit-Remaining: 15
// X-RateLimit-Reset: 1736812800
// Retry-After: 3600 (if blocked)
```

**Manual Check (if needed):**
```typescript
import { extractIpAddress, checkIpRateLimit } from '@/lib/security/ip-rate-limit';
import { TIER_VOICE_GENERATION } from '@/lib/security/rate-limit-tiers';

const ip = extractIpAddress(request);
const result = await checkIpRateLimit(ip, TIER_VOICE_GENERATION);

if (!result.allowed) {
  return Response.json({ error: 'Rate limit exceeded' }, {
    status: 429,
    headers: { 'Retry-After': String(result.retryAfter) }
  });
}
```

**Feature Flags:**
- `ENABLE_IP_RATE_LIMIT=false` - Disable globally (for testing)
- `RATE_LIMIT_BACKEND=memory` - Use in-memory storage (dev only)

### Daily Quotas

**Location:** `lib/energy.ts`

**Purpose:** Hard limits on expensive operations, independent of credit balance.

**Why?** Prevents abuse even with unlimited credits (e.g., admin accounts).

**Quotas:**

| Feature | Free Tier | Paid Tier | Env Var |
|---------|-----------|-----------|---------|
| Voice | 20/day | 100/day | `DAILY_QUOTA_VOICE_FREE` |
| Image | 15/day | 50/day | `DAILY_QUOTA_IMAGE_FREE` |
| Video | 3/day | 20/day | `DAILY_QUOTA_VIDEO_FREE` |

**Usage Pattern:**
```typescript
import { checkDailyVoiceQuota } from '@/lib/energy';

// Check quota AFTER energy reservation (fail fast)
const dailyQuota = await checkDailyVoiceQuota(user.id);

if (!dailyQuota.allowed) {
  await refundEnergy(reservationId, 'daily-quota-exceeded');
  return Response.json({
    error: `Daily limit reached (${dailyQuota.limit}/day)`,
    quota: {
      limit: dailyQuota.limit,
      remaining: dailyQuota.remaining,
      resetAt: dailyQuota.resetAt.toISOString()
    }
  }, { status: 429 });
}
```

**Tier Detection:**
```typescript
// lib/energy.ts - getUserTier()
// Currently: All users = 'free'
// Future: Check user.subscriptionTier === 'pro'
```

### Blob Storage Lifecycle

**Location:** `lib/storage/media-lifecycle.ts`

**Purpose:** Prevent unbounded storage growth from AI-generated media.

**Strategy:**
- Auto-delete generated assets after 90 days (configurable)
- Soft-delete (metadata preserved for audit)
- Favorites excluded (user protection)
- Dry-run mode for testing

**Cron Job:** `/api/cron/cleanup-media` (daily at 02:00 UTC)

**Configuration:**
```bash
MEDIA_RETENTION_DAYS=90           # How long to keep assets
ENABLE_MEDIA_CLEANUP=true         # Master switch
MEDIA_CLEANUP_DRY_RUN=false       # Test mode (logs only)
MEDIA_CLEANUP_BATCH_SIZE=100      # Max per run
```

**Manual Cleanup (if needed):**
```typescript
import { cleanupOldMediaAssets, getCleanupStats } from '@/lib/storage/media-lifecycle';

// Check what would be deleted
const stats = await getCleanupStats();
console.log(`${stats.eligibleAssets} assets, ${stats.totalSize / 1024 / 1024} MB`);

// Dry run (test)
const dryResult = await cleanupOldMediaAssets({ dryRun: true });

// Production run
const result = await cleanupOldMediaAssets();
console.log(`Deleted ${result.assetsDeleted} assets, freed ${result.bytesFreed} bytes`);
```

**Eligibility Criteria:**
- `source === 'GENERATED'` (not user uploads)
- `createdAt < 90 days ago`
- `isFavorite === false`
- `isArchived === false`

### CORS Protection

**Location:** `middleware.ts`

**Configuration:**
```bash
ENABLE_CORS_PROTECTION=true
ALLOWED_ORIGINS=https://stakeandscale.de,http://localhost:3000
```

**Behavior:**
- Validates `Origin` header on all requests
- Handles OPTIONS preflight correctly
- Blocks disallowed origins with 403
- Allows same-origin requests (no Origin header)

**Headers Set:**
```
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, x-request-id
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### Security Headers

**Location:** `next.config.ts`

Already configured:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options: DENY` (clickjacking protection)
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (XSS protection)
- `Referrer-Policy`
- `Permissions-Policy`

### Cost Attack Mitigation

**Multi-Account Bypass Prevention:**

Scenario: Attacker creates 100 accounts (5000 free credits) to generate expensive media.

**Defenses:**
1. **IP Rate Limiting** - Max 5 signups/day per IP (`IP_RATE_LIMIT_SIGNUP=5`)
2. **IP API Limits** - Max 10 video generations/hour per IP (regardless of credits)
3. **Daily Quotas** - Max 3 videos/day per user (can't exhaust 50 credits on videos)
4. **Energy System** - Automatic refunds prevent double-charging on failures

**Cost Impact:**
- Without protection: 100 accounts × 1 video = **€300**
- With protection: 5 accounts × 3 videos = **€45** (93% reduction)

### Monitoring & Logging

**What to Monitor:**
1. **Rate Limit Hits:**
   ```bash
   grep "[Rate Limit]" vercel.log
   ```

2. **Daily Quota Exhaustion:**
   ```bash
   grep "daily-quota-exceeded" vercel.log
   ```

3. **Storage Growth:**
   ```bash
   # Check blob storage size (Vercel dashboard)
   ```

4. **Cleanup Job Status:**
   ```bash
   # Cron job logs (Vercel dashboard → Cron Jobs)
   ```

**Metrics to Track:**
- IP blocks per hour
- Daily quota exhaustion events (should be <5% of users)
- Blob storage size trend
- Cost per user (Replicate + ElevenLabs)

### Feature Flags (Quick Disable)

**Emergency Switches:**
```bash
ENABLE_IP_RATE_LIMIT=false        # Disable IP limiting
ENABLE_MEDIA_CLEANUP=false        # Stop cleanup cron
ENABLE_CORS_PROTECTION=false      # Allow all origins
MEDIA_CLEANUP_DRY_RUN=true        # Test cleanup without deleting
```

**Use Case:** If false positives occur, disable temporarily while investigating.

### Rollback Strategy

All security features are **additive** (not breaking):

1. **IP Rate Limiting** → Set `ENABLE_IP_RATE_LIMIT=false`
2. **Daily Quotas** → Remove checks from API routes (energy system still works)
3. **Blob Cleanup** → Set `ENABLE_MEDIA_CLEANUP=false`
4. **CORS** → Set `ENABLE_CORS_PROTECTION=false`

**No database migrations required** - all features use existing tables.

---

## Documentation References

- **Architecture:** `ARCHITECTURE.md` (overview)
- **System Design:** `SYSTEM-DESIGN.md` (business logic)
- **Migrations:** `MIGRATION-STEP-*.md` (schema changes)
- **Security:** `SECURITY-REPORT.md` (audits)
- **Launch:** `READY-TO-LAUNCH.md` (production checklist)

---

## Support

**GitHub Issues:** (not public yet)
**Documentation:** Internal docs in root directory
**Admin Contact:** Set via `ADMIN_EMAIL` env var

---

## AI SDK v6 Migration (Jarvis Mode Implementation)

The platform was migrated to **Vercel AI SDK v6** on 28.01.2026. This is a breaking change from v3/v4.

### 1. Key Changes in `useChat`
- **Manual Input Management:** The `input`, `handleInputChange`, and `handleSubmit` helpers are no longer automatically provided. They must be managed manually via `useState` and `sendMessage`.
- **Transports:** All AI calls must now use a `ChatTransport`. Use `DefaultChatTransport` for standard HTTP streaming.

```typescript
// Pattern: useChat in v6
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
```

### 2. Message Format (`parts` vs `content`)
- `UIMessage` no longer has a `content` property.
- It uses an array of `parts` (e.g., `{ type: 'text', text: '...' }`).
- **Rendering Pattern:**
```typescript
{message.parts.map((part, i) => (
  part.type === 'text' ? part.text : null
))}
```

### 3. API Route Changes
- **Asynchronous Conversion:** `convertToModelMessages` is now an **async** function.
- **Stream Response:** Use `result.toUIMessageStreamResponse()` instead of `toTextStreamResponse()` to preserve tool calls and rich data.

```typescript
// route.ts
const { messages } = await req.json();
const result = await streamText({
  model: myModel,
  messages: await convertToModelMessages(messages),
  // ...
});
return result.toUIMessageStreamResponse();
```

### 4. Persistence & Tools
- **UserMemory:** The Jarvis system uses `UserMemory` table for long-term personality storage.
- **Type Safety:** Use `as any` casting for tool definitions if SDK type-inference fails during build (v6.0.39 quirk).
