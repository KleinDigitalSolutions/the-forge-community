# Login-Vereinfachung - Abgeschlossen ✅

## Was wurde gemacht?

### 1. Landing Page vereinfacht (app/page.tsx)

**Vorher:**
- 3 separate Anmeldeoptionen:
  - "Free Trial" (Sofort-Zugriff)
  - "Kapital-Partner" Button
  - "Builder" Button

**Jetzt:**
- **1 zentraler Login-Button** ("Login / Anmelden")
- Beide Login-Methoden werden auf der Login-Seite angeboten
- Optionale Bewerbung für Batch-Partner als sekundärer Link

### 2. Login-Seite (app/login/page.tsx)

**Funktionen:**
- ✅ Magic Link (Email) - bereits implementiert
- ✅ Google Login - bereits implementiert (zeigt sich wenn ENV vars gesetzt sind)
- ✅ Beide Methoden führen zum Onboarding (wenn noch nicht completed)

**Login-Flow:**
```
User klickt "Login / Anmelden" auf Landing
  ↓
Login-Seite (/login)
  ↓
Wählt Methode:
  → Google Login (1 Klick)
  → Magic Link (Email eingeben → Link klicken)
  ↓
Session wird erstellt
  ↓
Middleware prüft: onboardingComplete?
  ↓
  [false] → Dashboard mit Onboarding-Wizard
  [true]  → Dashboard (normal)
```

### 3. Google OAuth Setup (neu)

**Datei:** `.env.local`
```bash
AUTH_GOOGLE_ID="DEINE_GOOGLE_CLIENT_ID_HIER"
AUTH_GOOGLE_SECRET="DEIN_GOOGLE_CLIENT_SECRET_HIER"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="1"
```

**Anleitung:** `GOOGLE_OAUTH_SETUP.md` (Schritt-für-Schritt Guide)

### 4. Onboarding-Flow (unverändert)

**Bereits korrekt implementiert:**
- Nach Login (egal welche Methode) prüft Middleware `onboardingComplete`
- Wenn `false`: Redirect zu `/dashboard?onboarding=required`
- OnboardingWizard sammelt:
  - Name
  - Telefon
  - Geburtstag
  - Adresse
- Nach Completion: `onboardingComplete: true` → normaler Dashboard-Zugriff

---

## Nächste Schritte

### Sofort (Development):

1. **Google OAuth Credentials erstellen:**
   - Folge Anleitung in `GOOGLE_OAUTH_SETUP.md`
   - Trage Client-ID und Secret in `.env.local` ein
   - Server neu starten: `npm run dev`

2. **Testen:**
   ```bash
   npm run dev
   ```
   - Gehe zu: http://localhost:3000
   - Klicke "SEQUENZ STARTEN" (scrollt zu Apply-Section)
   - Klicke "Login / Anmelden"
   - Teste beide Login-Methoden:
     - Google Login
     - Magic Link (Email)

### Production (Vercel):

1. **ENV vars in Vercel hinzufügen:**
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=1`
   - `AUTH_URL=https://stakeandscale.de`

2. **Google OAuth Redirect URI:**
   - In Google Console: `https://stakeandscale.de/api/auth/callback/google`

3. **Redeploy:** Vercel wird automatisch neu deployen

---

## Technische Details

### Landing Page (app/page.tsx)

**Änderungen (Zeile 1042-1088):**
- Entfernt: 3 separate Buttons (Free Trial, Kapital-Partner, Builder)
- Neu: 1 großer "Login / Anmelden" Button
- Zentriert, mit Icon und Beschreibung
- Hinweis auf beide Login-Methoden (Google + Magic Link)
- Bewerbung für Batch-Partner als sekundärer Link

### Login-Seite (app/login/page.tsx)

**Bereits vorhanden:**
- Zeile 177-208: Google Login Button (conditional rendering)
- Zeile 119-175: Magic Link Formular
- Beide führen zu `/dashboard` (oder Onboarding wenn nötig)

### Auth-Konfiguration (auth.ts)

**Bereits konfiguriert:**
- Zeile 18-51: Resend Provider (Magic Link)
- Zeile 53-60: Google Provider (wenn ENV vars gesetzt)
- Zeile 79-88: JWT Callback setzt `onboardingComplete` in Session
- Zeile 104-116: `createUser` Event vergibt 50 Credits

### Middleware (middleware.ts)

**Onboarding-Check (Zeile 64-81):**
```typescript
const onboardingComplete = session.user.onboardingComplete === true;
if (!onboardingComplete && !isAllowed) {
  return NextResponse.redirect('/dashboard?onboarding=required');
}
```

**Funktioniert für:**
- ✅ Google Login
- ✅ Magic Link
- ✅ Beide führen zum gleichen Onboarding-Flow

---

## User Experience

### Vorher (3 Optionen):
```
Landing → [Free Trial] → Login → Onboarding
Landing → [Kapital-Partner] → Bewerbungsformular → Warteschlange
Landing → [Builder] → Bewerbungsformular → Warteschlange
```

**Problem:** Verwirrend, zu viele Entscheidungen

### Jetzt (1 Login):
```
Landing → [Login / Anmelden] → Login-Seite → Wähle Methode:
  → Google (1 Klick)
  → Magic Link (Email)
→ Onboarding (falls neu)
→ Dashboard
```

**Vorteile:**
- ✅ Klarer, linearer Flow
- ✅ Beide Login-Methoden gleichwertig
- ✅ Freemium: Jeder kann sofort starten (50 Credits)
- ✅ Bewerbung für Batch-Partner optional

---

## Wichtige Hinweise

### Google OAuth Credentials

**Development vs Production:**
- Verwende separate Credentials für Dev und Prod
- Dev: `http://localhost:3000/api/auth/callback/google`
- Prod: `https://stakeandscale.de/api/auth/callback/google`

**Sicherheit:**
- ❌ **NIEMALS** Client-Secret in git committen
- ❌ **NIEMALS** Client-Secret im Frontend-Code
- ✅ Nur in `.env.local` (Dev) und Vercel ENV vars (Prod)

### Turnstile (Bot-Schutz)

**Magic Link:** Turnstile-Check erforderlich
**Google Login:** Kein Turnstile (Google prüft bereits)

### Rate Limiting

**Bereits implementiert:**
- IP-basiert (lib/security/ip-rate-limit.ts)
- Signup: 5 pro Tag pro IP
- Verhindert Spam-Accounts

---

## Testing Checklist

- [ ] Landing Page zeigt 1 Login-Button
- [ ] Login-Seite zeigt beide Optionen (Google + Magic Link)
- [ ] Google Login funktioniert (nach Credentials-Setup)
- [ ] Magic Link funktioniert (Email wird gesendet)
- [ ] Beide Methoden führen zu Onboarding (neue User)
- [ ] Onboarding-Wizard zeigt korrekte Felder
- [ ] Nach Onboarding: User landet im Dashboard
- [ ] User mit bestehendem Account überspringen Onboarding
- [ ] 50 Credits werden bei Signup vergeben

---

**Status:** ✅ **Abgeschlossen**
**Deployment-Ready:** Sobald Google OAuth Credentials eingetragen sind
**Nächster Schritt:** Google Cloud Console → Credentials erstellen → In `.env.local` eintragen → Testen
