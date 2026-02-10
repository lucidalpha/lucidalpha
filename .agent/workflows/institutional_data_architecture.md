---
description: Architektur-Konzept für die Implementierung von 13F Institutionellen Daten
---

# Theoretische Implementierung: 13F / Institutionelle Daten

Die Integration von Daten aus 13F-Filings (Quartalsberichte großer Investoren wie Warren Buffett, Hedge Funds) erfordert eine spezifische Architektur, da die Datenflut groß ist und die Quellen (SEC EDGAR) nicht latenzfrei abfragbar sind.

## 1. Datenquelle & Beschaffung (The Source)

**Herausforderung:** 13F-Filings sind XML- oder Textdateien, die in der SEC EDGAR Datenbank gespeichert sind. Es gibt keine "einfache" Echtzeit-API der SEC.

**Lösungsansatz:**
*   **SEC RSS Feed Monitor:** Ein Skript lauscht auf den RSS-Feed der SEC. Sobald ein neues Filing vom Typ `13F-HR` erscheint, wird es heruntergeladen.
*   **CUSIP-Mapping:** 13F-Filings verwenden CUSIP-Nummern, keine Ticker-Symbole (z.B. AAPL). Man benötigt eine interne Datenbank-Tabelle, die CUSIPs zu Tickern mappt, um zu wissen, dass CUSIP `037833100` = Apple ist.

## 2. Backend Architektur (Data Pipeline)

Da das Parsen tausender Positionen Sekunden bis Minuten dauert, darf dies **niemals live** während einer Benutzeranfrage passieren.

**Architektur-Komponenten:**
1.  **Ingestion Worker (Hintergrund-Dienst):**
    *   Lädt das XML herunter.
    *   Parst die Positionen (Halter, Aktie, Anzahl, Wert).
    *   Speichert die Rohdaten in der Datenbank.
2.  **Datenbank-Schema (Relational - PostgreSQL/SQLite):**
    *   `Funds` Tabelle: Name (z.B. "BRIDGEWATER ASSOCIATES"), Manager, Strategie.
    *   `Filings` Tabelle: Datum, Quartal (Q3 2024).
    *   `Holdings` Tabelle: Verknüpft `Fund` + `Stock` + `Filing` + `SharesCount`.

## 3. Daten-Aufbereitung für das Frontend

Das Frontend benötigt aggregierte Daten, keine Rohlisten von 10.000 Positionen.

**Berechnungen im Backend:**
*   **Change-Calculation:** Vergleich Q3 vs. Q2. Hat der Fund AAPL gekauft oder verkauft?
    *   `(Shares_Q3 - Shares_Q2) / Shares_Q2 = % Change`
*   **Cluster-Analyse:** "Smart Money Flow". Wenn 8 von 10 Top-Tech-Fonds gleichzeitig NVDA kaufen, ist das ein starkes Signal.

## 4. Visualisierung (UI Konzepte)

Hier sind die besten Wege, diese Daten darzustellen:

### A. Sankey Diagramm (Geldfluss)
Visualisiert, woher das Geld kommt.
*   **Links:** Fonds-Namen (z.B. Blackrock, Vanguard).
*   **Rechts:** Die Aktie (z.B. Apple).
*   **Dicke der Linie:** Anzahl der gehaltenen Aktien.
*   **Farbe:** Grün (Zugekauft) oder Rot (Abgebaut).

### B. Ownership Timeline (Zeitverlauf)
Ein Liniendiagramm unter dem Preis-Chart.
*   **X-Achse:** Zeit (Quartalsweise).
*   **Y-Achse:** % des Unternehmens in institutioneller Hand.
*   **Erkenntnis:** Steigt der Preis, aber Institutionen verkaufen ("Distribution")? Ein Warnsignal.

### C. "Whale Watch" Heatmap
*   **X-Achse:** Die letzten 4 Quartale.
*   **Y-Achse:** Liste der Top-Gurus (Burry, Buffett, Dalio).
*   **Zellen:** Grün (Kauf), Rot (Verkauf), Grau (Halten).
*   **Nutzen:** Auf einen Blick sehen, was die "Gurus" mit dieser Aktie machen.

## Zusammenfassung
Eine professionelle Umsetzung erfordert einen **autonomen Scraper**, eine **eigene Datenbank** für Historie und **Caching-Layer** für die API. Live-Abfragen (wie im ersten Versuch getestet) sind für produktive Anwendungen zu langsam.
