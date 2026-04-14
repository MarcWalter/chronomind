# CLAUDE.md – ChronoMind

KI-gestützte Zeiterfassungs-App. Next.js 14 + Supabase + Vercel AI SDK + shadcn/ui.

---

## Tech-Stack
- **Framework**: Next.js 14 (App Router), TypeScript
- **DB/Auth**: Supabase (PostgreSQL, RLS), Supabase Auth
- **KI**: Vercel AI SDK, Provider: Mistral/routerlab.ch
- **Features**: Web Speech API, ical.js, recharts

---

## Git & Workflow
```
main → production | develop → Integration | feature/<name> → Features
```
Commits: `feat:`, `fix:`, `chore:`, `docs:`

---

## Projektstruktur
```
app/(app)/
├── page.tsx           ← Today Dashboard
├── chat/page.tsx     ← KI-Chat
├── entries/page.tsx  ← Liste + Filter
├── analytics/page.tsx
├── calendars/page.tsx
└── settings/page.tsx

lib/ai/
├── system-prompt.ts   ← buildSystemPrompt()
├── tools/
│   ├── create-time-entry.ts
│   ├── update-time-entry.ts
│   └── list-time-entries.ts
└── providers/
    ├── mistral.ts
    └── routerlab.ts

components/chat/VoiceInputButton.tsx
lib/hooks/useVoiceInput.ts
```

---

## DB-Tabellen
- `time_entries`: title, category, started_at, ended_at, duration_seconds, source
- `calendars`: name, webcal_url, color
- `calendar_events`: calendar_id, external_id, title, started_at, ended_at
- `user_settings`: ai_provider, timezone, work_day_start/end

---

## Regeln
1. Keine API Keys in Code - nur `.env.local`
2. RLS auf allen Tabellen
3. Keine Migrations-Editierung - neue Dateien anlegen
4. Conventional Commits

---

## Aktueller Status
✅ Phase 1: Auth, Manual Entry, Dashboard  
✅ Phase 2: KI-Chat + Sprache + VoiceInput + AI SDK v6  
⬜ Phase 3: Kalender, Analytics, Export

**Phase 3 TO-DO:**
- lib/calendar/webcal.ts + sync.ts
- Kalender-Verwaltungsseite
- recharts: BarChart + CategoryPie
- Auswertungsseite + AiInsightPanel
- Export: iCal, CSV, JSON

---

## .env.example
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MISTRAL_API_KEY=
ROUTERLAB_API_KEY=
ROUTERLAB_BASE_URL=https://routerlab.ch/v1
```

---

*2026-04-14*