import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Endpoint untuk ESP32.
 * Header : x-device-key: <DEVICE_API_KEY>
 * Body   : {
 *   "device_id": "ESP32-01", "patient_code": "STK-001",
 *   "session_code": "STK-001-R1-20261019-fleksi",
 *   "measure_type": "fleksi", "hand_side": "R", "finger_no": 1,
 *   "measurement_no": 1, "force_value": 12.3,
 *   "heart_rate": 80, "spo2": 98, "temperature": 36.5
 * }
 * Sesi dibuat otomatis jika session_code belum ada.
 */
export async function POST(req: Request) {
  if (!process.env.DEVICE_API_KEY || req.headers.get('x-device-key') !== process.env.DEVICE_API_KEY) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const db = getAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: 'supabase env belum diisi' }, { status: 500 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'json tidak valid' }, { status: 400 }); }

  const { patient_code, session_code, measurement_no } = b as { patient_code?: string; session_code?: string; measurement_no?: number };
  if (!patient_code || !session_code || !measurement_no) {
    return NextResponse.json({ ok: false, error: 'patient_code, session_code, measurement_no wajib' }, { status: 400 });
  }

  const { data: patient } = await db.from('patients').select('id').eq('patient_code', patient_code).single();
  if (!patient) return NextResponse.json({ ok: false, error: 'pasien tidak ditemukan' }, { status: 404 });

  let deviceUuid: string | null = null;
  if (b.device_id) {
    const { data: dev } = await db.from('devices')
      .upsert({ device_id: b.device_id, status: 'online', last_seen: new Date().toISOString() }, { onConflict: 'device_id' })
      .select('id').single();
    deviceUuid = dev?.id ?? null;
  }

  const { data: session, error: sErr } = await db.from('assessment_sessions')
    .upsert({
      session_code, patient_id: patient.id, device_id: deviceUuid, mode: 'pengukuran',
      measure_type: b.measure_type, hand_side: b.hand_side, finger_no: b.finger_no,
    }, { onConflict: 'session_code', ignoreDuplicates: false })
    .select('id, target_measurements').single();
  if (sErr || !session) return NextResponse.json({ ok: false, error: sErr?.message }, { status: 500 });

  const { error: mErr } = await db.from('measurements').upsert({
    session_id: session.id, patient_id: patient.id, device_id: deviceUuid, measurement_no,
    force_value: b.force_value, heart_rate: b.heart_rate, spo2: b.spo2, temperature: b.temperature, raw_payload: b,
  }, { onConflict: 'session_id,measurement_no' });
  if (mErr) return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 });

  if (measurement_no >= (session.target_measurements ?? 20)) {
    await db.from('assessment_sessions').update({ completed_at: new Date().toISOString() }).eq('id', session.id);
  }
  return NextResponse.json({ ok: true, session_id: session.id, measurement_no });
}
