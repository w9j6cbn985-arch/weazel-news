-- Weazel News – Supabase (SQL Editor). Kann mehrfach ausgeführt werden, löscht nichts.
alter table public.employee_profiles add column if not exists access_level  text;
alter table public.employee_profiles add column if not exists last_login_at timestamptz;
alter table public.employee_profiles alter column is_active set default true;

-- Jede Discord-ID nur einmal (falls dieser Befehl einen Fehler meldet, gibt es doppelte Einträge: erst bereinigen)
create unique index if not exists employee_profiles_discord_user_id_key on public.employee_profiles (discord_user_id);

-- Inhalte der Webseite (eine Zeile, id = 1)
create table if not exists public.site_state (
  id int primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Zugriff nur über die Netlify Functions (Service Role). Ohne Policies sind beide Tabellen für Browser gesperrt.
alter table public.employee_profiles enable row level security;
alter table public.site_state        enable row level security;
