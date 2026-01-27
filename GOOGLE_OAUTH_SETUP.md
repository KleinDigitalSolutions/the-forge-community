# Google OAuth Setup für The Forge

## Schritt 1: Google Cloud Console öffnen

1. Gehe zu: https://console.cloud.google.com/apis/credentials
2. Wähle dein Projekt oder erstelle ein neues

## Schritt 2: OAuth 2.0 Client ID erstellen

1. Klicke auf **"+ ANMELDEDATEN ERSTELLEN"**
2. Wähle **"OAuth-Client-ID"**
3. Wähle Anwendungstyp: **"Webanwendung"**
4. Name: `The Forge - Production` (oder beliebig)

## Schritt 3: Autorisierte Weiterleitungs-URIs hinzufügen

Füge diese URIs hinzu (beide für Dev + Production):

### Development (Localhost)
```
http://localhost:3000/api/auth/callback/google
```

### Production (Vercel)
```
https://stakeandscale.de/api/auth/callback/google
```

**Wichtig:** Die URIs müssen EXAKT übereinstimmen (inkl. `https://` und ohne trailing slash `/`)

## Schritt 4: Credentials in .env.local eintragen

Nach dem Erstellen erhältst du:
- **Client-ID** (sichtbar, z.B. `123456789-abc.apps.googleusercontent.com`)
- **Client-Secret** (nur einmal anzeigbar, sicher aufbewahren!)

Füge diese in `.env.local` ein:

```bash
AUTH_GOOGLE_ID="DEINE_CLIENT_ID_HIER"
AUTH_GOOGLE_SECRET="DEIN_CLIENT_SECRET_HIER"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="1"
```

## Schritt 5: Server neu starten

```bash
npm run dev
```

## Schritt 6: OAuth Consent Screen konfigurieren (falls noch nicht)

1. In Google Cloud Console → **"OAuth-Einwilligungsbildschirm"**
2. Wähle **"Extern"** (für öffentlichen Zugang)
3. Fülle aus:
   - App-Name: `STAKE & SCALE`
   - Support-E-Mail: `info@stakeandscale.de`
   - Autorisierte Domains: `stakeandscale.de`
   - Developer Contact: `info@stakeandscale.de`
4. Scopes: Nur `email` und `profile` (Standard)
5. Speichern

## Testen

1. Gehe zu: http://localhost:3000/login
2. Klicke auf **"Mit Google fortfahren"**
3. Wähle Google-Account
4. Nach erfolgreichem Login wirst du zum Onboarding weitergeleitet (falls noch nicht completed)

## Troubleshooting

### Error: redirect_uri_mismatch
- Prüfe, ob die URIs in Google Console EXAKT mit denen in NextAuth übereinstimmen
- Achte auf `http` vs `https` und trailing slashes

### Google Login Button nicht sichtbar
- Prüfe: `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="1"` in `.env.local`
- Server neu starten nach ENV-Änderungen

### "Access blocked: This app's request is invalid"
- OAuth Consent Screen muss konfiguriert sein
- App muss im Status "In production" oder "Testing" sein (nicht "Draft")
- Bei "Testing": Test-User in Google Console hinzufügen

## Vercel Deployment

Für Production in Vercel:

1. Gehe zu: https://vercel.com/bucci369s-projects/the-forge-community/settings/environment-variables
2. Füge hinzu:
   - `AUTH_GOOGLE_ID` → Deine Client-ID
   - `AUTH_GOOGLE_SECRET` → Dein Client-Secret
   - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` → `1`
3. Redeploy auslösen

**Wichtig:** In Production muss `AUTH_URL` auf `https://stakeandscale.de` gesetzt sein!

## Sicherheitshinweise

- **Client-Secret niemals in Frontend-Code** oder git committen
- Verwende separate Credentials für Dev und Production
- Rotiere Secrets regelmäßig (z.B. alle 6 Monate)
- Beschränke authorized redirect URIs auf deine Domains

---

**Status:** ✅ Vorbereitet
**Next:** Credentials eintragen und Server neu starten
