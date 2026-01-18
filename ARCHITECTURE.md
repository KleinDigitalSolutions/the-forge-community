# 🏗 SYSTEM ARCHITECTURE & WIRING (The Forge)

*Status: Production-Ready (v2.0)*
*Last Updated: 18.01.2026*

This document describes the exact technical wiring of "The Forge Community OS". It is the **Source of Truth** for understanding how Vercel, Notion, and Postgres interact.

---

## 1. The Core Stack (Hybrid Architecture)

The system uses a **Hybrid Database Approach** to balance Admin-Control (Notion) with App-Performance (Postgres).

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15+ (App Router) | High-performance React UI. |
| **Styling** | Tailwind CSS v4 | "Zinc" Theme, configured via CSS variables in `@theme`. |
| **Auth** | NextAuth v5 (Beta) | Magic Links via Resend. Postgres Adapter. |
| **DB (Admin)** | **Notion API** | Master data for Founders, Finances, Tasks (The "Truth"). |
| **DB (App)** | **Vercel Postgres** | High-freq user data (Profile, Karma, Votes) & Auth sessions. |
| **Storage** | Vercel Blob | Image hosting for forum uploads. |

---

## 2. Authentication & Gatekeeping

The login flow is strictly gated.

1.  **Entry:** User enters email at `/login`.
2.  **The Notion Check:** `auth.ts` calls `getFounderByEmail` in `lib/notion.ts`.
    *   *Logic:* It searches the Notion "Founders" Database for the email.
    *   *Result:* If found -> Magic Link sent. If not -> Access Denied (403).
    *   *Admin Override:* The email defined in `ADMIN_EMAIL` (`.env.local`) always gets access.
3.  **Profile Guard:** After login, `AuthGuard.tsx` checks `/api/me`.
    *   If Postgres profile data (Name, Address, Phone) is missing -> **Hard Redirect** to `/profile`.
    *   User *cannot* use the app until the dossier is complete.

---

## 3. The "Notion Bridge" (`lib/notion.ts`)

**⚠️ CRITICAL IMPLEMENTATION DETAILS ⚠️**

Notion APIs are tricky. We implemented specific wrappers to handle "Data Sources" vs "Databases".

### A. The "ID Parsing" Fix
*   **Problem:** Copy-pasting IDs often adds hidden newlines (`\n`), causing `invalid_uuid` errors.
*   **Solution:** All environment variables in `lib/notion.ts` are wrapped with `.trim()`.

### B. Read vs. Write (The Split)
*   **Reading (`query`):** We use `resolveNotionSource`. It detects if a DB is a "Data Source" (synced view) and uses the **internal ID** to fetch data.
*   **Writing (`create`):** We MUST use the **original Database ID** from `.env`. The internal ID fails for writes.
    *   *Code Rule:* `add*` functions always use `parent: { database_id: originalEnvId }`.

### C. SDK Workaround
*   Our Notion SDK version sometimes moves `query` to `dataSources`.
*   **Solution:** `performQuery` function automatically checks both `notion.databases.query` and `notion.dataSources.query`.

---

## 4. Environment Variables (`.env.local`)

These keys are **mandatory** for the system to run.

```bash
# App Secrets
NOTION_API_KEY="secret_..."
AUTH_SECRET="secret_..."
AUTH_RESEND_KEY="re_..."
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
POSTGRES_URL="..."

# Admin
ADMIN_EMAIL="info@kleindigitalsolutions.de"

# Notion Database IDs (Must be UUIDs)
NOTION_DATABASE_ID="..."          # Founders Master List
NOTION_FORUM_DATABASE_ID="..."    # Forum Content
NOTION_VOTES_DATABASE_ID="..."    # Voting
NOTION_TASKS_DATABASE_ID="..."    # Tasks
NOTION_TRANSACTIONS_DATABASE_ID="..." # Finances
NOTION_ANNOUNCEMENTS_DATABASE_ID="..."
NOTION_DOCUMENTS_DATABASE_ID="..."
NOTION_EVENTS_DATABASE_ID="..."
NOTION_GROUPS_DATABASE_ID="..."
```

---

## 5. Design System (Tailwind v4)

We utilize the **Tailwind v4 Alpha**. Note the configuration differences:

*   **Config:** No `tailwind.config.js`. Everything is in `app/globals.css`.
*   **Theme:** Variables are defined under `@theme` using `--color-*` syntax.
*   **Layout:** All internal pages use `<PageShell>` which provides the **Sidebar** and layout context. Public pages use the legacy `<Header>`.

---

## 6. Key Workflows

### Forum Posting
1.  Frontend sends Markdown content + Image URLs (from Blob) to `/api/forum`.
2.  API validates session against Notion.
3.  API creates a page in Notion (using `database_id`).
4.  User Karma is calculated on-the-fly based on likes.

### Profile Sync
1.  User updates data at `/profile`.
2.  Data is saved to **Vercel Postgres** (fast read for app).
3.  Data is simultaneously **pushed to Notion** (updates the Founder's page props).

---

## 7. Deployment Checklist

When deploying to Vercel:
1.  Ensure all `.env` vars are synced (`node push-to-vercel-full.js`).
2.  Ensure `@vercel/blob`, `react-markdown`, and `remark-gfm` are installed.
3.  Run `vercel deploy --prod`.

**Current Status:** STABLE.
