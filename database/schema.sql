-- =====================================================================
-- RehaDEX - Skema Database Supabase (PostgreSQL)
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel -> Run
-- Setelah itu jalankan database/seed.sql untuk data awal (opsional).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- 1. Pasien ----------
create table if not exists patients (
  id            uuid primary key default gen_random_uuid(),
  patient_code  varchar(50)  unique not null,          -- contoh: STK-001
  name          varchar(150) not null,
  age           integer,
  sex           varchar(1) check (sex in ('L','P')),
  diagnosis     varchar(150),
  affected_side char(1) check (affected_side in ('R','L')),
  notes         text,
  created_at    timestamptz default now()
);

-- ---------- 2. Perangkat IoT (ESP32) ----------
create table if not exists devices (
  id         uuid primary key default gen_random_uuid(),
  device_id  varchar(100) unique not null,             -- contoh: ESP32-01
  name       varchar(150),
  status     varchar(30) default 'offline',
  last_seen  timestamptz
);

-- ---------- 3. Sesi Pengukuran (sesuai alur halaman Mode: Manual / Alat IoT) ----------
create table if not exists assessment_sessions (
  id                  uuid primary key default gen_random_uuid(),
  session_code        varchar(100) unique not null,
  patient_id          uuid not null references patients(id) on delete cascade,
  device_id           uuid references devices(id),
  source              varchar(20) not null default 'manual'
                        check (source in ('manual','iot')),
  mode                varchar(20) not null default 'pengukuran'
                        check (mode in ('exercise','pengukuran')),
  measure_type        varchar(20) check (measure_type in ('fleksi','ekstensi')),
  hand_side           char(1)     check (hand_side in ('R','L')),
  finger_no           smallint    check (finger_no between 1 and 5),
  target_measurements integer default 20,
  started_at          timestamptz default now(),
  completed_at        timestamptz
);
alter table assessment_sessions add column if not exists source varchar(20) not null default 'manual';
create index if not exists idx_sessions_patient on assessment_sessions(patient_id, hand_side, finger_no);

-- ---------- 4. Data Pengukuran Mentah (Manual 5 Jari / 20x Sensor IoT) ----------
create table if not exists measurements (
  id             bigserial primary key,
  session_id     uuid not null references assessment_sessions(id) on delete cascade,
  patient_id     uuid not null references patients(id) on delete cascade,
  device_id      uuid references devices(id),
  measurement_no integer not null,
  measured_at    timestamptz default now(),
  force_value    numeric,          -- kekuatan jari (satuan bebas: N / kg / ADC)
  heart_rate     numeric,
  spo2           numeric,
  temperature    numeric,
  raw_payload    jsonb,
  unique (session_id, measurement_no)
);
create index if not exists idx_meas_session on measurements(session_id);

-- ---------- 5. Pemeriksaan Klinis & Skor Fungsional ----------
create table if not exists functional_scores (
  id              bigserial primary key,
  patient_id      uuid not null references patients(id) on delete cascade,
  scored_at       date not null default current_date,
  score           integer check (score between 0 and 100),
  region          varchar(50),
  complaint       varchar(150),
  blood_pressure  varchar(30),
  temperature     numeric,
  ashworth_scale  smallint
);
alter table functional_scores add column if not exists region varchar(50);
alter table functional_scores add column if not exists complaint varchar(150);
alter table functional_scores add column if not exists blood_pressure varchar(30);
alter table functional_scores add column if not exists temperature numeric;
alter table functional_scores add column if not exists ashworth_scale smallint;

-- ---------- 6. Keep-alive (mencegah Supabase free tier ter-pause 7 hari) ----------
create table if not exists keep_alive (
  id         int primary key default 1,
  pinged_at  timestamptz default now()
);
insert into keep_alive (id) values (1) on conflict (id) do nothing;

-- ---------- VIEW: Performa per jari per bulan (untuk grafik R/L x Jari 1-5) ----------
create or replace view finger_monthly_performance as
select
  p.patient_code,
  s.hand_side,
  s.finger_no,
  date_trunc('month', s.started_at)::date as month,
  round(avg(m.force_value) filter (where s.measure_type = 'fleksi'), 1)   as avg_flexion,
  round(avg(m.force_value) filter (where s.measure_type = 'ekstensi'), 1) as avg_extension
from assessment_sessions s
join patients p     on p.id = s.patient_id
join measurements m on m.session_id = s.id
where s.mode = 'pengukuran'
group by p.patient_code, s.hand_side, s.finger_no, date_trunc('month', s.started_at);

-- ---------- VIEW: Performa rata-rata per bulan (grafik lama) ----------
create or replace view monthly_performance as
select patient_code, month,
       round(avg(avg_flexion), 1)   as avg_flexion,
       round(avg(avg_extension), 1) as avg_extension
from finger_monthly_performance
group by patient_code, month;

-- ---------- Row Level Security ----------
-- Izinkan baca dan input dari aplikasi web maupun API server.
alter table patients            enable row level security;
alter table devices             enable row level security;
alter table assessment_sessions enable row level security;
alter table measurements        enable row level security;
alter table functional_scores   enable row level security;
alter table keep_alive          enable row level security;

drop policy if exists "read patients" on patients;
drop policy if exists "all patients" on patients;
create policy "all patients" on patients for all using (true) with check (true);

drop policy if exists "all devices" on devices;
create policy "all devices" on devices for all using (true) with check (true);

drop policy if exists "read sessions" on assessment_sessions;
drop policy if exists "all sessions" on assessment_sessions;
create policy "all sessions" on assessment_sessions for all using (true) with check (true);

drop policy if exists "read measurements" on measurements;
drop policy if exists "all measurements" on measurements;
create policy "all measurements" on measurements for all using (true) with check (true);

drop policy if exists "read scores" on functional_scores;
drop policy if exists "all scores" on functional_scores;
create policy "all scores" on functional_scores for all using (true) with check (true);

drop policy if exists "read keep_alive" on keep_alive;
drop policy if exists "all keep_alive" on keep_alive;
create policy "all keep_alive" on keep_alive for all using (true) with check (true);

