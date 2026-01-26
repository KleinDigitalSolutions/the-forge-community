# Security Enhancement Implementation Plan

**Project:** STAKE & SCALE - Voice & Media API Security Hardening
**Date:** 2025-01-19
**Status:** Implementation in Progress
**Risk Level:** HIGH (Cost exposure: €300+ per attack scenario)

---

## Executive Summary

This document outlines the security enhancements required to protect the Voice & Media Generation APIs from abuse, cost exploitation, and denial-of-service attacks.

**Current State:**
- ✅ User authentication via NextAuth
- ✅ Credit-based cost control (Energy System)
- ✅ Feature-level rate limiting (hourly)
- ❌ No IP-based rate limiting (multi-account bypass possible)
- ❌ No daily quotas for expensive operations (video generation)
- ❌ No blob storage lifecycle management (unbounded growth)
- ❌ No CORS/origin protection

**Target State:**
- Multi-layer defense: IP + User + Feature rate limiting
- Cost controls: Daily quotas for expensive operations
- Storage management: Auto-cleanup, quota enforcement
- Request protection: CORS, size limits, origin validation

---

## 1. IP-Based Rate Limiting

### Objective
Prevent attackers from creating multiple accounts to bypass credit limits.

### Design

**Library:** In-memory rate limiter (production: Redis-backed)
**Strategy:** Sliding window counter per IP address
**Graceful Degradation:** If rate limiter fails, allow request (fail-open)

**Tiers:**

| Tier | Limit | Window | Endpoints |
|------|-------|--------|-----------|
| Global API | 200 req | 1 hour | All `/api/*` |
| Voice Generation | 20 req | 1 hour | `/api/ventures/*/marketing/voice` |
| Video Generation | 10 req | 1 hour | `/api/ventures/*/marketing/media` (video) |
| Account Creation | 5 req | 24 hours | `/api/auth/*` (signup) |

### Implementation Files
- `lib/security/ip-rate-limit.ts` - Core rate limiter
- `lib/security/rate-limit-tiers.ts` - Tier configurations
- `middleware.ts` - Integration point

