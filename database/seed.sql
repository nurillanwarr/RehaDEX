-- =====================================================================
-- RehaDEX - Data Awal (Seed). Jalankan SETELAH schema.sql.
-- Membuat 3 pasien + sesi pengukuran per tangan x jari x bulan (Jul-Nov 2026)
-- masing-masing 20 pengukuran, sehingga grafik per jari langsung terisi.
-- =====================================================================

insert into patients (patient_code, name, age, sex, diagnosis, affected_side, notes) values
  ('STK-001', 'Budi Santoso',   62, 'L', 'Stroke (Hemiparese Kanan)', 'R', 'Fase pemulihan awal.'),
  ('STK-002', 'Siti Aminah',    58, 'P', 'Stroke (Hemiparese Kiri)',  'L', 'Progres sangat baik.'),
  ('STK-003', 'Rahmat Hidayat', 65, 'L', 'Stroke (Hemiparese Kanan)', 'R', 'Perlu latihan ekstensi intensif.')
on conflict (patient_code) do nothing;

insert into devices (device_id, name, status) values ('ESP32-01', 'Sarung Tangan RehaDEX #1', 'offline')
on conflict (device_id) do nothing;

-- Sesi: pasien x sisi x jari x bulan x jenis
insert into assessment_sessions (session_code, patient_id, device_id, mode, measure_type, hand_side, finger_no, started_at, completed_at)
select
  format('%s-%s%s-%s-%s', p.patient_code, side, f, to_char(mon, 'YYYYMM'), t),
  p.id, d.id, 'pengukuran', t, side, f,
  mon + interval '10 days', mon + interval '10 days 15 minutes'
from patients p
cross join (select id from devices where device_id = 'ESP32-01') d
cross join unnest(array['R','L']) as side
cross join generate_series(1,5) as f
cross join generate_series('2026-07-01'::date, '2026-11-01'::date, interval '1 month') as mon
cross join unnest(array['fleksi','ekstensi']) as t
on conflict (session_code) do nothing;

-- 20 pengukuran per sesi. Sisi yang lumpuh lebih lemah, naik tiap bulan, sedikit turun di bulan ke-3.
insert into measurements (session_id, patient_id, device_id, measurement_no, measured_at, force_value, heart_rate, spo2, temperature)
select
  s.id, s.patient_id, s.device_id, n,
  s.started_at + (n * interval '30 seconds'),
  round((
      (case when s.hand_side = p.affected_side then 8 else 20 end)     -- basis kekuatan
    * (case when s.measure_type = 'ekstensi' then 0.7 else 1 end)
    - (s.finger_no - 1) * 0.8                                           -- kelingking lebih lemah
    + mi * 3.0                                                          -- progres per bulan
    - (case when mi = 2 then 3 else 0 end)                              -- penurunan kecil
    + random() * 2
  )::numeric, 1),
  round((75 + random() * 15)::numeric, 0),
  round((95 + random() * 4)::numeric, 0),
  round((36.2 + random() * 0.8)::numeric, 1)
from assessment_sessions s
join patients p on p.id = s.patient_id
cross join lateral (select (extract(year from age(date_trunc('month', s.started_at), '2026-07-01'))*12
                          + extract(month from age(date_trunc('month', s.started_at), '2026-07-01')))::int as mi) x
cross join generate_series(1,20) as n
on conflict (session_id, measurement_no) do nothing;

insert into functional_scores (patient_id, scored_at, score)
select p.id, v.d::date, v.s from patients p
join (values ('STK-001','2026-07-28',40),('STK-001','2026-08-28',55),('STK-001','2026-09-28',65),
             ('STK-002','2026-08-28',50),('STK-002','2026-09-28',70)) as v(code,d,s)
  on v.code = p.patient_code;
