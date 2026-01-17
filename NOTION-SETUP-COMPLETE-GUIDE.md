# 🔧 THE FORGE - Notion Setup Complete Guide

## 🎯 Das Problem (erklärt):

**ALLE Datenbanken im Backend sind "Linked Views" ohne Properties!**

Wenn man `databases.create()` via API auf einer Page ausführt, erstellt Notion:
1. Einen **View** (sichtbar auf der Page) - Das ist die ID in `.env.local`
2. Eine **Source Database** (versteckt irgendwo) - Keine Zugriff via Integration

Das API-Response von `databases.retrieve()` für Views enthält **KEINE `properties`**.

---

## ✅ DIE LÖSUNG: Properties manuell in Notion hinzufügen

Gehe zu: https://www.notion.so/Backend-2eb69398379480a893f2cd310e74d57e

Dort siehst du alle Datenbanken als Linked Views. Jetzt musst du zu JEDER Database die Properties hinzufügen.

---

## 📊 Database 1: Founders

**URL**: https://www.notion.so/2ea693983794-80af8d52e26fc37dfa97

### Properties hinzufügen:
1. Öffne die Database
2. Klicke auf **"+ Add a property"**
3. Füge folgende hinzu:

| Property Name      | Type     | Config/Options                                   |
|--------------------|----------|--------------------------------------------------|
| Name               | Title    | (bereits vorhanden)                              |
| Email              | Email    |                                                  |
| Phone              | Phone    |                                                  |
| Instagram          | Text     |                                                  |
| Why Join           | Text     |                                                  |
| Founder Number     | Number   |                                                  |
| Joined Date        | Date     |                                                  |
| Status             | Select   | pending, active, inactive                        |
| Investment Paid    | Checkbox |                                                  |
| Role               | Select   | Investor, Builder                                |
| Capital            | Text     |                                                  |
| Skill              | Text     |                                                  |

---

## 📊 Database 2: Forum

**URL**: https://www.notion.so/e3b2c191424143180a-b1c520e4c87e95

### Properties:

| Property Name   | Type   | Config/Options          |
|-----------------|--------|-------------------------|
| Name            | Title  | (bereits vorhanden)     |
| Content         | Text   |                         |
| Author          | Text   |                         |
| Founder Number  | Number |                         |
| Category        | Select | General, Ideas, Support |
| Likes           | Number |                         |

---

## 📊 Database 3: Votes

**URL**: https://www.notion.so/34e3d2057f98487f90d2bd4e02955417

### Properties:

| Property Name | Type   | Config/Options                  |
|---------------|--------|---------------------------------|
| Name          | Title  | (bereits vorhanden)             |
| Description   | Text   |                                 |
| Votes         | Number |                                 |
| Status        | Select | active, closed, winner          |
| Metrics       | Text   |                                 |
| Highlights    | Text   |                                 |
| Timeline      | Text   |                                 |
| Start Date    | Date   |                                 |
| End Date      | Date   |                                 |

---

## 📊 Database 4: Transactions

**URL**: https://www.notion.so/37d248b1789045e09ec512be5ed15e67

### Properties:

| Property Name | Type   | Config/Options                                           |
|---------------|--------|----------------------------------------------------------|
| Description   | Title  | (bereits vorhanden)                                      |
| Amount        | Number |                                                          |
| Category      | Select | Supplier, Marketing, Legal, Operations, Investment, etc. |
| Type          | Select | Income, Expense                                          |
| Date          | Date   |                                                          |
| Status        | Select | Pending, Completed, Cancelled                            |
| Receipt URL   | URL    |                                                          |
| Notes         | Text   |                                                          |

---

## 📊 Database 5: Announcements

**URL**: https://www.notion.so/0f386904305e4bd2a68194171ded8b4b

### Properties:

| Property Name          | Type   | Config/Options                |
|------------------------|--------|-------------------------------|
| Titel                  | Title  | (bereits vorhanden)           |
| Inhalt                 | Text   |                               |
| Kategorie              | Select | Milestone, Deadline, General  |
| Priorität              | Select | High, Medium, Low             |
| Veröffentlichungsdatum | Date   |                               |
| Autor                  | Text   |                               |

