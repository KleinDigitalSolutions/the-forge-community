# 🔐 Security Features - Quick Reference

Quick guide for using the new security features in THE FORGE.

---

## 🚀 Quick Deploy

```bash
# 1. Deploy code
git push origin main

# 2. Run setup (as admin, in browser or curl)
/api/admin/setup-security        # RLS + karma column
/api/admin/setup-webhook-table   # Webhook idempotency

# 3. Add to .env
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard

# 4. Test
# Try 6 chatbot requests in 1 minute → should rate limit
```

---

## 📦 New Features

### 1. Row-Level Security (RLS)

**When to use:** All database queries involving user data

**Before:**
```typescript
// UNSAFE - could leak data
const users = await sql`SELECT * FROM users`;
```

**After:**
```typescript
import { secureQuery } from '@/lib/db-security';

// SAFE - automatic RLS enforcement
const users = await secureQuery(async () => {
  return await sql`SELECT * FROM users WHERE city = 'Berlin'`;
});
// Only returns current user's data
```

**Manual mode:**
```typescript
import { setCurrentUser } from '@/lib/db-security';

const session = await auth();
await setCurrentUser(session.user.email);

// Now all queries respect RLS
const result = await sql`SELECT * FROM users`;
```

---

### 2. Admin Authorization

**When to use:** Any admin-only endpoint

**Pattern:**
```typescript
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck; // Auto-returns 403

  // Admin logic here
  return NextResponse.json({ message: 'Admin only!' });
}
```

**Check without blocking:**
```typescript
import { isAdmin } from '@/lib/admin';

const userIsAdmin = await isAdmin();
if (userIsAdmin) {
  // Show admin UI
}
```

---

### 3. Rate Limiting

**When to use:** Public endpoints, expensive operations

**Presets:**
```typescript
import { RateLimiters } from '@/lib/rate-limit';

// AI Chatbot: 5/min
const limited = await RateLimiters.aiChatbot(req);
if (limited) return limited;

// General API: 60/min
const limited = await RateLimiters.api(req);

// Auth: 5/15min
const limited = await RateLimiters.auth(req);

// Heavy ops: 10/hour
const limited = await RateLimiters.heavy(req);
```

**Custom limiter:**
```typescript
import { createRateLimiter } from '@/lib/rate-limit';

const customLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Custom rate limit exceeded'
});

export async function POST(req: Request) {
  const limited = await customLimiter(req);
  if (limited) return limited;

  // Your logic
}
```

---

### 4. Webhook Idempotency

**Automatic!** No code changes needed.

The webhook handler now:
- ✅ Checks if event already processed
- ✅ Stores event ID in database
- ✅ Skips duplicate events
- ✅ Logs all events

**Check processed events:**
```sql
SELECT * FROM webhook_events ORDER BY processed_at DESC LIMIT 10;
```

---

## 🎯 Common Patterns

### Secure API Route Template

```typescript
import { auth } from '@/auth';
import { secureQuery } from '@/lib/db-security';
import { RateLimiters } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. Rate limit
  const limited = await RateLimiters.api(req);
  if (limited) return limited;

  // 2. Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Secure query (RLS automatic)
  const data = await secureQuery(async () => {
    return await sql`
      SELECT * FROM your_table
      WHERE user_email = ${session.user.email}
    `;
  });

  return NextResponse.json({ data: data.rows });
}
```

### Admin-Only Route Template

```typescript
import { requireAdmin } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  // Quick admin check
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  // Admin logic
  return NextResponse.json({ message: 'Success' });
}
```

---

## 🧪 Testing

### Test RLS
```bash
# As regular user
curl https://your-domain.com/api/me
# Should only return YOUR data
```

### Test Rate Limiting
```bash
# Send 6 requests quickly
for i in {1..6}; do
  curl -X POST https://your-domain.com/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"test"}'
done
# Last request should return 429
```

### Test Admin Lock
```bash
# As non-admin
curl https://your-domain.com/api/admin/migrate-db
# Should return 403 Forbidden
```

### Test Webhook Idempotency
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger same event twice
stripe trigger checkout.session.completed
stripe trigger checkout.session.completed

# Check logs - second event should say "already processed"
```

---

## 🔧 Troubleshooting

### RLS not working?

1. Did you run `/api/admin/setup-security`?
2. Are you using `secureQuery()` wrapper?
3. Check Postgres logs for policy errors

```typescript
// Debug mode
import { setCurrentUser } from '@/lib/db-security';

const session = await auth();
console.log('Current user:', session?.user?.email);
await setCurrentUser(session.user.email);
```

### Rate limit too strict?

Edit `lib/rate-limit.ts`:

```typescript
export const RateLimiters = {
  aiChatbot: createRateLimiter({
    maxRequests: 10, // Increase from 5
    windowMs: 60 * 1000,
  }),
  // ...
};
```

### Webhook not receiving events?

1. Check Stripe Dashboard → Webhooks → Recent Events
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Test signature verification:

```bash
# Check webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/stripe \
  -H "Stripe-Signature: invalid"
# Should return "Missing Stripe Signature" or "Webhook Error"
```

### Admin email not working?

```bash
# Check environment variable
echo $ADMIN_EMAIL

# Verify in code
import { isAdmin } from '@/lib/admin';
console.log('Is admin?', await isAdmin());
```

---

## 📋 Checklist for New Routes

When creating a new API route, ask:

- [ ] **Public or Auth?** → Add `auth()` check
- [ ] **Queries users table?** → Use `secureQuery()`
- [ ] **Expensive operation?** → Add rate limiter
- [ ] **Admin only?** → Add `requireAdmin()`
- [ ] **Accepts payments?** → Ensure webhook idempotency

---

## 🎓 Best Practices

1. **Always use `secureQuery()` for user data**
   ```typescript
   // ✅ Good
   await secureQuery(() => sql`SELECT * FROM users`);

   // ❌ Bad
   await sql`SELECT * FROM users`;
   ```

2. **Rate limit public endpoints**
   ```typescript
   // ✅ Good
   const limited = await RateLimiters.api(req);
   if (limited) return limited;

   // ❌ Bad
   // No rate limiting on /api/chat
   ```

3. **Lock admin endpoints**
   ```typescript
   // ✅ Good
   const adminCheck = await requireAdmin();
   if (adminCheck) return adminCheck;

   // ❌ Bad
   // No auth check on /api/admin/migrate-db
   ```

4. **Handle webhook duplicates**
   ```typescript
   // ✅ Good (automatic now)
   // Webhook handler checks idempotency

   // ❌ Bad
   // Processing same event twice
   ```

---

## 🚨 Security Reminders

- **Never log sensitive data** (passwords, tokens, full credit cards)
- **Always validate user input** (SQL injection, XSS)
- **Use HTTPS in production** (Vercel auto-enables)
- **Rotate secrets regularly** (AUTH_SECRET, STRIPE keys)
- **Monitor rate limit logs** (detect attacks)

---

## 📞 Support

Issues? Check:
1. Vercel logs (Functions tab)
2. Postgres logs (Database tab)
3. Stripe Dashboard → Events (for webhooks)
4. `SECURITY-SPRINT.md` (full documentation)

---

*Last updated: January 18, 2026*
