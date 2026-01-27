# Stripe Webhook Setup Guide

## 🎯 Ziel
Dein Backend erhält automatisch Benachrichtigungen von Stripe, wenn:
- Jemand Credits kauft → Credits werden automatisch gutgeschrieben
- Ein Abo bezahlt wird → Monatliche Credits werden vergeben
- Zahlung fehlschlägt → Subscription-Status wird angepasst
- Abo gekündigt wird → User wird auf Free Tier zurückgestuft

---

## 📋 Voraussetzungen

### 1. Stripe Secret Key eintragen

**WICHTIG:** Du hast aktuell den **Webhook Secret** anstelle des **Secret Keys** in deiner `.env.local`!

#### So findest du den richtigen Key:

1. Gehe zu: [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
2. Kopiere den **Secret key** (beginnt mit `sk_test_` für Testmodus)
3. Ersetze in `.env.local` Zeile 36:
   ```bash
   STRIPE_SECRET_KEY="sk_test_DEIN_ECHTER_KEY_HIER"
   ```

### 2. Stripe Metadaten ergänzen

#### Für AI Credits Produkte:

1. Gehe zu: [Stripe Dashboard → Produkte](https://dashboard.stripe.com/test/products)
2. Klicke auf **"AI Credits"** (prod_Trrai3GccoUlEf)
3. Bearbeite **jeden Preis** und füge Metadaten hinzu:

| Preis | Metadaten hinzufügen |
|-------|----------------------|
| 9€ (price_1Su7rMAmspxoSxsTPUNVx40o) | `credits` = `100` |
| 35€ (price_1Su7uvAmspxoSxsT7VbyEvgM) | `credits` = `400` |
| 99€ (price_1Su7uvAmspxoSxsTCpn1EXKc) | `credits` = `1000` |

**So geht's:**
- Preis anklicken → **Metadata** → **Add metadata**
- Key: `credits`
- Value: `100` (entsprechend dem Preis)

#### Für Platform Access (Optional):

Falls du monatliche Credits für Abo-Mitglieder vergeben möchtest:

1. Klicke auf **"Stake & Scale – Platform Access"** (prod_TrrW2ZEHkuluzN)
2. Bearbeite den Preis (price_1Su7nCAmspxoSxsTbeDeDJUt)
3. Füge Metadaten hinzu:
   - Key: `monthly_credits`
   - Value: `200` (z.B. 200 Credits pro Monat)

---

## 🔗 Webhook-Endpunkt anlegen

### Schritt 1: Webhook in Stripe Dashboard erstellen

1. Gehe zu: [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klicke auf **"Add endpoint"**

### Schritt 2: Endpoint URL eintragen

#### Für Produktiv (Vercel Deployment):
```
https://www.stakeandscale.de/api/webhooks/stripe
```

#### Für Lokal (mit ngrok):
```
https://DEINE-NGROK-URL.ngrok.app/api/webhooks/stripe
```

**Ngrok Setup (für lokales Testing):**
```bash
# Installiere ngrok (falls noch nicht vorhanden)
brew install ngrok  # macOS
# oder: npm install -g ngrok

# Starte lokalen Server
npm run dev

# In neuem Terminal: Tunnel zu localhost:3000
ngrok http 3000

# Kopiere die HTTPS-URL (z.B. https://abc123.ngrok.app)
```

### Schritt 3: Events auswählen

**WICHTIG:** Wähle NUR diese 4 Events aus:

✅ **Pflicht-Events:**
- `checkout.session.completed` - Credits kaufen / Abo starten
- `invoice.payment_succeeded` - Monatliche Renewal Credits
- `invoice.payment_failed` - Zahlung fehlgeschlagen
- `customer.subscription.deleted` - Abo gekündigt

**So geht's:**
- Klicke auf **"Select events"**
- Suche nach jedem Event und wähle es aus
- Klicke **"Add events"**

### Schritt 4: Webhook Secret kopieren

Nach dem Anlegen zeigt Stripe:
```
whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Das hast du bereits in deiner `.env.local` als `STRIPE_WEBHOOK_SECRET`** ✅

---

## ✅ Vercel ENV-Variablen setzen

Damit die Webhooks in Production funktionieren, musst du die ENV-Variablen auch in Vercel setzen:

### Vercel Dashboard:

1. Gehe zu: [Vercel Dashboard → Projekt → Settings → Environment Variables](https://vercel.com/bucci369s-projects/the-forge-community/settings/environment-variables)

2. Füge folgende Variablen hinzu:

| Key | Value | Env |
|-----|-------|-----|
| `STRIPE_SECRET_KEY` | `sk_test_XXX` (dein echter Key!) | Production + Preview + Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_d653468e...` (bereits in .env.local) | Production + Preview + Development |
| `NEXT_PUBLIC_STRIPE_PRICE_PLATFORM_ACCESS` | `price_1Su7nCAmspxoSxsTbeDeDJUt` | Production + Preview + Development |
| `NEXT_PUBLIC_STRIPE_PRICE_CREDITS_SMALL` | `price_1Su7rMAmspxoSxsTPUNVx40o` | Production + Preview + Development |
| `NEXT_PUBLIC_STRIPE_PRICE_CREDITS_MEDIUM` | `price_1Su7uvAmspxoSxsT7VbyEvgM` | Production + Preview + Development |
| `NEXT_PUBLIC_STRIPE_PRICE_CREDITS_LARGE` | `price_1Su7uvAmspxoSxsTCpn1EXKc` | Production + Preview + Development |

3. **Deploy neu**, damit die ENV-Variablen übernommen werden:
```bash
git add .
git commit -m "feat: Stripe Webhooks & Credit System"
git push
```

---

## 🧪 Testing

### 1. Lokales Testing mit Stripe CLI

```bash
# Installiere Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Webhook Events lokal forwarden
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Du erhältst einen Webhook Secret für lokales Testing (beginnt mit whsec_)
# Setze diesen temporär in .env.local als STRIPE_WEBHOOK_SECRET
```

### 2. Test-Events triggern

```bash
# Test: Credit-Kauf
stripe trigger checkout.session.completed

# Test: Abo Renewal
stripe trigger invoice.payment_succeeded

# Test: Zahlung fehlgeschlagen
stripe trigger invoice.payment_failed

# Test: Abo gekündigt
stripe trigger customer.subscription.deleted
```

### 3. Logs überprüfen

In deinem Terminal solltest du sehen:
```
[WEBHOOK] Processing: checkout.session.completed (evt_XXX)
[CHECKOUT] Processing for: user@example.com
[CHECKOUT] Granting 100 credits to user@example.com
[CHECKOUT] ✅ 100 credits granted. New balance: 150
[WEBHOOK] ✅ Successfully processed: evt_XXX
```

### 4. Stripe Dashboard Testing

1. Gehe zu: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klicke auf deinen Webhook-Endpunkt
3. Klicke **"Send test webhook"**
4. Wähle Event (z.B. `checkout.session.completed`)
5. Überprüfe Response:
   - **Status 200** = ✅ Erfolg
   - **Status 400/500** = ❌ Fehler (siehe Logs)

---

## 🚀 Production Deployment

### Checkliste:

- [x] `.env.local` korrigiert (STRIPE_SECRET_KEY ersetzt)
- [x] Stripe Metadaten hinzugefügt (`credits` für alle Credit-Packs)
- [x] Webhook-Endpunkt in Stripe angelegt (https://www.stakeandscale.de/api/webhooks/stripe)
- [x] 4 Events ausgewählt (checkout.session.completed, invoice.payment_succeeded, invoice.payment_failed, customer.subscription.deleted)
- [x] STRIPE_WEBHOOK_SECRET aus Stripe Dashboard kopiert
- [ ] Vercel ENV-Variablen gesetzt
- [ ] Code deployed
- [ ] Test-Kauf durchgeführt
- [ ] Credits im Dashboard überprüft

### Test-Kauf durchführen:

1. Gehe zu: https://www.stakeandscale.de/pricing
2. Wähle "AI Credits" → 9€ (100 Credits)
3. Nutze Stripe Test-Kreditkarte:
   - Kartennummer: `4242 4242 4242 4242`
   - Ablaufdatum: Beliebig (Zukunft)
   - CVC: Beliebig (3 Ziffern)
4. Kaufe Credits
5. Überprüfe in `/dashboard` ob Credits gutgeschrieben wurden

---

## 📊 Monitoring

### Webhook-Logs in Stripe Dashboard:

1. Gehe zu: [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klicke auf deinen Endpunkt
3. Scrolle zu **"Logs"**
4. Siehst du:
   - ✅ **200 OK** = Webhook erfolgreich verarbeitet
   - ❌ **400/500** = Fehler (siehe Details)

### Vercel Logs:

```bash
# Echtzeit-Logs anschauen
vercel logs --follow

# Nach Webhook-Events filtern
vercel logs | grep "WEBHOOK"
```

---

## 🆘 Troubleshooting

### Problem: "Webhook Error: No signatures found matching the expected signature"

**Ursache:** Falsches `STRIPE_WEBHOOK_SECRET`

**Lösung:**
1. Gehe zu Stripe Dashboard → Webhooks
2. Klicke auf deinen Endpunkt
3. Klicke **"Reveal"** beim Signing Secret
4. Kopiere und ersetze in `.env.local` und Vercel

---

### Problem: Credits werden nicht gutgeschrieben

**Ursache:** Metadaten fehlen in Stripe

**Lösung:**
1. Überprüfe in Stripe Dashboard → Produkte → AI Credits
2. Klicke auf jeden Preis
3. Stelle sicher, dass `credits` Metadata gesetzt ist (z.B. `100` für 9€)

---

### Problem: "User not found" im Webhook

**Ursache:** Email-Adresse stimmt nicht mit DB überein

**Lösung:**
1. Überprüfe welche Email in Stripe verwendet wurde
2. Überprüfe ob User in DB existiert:
```sql
SELECT email FROM "User" WHERE email = 'user@example.com';
```

---

## ✨ Zusammenfassung

Nach diesem Setup hast du:

- ✅ Automatische Credit-Gutschrift bei Kauf
- ✅ Monatliche Subscription Credits
- ✅ Automatisches Downgrade bei Kündigungen
- ✅ Saubere Fehlerbehandlung mit Stripe Retry
- ✅ Vollständige Audit-Historie (EnergyTransaction)
- ✅ Production-Ready Billing System

**Dein SaaS-Billing ist jetzt komplett! 🚀**