---

## 📊 Database 6: Tasks

**URL**: https://www.notion.so/50b6bfb2c9f544ecb8db41e5bbac62c1

### Properties:

| Property Name | Type   | Config/Options                     |
|---------------|--------|------------------------------------|
| Task          | Title  | (bereits vorhanden)                |
| Description   | Text   |                                    |
| Assigned To   | Text   |                                    |
| Status        | Select | To Do, In Progress, Done           |
| Priority      | Select | High, Medium, Low                  |
| Due Date      | Date   |                                    |
| Category      | Select | Legal, WMS, Marketing, Operations  |

---

## 📊 Database 7: Documents

**URL**: https://www.notion.so/956898b39a0b417ba058018e5458c83d

### Properties:

| Property Name | Type   | Config/Options                      |
|---------------|--------|-------------------------------------|
| Name          | Title  | (bereits vorhanden)                 |
| Description   | Text   |                                     |
| Category      | Select | Contract, Guide, Template, Process  |
| URL           | URL    |                                     |
| Upload Date   | Date   |                                     |
| Access Level  | Select | All Founders, Core Team             |

---

## 📊 Database 8: Events

**URL**: https://www.notion.so/edf2125ecd1546e9ae78e27816f0c0f5

### Properties:

| Property Name  | Type   | Config/Options                  |
|----------------|--------|---------------------------------|
| Event Name     | Title  | (bereits vorhanden)             |
| Description    | Text   |                                 |
| Date           | Date   |                                 |
| Type           | Select | Call, Deadline, Launch, Meeting |
| Location/Link  | URL    |                                 |

---

## 📊 Database 9: Groups (SQUADS) ⭐

**URL**: https://www.notion.so/0603e9a95dc04d8abd31edad990d44f1

### Properties:

| Property Name  | Type   | Config/Options                          |
|----------------|--------|-----------------------------------------|
| Name           | Title  | (bereits vorhanden)                     |
| Target Capital | Select | 25k, 50k, 100k                          |
| Status         | Select | Recruiting, Building, Live, Exit        |
| Max Founders   | Number |                                         |
| Start Date     | Date   |                                         |

**WICHTIG**: Sobald du diese Properties hinzugefügt hast, kannst du "Squad Alpha" einfügen!

---

## 🎯 Schnellere Alternative: Script-basierte Lösung (wenn Properties existieren)

Sobald du in Notion **manuell** die Properties hinzugefügt hast, führe aus:

```bash
node scripts/seed-squad-alpha.js
```

Dieses Script erstellt automatisch:
- Squad Alpha (25k Tier)
- Status: Live
- Max Founders: 25
- Start Date: 3 Monate vor heute

---

## ❓ FAQ

### Warum kann man Properties nicht per API hinzufügen?

Weil die API die Linked Views als "read-only" behandelt. `databases.update()` auf Views funktioniert nicht zuverlässig.

### Warum funktioniert es nicht mit den Source IDs?

Die Integration hat nur Zugriff auf die Parent Page (Backend), nicht auf die versteckten Source Databases.

### Wie hat Gemini es geschafft?

Gemini hat wahrscheinlich:
1. Die DBs per Script erstellt (View IDs)
2. Dann gesagt: "Füge die Properties manuell in Notion hinzu"
3. Oder Gemini hatte direkten Zugriff auf Notion UI

---

## ✅ Checklist

- [ ] Founders Database - Properties hinzugefügt
- [ ] Forum Database - Properties hinzugefügt
- [ ] Votes Database - Properties hinzugefügt
- [ ] Transactions Database - Properties hinzugefügt
- [ ] Announcements Database - Properties hinzugefügt
- [ ] Tasks Database - Properties hinzugefügt
- [ ] Documents Database - Properties hinzugefügt
- [ ] Events Database - Properties hinzugefügt
- [ ] **Groups Database - Properties hinzugefügt** ⭐
- [ ] Squad Alpha Entry erstellt

---

Erstellt am: 2026-01-17