### Backward Compatibility
- Existing requests continue to work
- Rate limiting is additive (doesn't replace Energy System)
- Feature flag: `ENABLE_IP_RATE_LIMIT=true` (default: true)

### Rollback Plan
Set `ENABLE_IP_RATE_LIMIT=false` in environment variables.

---

## 2. Daily Quota System

### Objective
Limit expensive operations (video generation) per user per day, independent of credits.

### Design

**Integration:** Extends existing `consumeHourlyQuota` pattern in `lib/energy.ts`
**Storage:** Existing `RateLimitBucket` table (reuse infrastructure)
**Window:** 24-hour rolling window (not calendar day for fairness)

**Quotas:**

| Feature | Free Tier | Paid Tier | Cost per Unit |
|---------|-----------|-----------|---------------|
| Voice Generation | 20/day | 100/day | 5 credits |
| Image Generation | 15/day | 50/day | 4 credits |
| Video Generation | 3/day | 20/day | 40 credits |

### Implementation Files
- `lib/energy.ts` - Add `consumeDailyQuota()` function
- `app/api/ventures/[id]/marketing/voice/route.ts` - Integrate daily check
- `app/api/ventures/[id]/marketing/media/route.ts` - Integrate daily check

### Backward Compatibility
- Existing hourly quotas remain unchanged
- Daily quotas are checked AFTER energy reservation (fail fast)
- If daily limit hit, energy is refunded automatically

### Rollback Plan
Remove daily quota checks from API routes. Energy System remains functional.

---

## 3. Blob Storage Lifecycle Management

### Objective
Prevent unbounded storage growth from generated media assets.

### Design

**Strategy:** Auto-delete generated assets after retention period
**Retention:** 90 days for generated media (configurable)
**Execution:** Vercel Cron job (daily at 02:00 UTC)
**Exclusions:** User-uploaded assets, favorited assets

**Process:**
1. Query `MediaAsset` WHERE `source = 'GENERATED'` AND `createdAt < 90 days ago` AND `isFavorite = false`
2. Delete from Vercel Blob Storage
3. Soft-delete in DB (set `isArchived = true`, keep metadata for audit)
4. Log cleanup metrics to monitoring

### Implementation Files
- `app/api/cron/cleanup-media/route.ts` - Cron job endpoint
- `lib/storage/media-lifecycle.ts` - Cleanup logic
- `vercel.json` - Cron schedule configuration

### Backward Compatibility
- Existing assets are not touched until 90 days old
- Users can "favorite" assets to exclude from cleanup
- Soft-delete allows recovery if needed

### Rollback Plan
Disable cron job in `vercel.json`. No data is permanently deleted (soft-delete only).

---

## 4. CORS & Request Protection

### Objective
Prevent cross-site request forgery and oversized request attacks.

### Design

**CORS Policy:**
- Allowed Origins: `stakeandscale.de`, `*.stakeandscale.de`, `localhost:3000`
- Allowed Methods: GET, POST, DELETE, PUT, OPTIONS
- Credentials: true (cookies allowed)
- Preflight Cache: 3600s

**Request Size Limits:**
- JSON Body: 2 MB (sufficient for prompts + metadata)
- File Uploads: 10 MB (existing, unchanged)
- URL Length: 2048 chars

### Implementation Files
- `middleware.ts` - CORS headers, origin validation
- `next.config.js` - Body size limits
- `lib/security/request-validator.ts` - Validation utilities

### Backward Compatibility
- Localhost development continues to work
- Existing API clients unaffected (same origin)

### Rollback Plan
Remove CORS headers from middleware. All origins allowed (current state).

---

## 5. Environment Variables

**New Variables:**

```bash
# IP Rate Limiting
ENABLE_IP_RATE_LIMIT=true                    # Master switch
IP_RATE_LIMIT_GLOBAL=200                     # Requests per hour (all endpoints)
IP_RATE_LIMIT_VOICE=20                       # Voice generation per hour
IP_RATE_LIMIT_VIDEO=10                       # Video generation per hour
IP_RATE_LIMIT_SIGNUP=5                       # Account creation per 24h

# Daily Quotas
DAILY_QUOTA_VOICE_FREE=20                    # Free tier
DAILY_QUOTA_IMAGE_FREE=15
DAILY_QUOTA_VIDEO_FREE=3
DAILY_QUOTA_VOICE_PAID=100                   # Paid tier (future)
DAILY_QUOTA_IMAGE_PAID=50
DAILY_QUOTA_VIDEO_PAID=20

# Blob Storage Lifecycle
MEDIA_RETENTION_DAYS=90                      # Auto-delete after N days
ENABLE_MEDIA_CLEANUP=true                    # Master switch for cron job

# CORS
ALLOWED_ORIGINS=https://stakeandscale.de,http://localhost:3000
ENABLE_CORS_PROTECTION=true
```

**Defaults:** All features enabled by default in production. Can be disabled per-feature.

---

## 6. Database Schema Changes

**No new tables required!** Reuse existing infrastructure:

- `RateLimitBucket` - Already supports daily windows (composite key: userId, feature, windowStart)
- `MediaAsset.isArchived` - Already exists for soft-delete
- `EnergyTransaction` - Already tracks feature usage

**New Indexes (Performance):**

```sql
-- Speed up media cleanup query
CREATE INDEX CONCURRENTLY idx_media_asset_cleanup
ON "MediaAsset" (source, "createdAt", "isFavorite", "isArchived")
WHERE source = 'GENERATED';

-- Speed up rate limit queries (already exists, verify)
-- Composite index on RateLimitBucket already optimal
```

---

## 7. Monitoring & Alerts

**Metrics to Track:**

1. **Rate Limit Hits:**
   - IP blocks per hour
   - Daily quota exhaustion events
   - Feature breakdown (voice vs video)

2. **Cost Tracking:**
   - Total API spend per day (ElevenLabs + Replicate)
   - Top 10 users by spend
   - Anomaly detection (sudden spike)

3. **Storage:**
   - Blob storage size (GB)
   - Cleanup job success rate
   - Assets deleted per run

**Implementation:**
- Log to console (Vercel automatically ingests)
- Future: Datadog/Sentry integration

---

## 8. Testing Strategy

**Unit Tests:**
- IP rate limiter (burst, sustained, reset)
- Daily quota calculation (edge cases: midnight rollover)
- Media cleanup (favorites, retention period, soft-delete)

**Integration Tests:**
- Voice API with daily quota (exhaust limit, verify refund)
- Multi-account attack simulation (IP blocking)
- CORS preflight requests

**Load Tests:**
- 1000 concurrent requests to voice API
- Verify rate limiter performance (<10ms overhead)

---

## 9. Rollout Plan

**Phase 1: Monitoring (Week 1)**
- Deploy with `ENABLE_IP_RATE_LIMIT=false` (passive mode)
- Log what WOULD be blocked
- Analyze false positive rate

**Phase 2: Soft Launch (Week 2)**
- Enable IP rate limiting with generous limits (2x normal)
- Monitor user complaints
- Tune thresholds

**Phase 3: Full Rollout (Week 3)**
- Enable daily quotas
- Enable blob cleanup (dry-run first)
- Full CORS enforcement

**Phase 4: Optimization (Ongoing)**
- Migrate to Redis for distributed rate limiting
- Add Cloudflare Bot Management
- Email verification for new signups

---

## 10. Success Metrics

**Security:**
- Multi-account attacks: 0 successful bypasses
- Cost anomalies: <5% variance from baseline
- False positive blocks: <0.1% of requests

**Performance:**
- Rate limiter overhead: <10ms p95
- API response time: <500ms p95 (unchanged)
- Cron job execution: <30s per run

**User Experience:**
- Support tickets re: "blocked": <1% of users
- Daily quota exhaustion: <5% of free users (indicates healthy limits)

---

## 11. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| False positive IP blocks | Users can't access API | Medium | Generous limits, user-based fallback |
| Rate limiter failure | API DoS | Low | Fail-open (allow on error) |
| Blob cleanup deletes wrong files | Data loss | Low | Soft-delete, favorites protection |
| Daily quota too strict | User churn | Medium | Start generous, tune based on data |

---

## 12. Documentation Updates

**Files to Update:**
- `CLAUDE.md` - Add security patterns, rate limiting, daily quotas
- `README.md` - Add new env vars
- `.env.example` - Add security variables
- API docs (future) - Rate limit headers, quota responses

---

**Next Steps:** Proceed to Phase 2 - Implementation

