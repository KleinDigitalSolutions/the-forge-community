# Security Assessment Report - stakeandscale.de
Date: 2026-01-22
Target: www.stakeandscale.de
Scope: Static review of Next.js API routes in /Users/bucci369/the-forge-community
Out of scope: Live penetration testing, network scanning, runtime configuration, dependency vulnerability audit

## Summary
- High: 2
- Medium: 3
- Low: 2

## Findings

### [HIGH] Unauthenticated access to internal data and write actions
Affected:
- app/api/announcements/route.ts:6
- app/api/announcements/route.ts:19
- app/api/documents/route.ts:6
- app/api/documents/route.ts:19
- app/api/events/route.ts:6
- app/api/events/route.ts:19
- app/api/tasks/route.ts:6
- app/api/tasks/route.ts:19
- app/api/tasks/route.ts:51
- app/api/transactions/route.ts:6
- app/api/transactions/route.ts:19
- app/api/transactions/summary/route.ts:6
- app/api/seed-forum/route.ts:4

Impact:
Anyone can read or mutate internal Notion-backed data (announcements, documents, events, tasks, transactions) and seed forum content without authentication. This enables data leakage, data tampering, spam, and reputational damage.

Recommendation:
Require authentication and role-based authorization (admin or member) for all read/write endpoints that are not intended to be public. Remove or lock down the seed endpoint in production. Add rate limiting on write routes.

### [HIGH] SSRF risk in link preview endpoint
Affected:
- app/api/link-preview/route.ts:11
- app/api/link-preview/route.ts:36

Impact:
The endpoint fetches attacker-controlled URLs without restricting protocol or private IP ranges. This can be used to access internal services (e.g., metadata endpoints), scan internal networks, or exfiltrate data.

Recommendation:
Allowlist protocols (http/https only) and block private or local ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1, fc00::/7, fe80::/10). Resolve DNS and re-check the resolved IP. Consider an allowlist of domains if possible.

### [MEDIUM] Debug environment endpoint exposes secret metadata
Affected:
- app/api/debug-env/route.ts:5

Impact:
Public access reveals which secrets are present and their lengths. This can help attackers narrow targets and validate environment configuration.

Recommendation:
Remove this endpoint in production or protect it with admin authentication and an explicit feature flag.

### [MEDIUM] Public AI endpoints without auth or rate limiting
Affected:
- app/api/chat/landing/route.ts:7
- app/api/voice/polish/route.ts:9
- app/api/forum/trending/route.ts:21

Impact:
These endpoints can be abused to generate unbounded AI costs or resource exhaustion.

Recommendation:
Add rate limiting (RateLimiters.aiChatbot or similar), request size limits, and optionally require authentication or a CAPTCHA for public access.

### [MEDIUM] Vote manipulation without authentication
Affected:
- app/api/votes/route.ts:6
- app/api/votes/route.ts:19

Impact:
Anyone can read and modify vote counts, allowing integrity attacks on community metrics.

Recommendation:
Require authenticated users, enforce one-vote-per-user (or signed tokens), and add rate limiting.

### [LOW] Founder application endpoint lacks anti-spam controls
Affected:
- app/api/founders/add/route.ts:5

Impact:
Attackers can spam submissions, fill the database, and trigger unnecessary Notion syncs.

Recommendation:
Add rate limiting and bot protection (e.g., CAPTCHA or proof-of-work) and validate email formats.

### [LOW] Cron endpoint can be public if secret not set
Affected:
- app/api/cron/check-deadlines/route.ts:16

Impact:
If CRON_SECRET is not configured, the endpoint is unauthenticated and can be triggered by anyone, which may create spammy notifications or load spikes.

Recommendation:
Require a secret or verify Vercel cron headers. Fail closed if CRON_SECRET is missing.

## Notes
- This report is based on static code review only. No live scanning of www.stakeandscale.de was performed.
- If you want a live scan, confirm scope (domains/subdomains), profile (quick/standard), and a time window, and I can run it.
