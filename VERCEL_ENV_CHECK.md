# Vercel Environment Variables - Checklist

## Kopiere diese ENV vars in Vercel Dashboard

### Database
```
DATABASE_URL
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_PRISMA_URL
```

### Auth
```
AUTH_SECRET
AUTH_RESEND_KEY
AUTH_URL (https://www.stakeandscale.de)
```

### Stripe (WICHTIG!)
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

STRIPE_PRODUCT_PLATFORM_ACCESS
STRIPE_PRICE_PLATFORM_ACCESS
STRIPE_PRODUCT_AI_CREDITS
STRIPE_PRICE_CREDITS_SMALL
STRIPE_PRICE_CREDITS_MEDIUM
STRIPE_PRICE_CREDITS_LARGE

NEXT_PUBLIC_STRIPE_PRICE_PLATFORM_ACCESS
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_SMALL
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_MEDIUM
NEXT_PUBLIC_STRIPE_PRICE_CREDITS_LARGE
```

### Blob Storage (für PDFs)
```
BLOB_READ_WRITE_TOKEN
```

### AI
```
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.0-flash-lite
GROQ_API_KEY
```

### Optional
```
ADMIN_EMAIL
INITIAL_CREDITS=50
```

## Nach Deployment

1. Stripe Dashboard → Webhooks
2. Add endpoint: `https://www.stakeandscale.de/api/webhooks/stripe`
3. Events:
   - checkout.session.completed
   - invoice.payment_succeeded
   - invoice.payment_failed
   - customer.subscription.deleted
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET` in Vercel
