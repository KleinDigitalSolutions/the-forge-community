# Squad Alpha - Manuelles Setup

## Problem erkannt:
Der AI konnte das Squad nicht einfügen, weil Notion API "Linked Database Views" erstellt statt echte Datenbanken. Die Integration hatte keinen Zugriff auf die Source-DB.

## ✅ Lösung: Manuelle Erstellung in Notion

### Schritt 1: Neue Database in Notion erstellen

1. Gehe zu deiner Notion Parent-Page: `https://www.notion.so/2eb69398379480a893f2cd310e74d57e`
2. Erstelle eine neue **Full-Page Database** (nicht inline):
   - Klicke auf "New Page" → "Table - Full page"
   - Benenne sie: **"Squads"**

### Schritt 2: Properties hinzufügen

Füge folgende Spalten (Properties) hinzu:

| Property Name    | Type   | Options/Config                                                    |
|------------------|--------|-------------------------------------------------------------------|
| `Name`           | Title  | (bereits vorhanden)                                               |
| `Target Capital` | Select | Optionen: `25k`, `50k`, `100k`                                    |
| `Status`         | Select | Optionen: `Recruiting`, `Building`, `Live`, `Exit`                |
| `Max Founders`   | Number | Format: Number                                                    |
| `Start Date`     | Date   | -                                                                 |

### Schritt 3: Database mit Integration verbinden

1. Öffne die neue "Squads" Database
2. Klicke oben rechts auf **"..."** (3 Punkte)
3. Wähle **"Add connections"**
4. Wähle deine Integration: **"THE FORGE"** oder wie du sie genannt hast

### Schritt 4: Database-ID kopieren

1. Öffne die Database als Full Page
2. Die URL sieht so aus:
   ```
   https://www.notion.so/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX?v=...
   ```
3. Kopiere die ID (der Teil vor `?v=`)

### Schritt 5: ID in .env.local eintragen

Öffne `.env.local` und aktualisiere:

```bash
NOTION_GROUPS_DATABASE_ID=DEINE-KOPIERTE-ID
```

---

## 🎯 Squad Alpha - Beispiel-Eintrag

Sobald die Database steht, erstelle manuell den ersten Eintrag:

### Daten für "Squad Alpha":

| Feld            | Wert                      |
|-----------------|---------------------------|
| Name            | Squad Alpha               |
| Target Capital  | 25k                       |
| Status          | Live                      |
| Max Founders    | 25                        |
| Start Date      | 2024-10-17 (3 Monate vor heute) |

---

## 📊 Szenario "Squad Alpha":

**Kontext:**
- 25 Founder haben je **1.000€** investiert = **25.000€** Gesamt
- Projekt: **SmartStore** (Community Fulfillment Hub)
- Status: **Live** (3 Monate nach Brand-Launch)
- Phase: **Skalierung**

**Aktueller Stand:**
- Warehouse Setup: ✅ Abgeschlossen
- Erste Ankerkunden: ✅ 5 Brands onboarded
- MRR: **€4.200** (Ziel: €12k in 3 Monaten)
- Team-Rollen verteilt:
  - 3 Operations Manager
  - 2 Tech/WMS Integration
  - 5 Sales/BD
  - 10 Marketing/Content
  - 5 Advisory/Support

**Next Steps:**
- Skalierung auf 15+ Kunden
- Automatisierung der Prozesse
- Exit-Vorbereitung (Target: €300k Bewertung = 12x ROI für jeden Founder)

---

## 🔧 Dann Script ausführen (optional):

Sobald die Database korrekt in Notion steht und mit der Integration verbunden ist, kannst du das Seed-Script nutzen:

```bash
node scripts/seed-squad-alpha.js
```

**ODER** du legst den Eintrag direkt in Notion an (schneller!).

---

## ⚠️ Warum hat die API versagt?

**Notion API Quirk:**
- `databases.create()` erstellt einen **Linked View** auf der Parent Page
- Die **echte Source-DB** bekommt eine andere ID (in `data_sources`)
- Die Integration hat **nur Zugriff auf den View**, nicht auf die Source
- Daher: `properties` sind `undefined` beim Abrufen
- Beim Erstellen von Entries: "Property does not exist" Fehler

**Lösung:**
Manuelle Erstellung in Notion UI = volle Kontrolle + garantierte Permissions.

---

Generiert am: 2026-01-17
