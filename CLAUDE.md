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
- `platformFeeAmount`, `platformFeePercent`

---

## Authentication Flow

### NextAuth v5 (Magic Link - Open Registration)

**Flow:**
1. User enters email at `/login`
2. Magic link sent via Resend (no approval needed)
3. User clicks link → JWT session created
4. New users automatically created with 50 AI credits (Energy System)
5. Protected routes check session via middleware

**Legacy Notion Check (Being Phased Out):**
```typescript
// auth.ts - signIn callback (old pattern, transitioning to open registration)
async signIn({ user }) {
  const founder = await getFounderByEmail(user.email);
  if (!founder || founder.status === 'inactive') {
    return false; // Access denied
  }
  return true;
}
```

**Important:** The platform is transitioning from a gated community (Notion-based approval) to **open registration** with a freemium model. New code should not depend on Notion checks.

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

### Multi-Provider Setup

**Primary:** Gemini Flash 2.0 (`@ai-sdk/google`)
**Fallback:** Groq Llama 3.3 70B (`@ai-sdk/openai` with custom baseURL)

**Usage Pattern:**
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
  totalCredits: number;   // Lifetime credits received
  creditsUsed: number;    // Lifetime credits spent
}
```

### Usage Pattern

**Server-side credit check:**
```typescript
// Before AI operation
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user || user.credits < REQUIRED_CREDITS) {
  throw new Error('Insufficient credits');
}

// Perform AI operation
const result = await generateContent(prompt);

// Deduct credits
await prisma.user.update({
  where: { id: userId },
  data: {
    credits: { decrement: REQUIRED_CREDITS },
    creditsUsed: { increment: REQUIRED_CREDITS }
  }
});
```

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
├── ai.ts                # Unified AI helper
├── moderation.ts        # Content moderation
├── stripe.ts            # Stripe SDK
├── notion.ts            # Notion API (legacy)
├── db-security.ts       # RLS helpers (secureQuery)
├── venture-templates.ts # Wizard templates
└── knowledge-base.ts    # AI chatbot knowledge

migrations/              # Manual SQL migrations
├── 001_add_brand_dna.sql
├── 002_add_squad_member.sql
├── 003_add_stripe_connect.sql
└── 004_enable_rls.sql
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

### 5. NextAuth v5 Async Params

**Next.js 16 requires async params:**
```typescript
// ❌ Old
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;
}

// ✅ New
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

### 6. Notion Sync

**Notion is legacy. For new features, use Prisma only.**

Notion is still used for:
- Founder access control (gatekeeper in `auth.ts` - being removed)
- Financial transaction logging (being migrated)

**Do NOT:**
- Write new features that depend on Notion
- Sync data bidirectionally (race conditions)

### 7. Content Moderation Everywhere

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
AUTH_URL=http://localhost:3000

# AI & Energy System
GEMINI_API_KEY=xxx
GROQ_API_KEY=xxx             # Optional, fallback provider
INITIAL_CREDITS=50           # Starting credits for new users (default: 50)

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

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
