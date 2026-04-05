# ChronoMind

> KI-gestützte Zeiterfassungs-App mit natürlichsprachiger Eingabe per Text und Sprache, WebCal-Integration, Auswertung und flexiblen Exportformaten.

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#setup"><strong>Setup</strong></a> ·
  <a href="#entwicklung"><strong>Entwicklung</strong></a> ·
  <a href="#deploy"><strong>Deploy</strong></a>
</p>
<br/>

## Features

- Natürlichsprachige Zeiterfassung per Chat (KI-gestützt)
- Sprachinput per Web Speech API
- WebCal-Kalender-Import
- Auswertung mit Charts
- Export: iCal, CSV, JSON
- Multi-Provider-KI (Mistral, routerlab.ch)

## Setup

### 1. Umgebungsvariablen

Kopiere `.env.example` nach `.env.local` und fülle die Werte aus:

```bash
cp .env.example .env.local
```

Benötigte Variablen:
- `NEXT_PUBLIC_SUPABASE_URL` – aus Supabase Dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – aus Supabase Dashboard
- `MISTRAL_API_KEY` – von [console.mistral.ai](https://console.mistral.ai)
- `ROUTERLAB_API_KEY` – von routerlab.ch (optional)

### 2. Supabase einrichten

1. Neues Supabase-Projekt erstellen
2. Migration ausführen:
   ```bash
   npx supabase db push
   ```
   Oder die SQL-Datei manuell im Supabase SQL Editor ausführen:
   - `supabase/migrations/002_time_tracking.sql`

### 3. Auth konfigurieren

Im Supabase Dashboard unter **Auth > URL configuration**:
- Site URL setzen (z.B. `http://localhost:3000`)

Optional: GitHub OAuth aktivieren unter **Auth > Providers > GitHub**

### 4. Dependencies installieren

```bash
pnpm install
```

### 5. Entwicklung starten

```bash
pnpm dev
```

App läuft auf [http://localhost:3000](http://localhost:3000)

## Entwicklung

### Datenbank-Migrationen

Neue Tabellen/Spalten immer als neue Migration hinzufügen:

```bash
npx supabase migration new <name>
```

### Branch-Strategie

```
main          → stabil, production-ready
develop       → Integrations-Branch
feature/<name> → ein Branch pro Feature
```

### Conventional Commits

```bash
git commit -m "feat: neue Funktion"
git commit -m "fix: bug behoben"
git commit -m "docs: dokumentation aktualisiert"
```

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 14 (App Router) |
| Sprache | TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| KI | Vercel AI SDK + Mistral |
| Charts | recharts |

## Lizenz

MIT
