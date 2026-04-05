-- 002_time_tracking.sql
-- Zeiterfassungstabellen für ChronoMind

-- Zeit-Einträge
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  category text,
  tags text[],
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int generated always as
    (extract(epoch from (ended_at - started_at))::int) stored,
  source text check (source in
    ('ai_chat','manual','voice','calendar')) default 'manual',
  calendar_event_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Kalender
create table calendars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  webcal_url text not null,
  color text,
  auto_suggest boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Kalender-Events
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references calendars not null,
  user_id uuid references auth.users not null,
  external_id text not null,
  title text not null,
  description text,
  started_at timestamptz not null,
  ended_at timestamptz,
  location text,
  raw_ical text,
  unique(calendar_id, external_id)
);

-- Benutzer-Einstellungen
create table user_settings (
  user_id uuid primary key references auth.users,
  ai_provider text default 'mistral'
    check (ai_provider in ('mistral', 'routerlab')),
  ai_model text default 'mistral-large-latest',
  ai_api_key_mistral text,
  ai_api_key_routerlab text,
  routerlab_base_url text default 'https://routerlab.ch/v1',
  timezone text default 'Europe/Berlin',
  work_day_start time default '08:00',
  work_day_end time default '18:00'
);

-- RLS aktivieren
alter table time_entries enable row level security;
alter table calendars enable row level security;
alter table calendar_events enable row level security;
alter table user_settings enable row level security;

-- RLS Policies
create policy "Own data only - time_entries" on time_entries
  for all using (auth.uid() = user_id);

create policy "Own data only - calendars" on calendars
  for all using (auth.uid() = user_id);

create policy "Own data only - calendar_events" on calendar_events
  for all using (auth.uid() = user_id);

create policy "Own data only - user_settings" on user_settings
  for all using (auth.uid() = user_id);