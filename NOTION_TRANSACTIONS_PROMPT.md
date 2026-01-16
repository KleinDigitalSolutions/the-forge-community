# Notion KI Prompt: Transactions Database

## Für Notion KI:

Erstelle eine neue Database mit dem Titel "THE FORGE - Transactions" mit folgender Struktur:

**Properties:**

1. **Description** (Title/Titel) - Beschreibung der Transaktion
2. **Amount** (Number/Zahl, Format: Euro €) - Betrag (positiv für Einnahmen, negativ für Ausgaben)
3. **Category** (Select/Auswahl):
   - Supplier
   - Marketing
   - Legal
   - Operations
   - Investment
   - Other

4. **Type** (Select/Auswahl):
   - Income (grün)
   - Expense (rot)

5. **Date** (Date/Datum) - Transaktionsdatum
6. **Status** (Select/Auswahl):
   - Pending (gelb)
   - Completed (grün)
   - Cancelled (rot)

7. **Receipt URL** (URL) - Link zum Beleg
8. **Notes** (Text) - Zusätzliche Notizen

**Views erstellen:**
- "Alle Transaktionen" (Tabelle)
- "Einnahmen" (nur Type = Income)
- "Ausgaben" (nur Type = Expense)
- "Nach Kategorie" (gruppiert nach Category)
