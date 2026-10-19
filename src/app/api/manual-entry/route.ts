import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import {
  patients as dummyPatients,
  iotPerformance,
  functionalScores,
  fingerPerformance,
  FingerNo,
  HandSide,
  Gender,
} from '@/data/dummyData';

export const dynamic = 'force-dynamic';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const toMonthName = (dateStr: string) => {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? 'Okt' : BULAN[d.getUTCMonth()];
};

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const action = body.action as string;
  const db = getAdminClient();

  // =========================================================================
  // 1. TAMBAH PASIEN BARU MANUAL
  // =========================================================================
  if (action === 'add_patient') {
    const patient_code = String(body.patient_code || '').trim().toUpperCase();
    const name = String(body.name || '').trim();
    const age = Number(body.age || 60);
    const sex = (body.sex === 'P' ? 'P' : 'L') as Gender;
    const affected_side = (body.affected_side === 'L' ? 'L' : 'R') as HandSide;
    const diagnosis =
      String(body.diagnosis || '').trim() ||
      `Stroke (Hemiparese ${affected_side === 'L' ? 'Kiri' : 'Kanan'})`;
    const notes = String(body.notes || 'Pasien baru ditambahkan secara manual.').trim();

    if (!patient_code || !name) {
      return NextResponse.json({ ok: false, error: 'ID Pasien dan Nama wajib diisi' }, { status: 400 });
    }

    // Simpan ke in-memory fallback agar selalu tampil
    const existingIdx = dummyPatients.findIndex(p => p.id === patient_code);
    const newPatientObj = {
      id: patient_code,
      name,
      age,
      gender: sex,
      diagnosis,
      joinDate: new Date().toISOString().slice(0, 10),
      notes,
    };
    if (existingIdx >= 0) {
      dummyPatients[existingIdx] = newPatientObj;
    } else {
      dummyPatients.push(newPatientObj);
    }
    if (!fingerPerformance[patient_code]) {
      const emptyHand = () => ({ 1: [], 2: [], 3: [], 4: [], 5: [] });
      fingerPerformance[patient_code] = { R: emptyHand(), L: emptyHand() };
    }
    if (!iotPerformance[patient_code]) iotPerformance[patient_code] = [];
    if (!functionalScores[patient_code]) functionalScores[patient_code] = [];

    // Simpan ke Supabase jika sudah dikonfigurasi
    if (db) {
      const { error } = await db.from('patients').upsert(
        {
          patient_code,
          name,
          age,
          sex,
          diagnosis,
          affected_side,
          notes,
        },
        { onConflict: 'patient_code' }
      );
      if (error) {
        return NextResponse.json({
          ok: true,
          savedTo: 'local',
          warning: `Tersimpan di memori lokal (Supabase: ${error.message})`,
          patient: newPatientObj,
        });
      }
      return NextResponse.json({ ok: true, savedTo: 'supabase', patient: newPatientObj });
    }

    return NextResponse.json({ ok: true, savedTo: 'local', patient: newPatientObj });
  }

  // =========================================================================
  // 2. INPUT DATA PEMERIKSAAN (ASSESMEN & SKOR FUNGSIONAL) MANUAL
  // =========================================================================
  if (action === 'add_assessment') {
    const patient_code = String(body.patient_code || '').trim();
    const scored_at = String(body.scored_at || new Date().toISOString().slice(0, 10));
    const score = Number(body.score ?? 0);
    const complaint = String(body.complaint || '');
    const blood_pressure = String(body.blood_pressure || '');
    const temperature = body.temperature ? Number(body.temperature) : null;
    const ashworth = String(body.ashworth ?? '');
    const region = String(body.region || '');

    if (!patient_code) {
      return NextResponse.json({ ok: false, error: 'ID Pasien wajib diisi' }, { status: 400 });
    }

    const monthLabel = toMonthName(scored_at);
    const summaryNote = [
      complaint ? `Keluhan: ${complaint}` : '',
      blood_pressure ? `TD: ${blood_pressure} mmHg` : '',
      temperature ? `Suhu: ${temperature}°C` : '',
      ashworth !== '' ? `Ashworth: ${ashworth}` : '',
      region ? `Region: ${region}` : '',
    ]
      .filter(Boolean)
      .join(' • ');

    // Update fallback lokal
    if (!functionalScores[patient_code]) functionalScores[patient_code] = [];
    const existingScoreIdx = functionalScores[patient_code].findIndex(s => s.date === monthLabel);
    if (existingScoreIdx >= 0) {
      functionalScores[patient_code][existingScoreIdx].score = score;
    } else {
      functionalScores[patient_code].push({ date: monthLabel, score });
    }
    const pObj = dummyPatients.find(p => p.id === patient_code);
    if (pObj && summaryNote) {
      pObj.notes = summaryNote;
    }

    // Simpan ke Supabase jika sudah dikonfigurasi
    if (db) {
      const { data: pRow } = await db
        .from('patients')
        .select('id')
        .eq('patient_code', patient_code)
        .single();

      if (pRow?.id) {
        if (summaryNote) {
          await db.from('patients').update({ notes: summaryNote }).eq('id', pRow.id);
        }
        const { error: fsErr } = await db.from('functional_scores').insert({
          patient_id: pRow.id,
          scored_at,
          score,
          region: region || null,
          complaint: complaint || null,
          blood_pressure: blood_pressure || null,
          temperature,
          ashworth_scale: ashworth !== '' ? Number(ashworth) : null,
        });
        if (fsErr) {
          // Fallback jika kolom baru belum ditambahkan di database lama
          const { error: fallbackErr } = await db.from('functional_scores').insert({
            patient_id: pRow.id,
            scored_at,
            score,
          });
          if (!fallbackErr) {
            return NextResponse.json({ ok: true, savedTo: 'supabase' });
          }
        } else {
          return NextResponse.json({ ok: true, savedTo: 'supabase' });
        }
      }
    }

    return NextResponse.json({ ok: true, savedTo: 'local' });
  }

  // =========================================================================
  // 3. INPUT PENGUKURAN PER JARI MANUAL (FLEKSI / EKSTENSI + TANDA VITAL)
  // =========================================================================
  if (action === 'add_measurement') {
    const patient_code = String(body.patient_code || '').trim();
    const hand_side = (body.hand_side === 'L' ? 'L' : 'R') as HandSide;
    const finger_no = Math.min(5, Math.max(1, Number(body.finger_no || 1))) as FingerNo;
    const measure_type = body.measure_type === 'ekstensi' ? 'ekstensi' : 'fleksi';
    const measured_date = String(body.measured_date || new Date().toISOString().slice(0, 10));
    const trials: number[] = Array.isArray(body.trials)
      ? body.trials.map((v: unknown) => Number(v)).filter((v: number) => !Number.isNaN(v))
      : [Number(body.force_value ?? 0)];
    const paired_value =
      body.paired_value !== undefined && body.paired_value !== '' && body.paired_value !== null
        ? Number(body.paired_value)
        : null;
    const heart_rate = body.heart_rate ? Number(body.heart_rate) : 78;
    const spo2 = body.spo2 ? Number(body.spo2) : 98;
    const temperature = body.temperature ? Number(body.temperature) : 36.5;

    if (!patient_code || trials.length === 0) {
      return NextResponse.json({ ok: false, error: 'Data pasien dan nilai kekuatan wajib diisi' }, { status: 400 });
    }

    const avgValue = +(trials.reduce((a, b) => a + b, 0) / trials.length).toFixed(1);
    const monthLabel = toMonthName(measured_date);

    // 1) Update fallback lokal agar langsung tampil di grafik
    if (!fingerPerformance[patient_code]) {
      const emptyHand = () => ({ 1: [], 2: [], 3: [], 4: [], 5: [] });
      fingerPerformance[patient_code] = { R: emptyHand(), L: emptyHand() };
    }
    const fingerArr = fingerPerformance[patient_code][hand_side][finger_no];
    const existingMonth = fingerArr.find(m => m.month === monthLabel);
    if (existingMonth) {
      if (measure_type === 'fleksi') {
        existingMonth.avgFlexion = avgValue;
        if (paired_value !== null) existingMonth.avgExtension = paired_value;
      } else {
        existingMonth.avgExtension = avgValue;
        if (paired_value !== null) existingMonth.avgFlexion = paired_value;
      }
    } else {
      fingerArr.push({
        month: monthLabel,
        avgFlexion: measure_type === 'fleksi' ? avgValue : (paired_value ?? 0),
        avgExtension: measure_type === 'ekstensi' ? avgValue : (paired_value ?? 0),
      });
    }

    // Update grafik bulanan rata-rata (iotPerformance)
    if (!iotPerformance[patient_code]) iotPerformance[patient_code] = [];
    const allFingersForMonth: { flex: number; ext: number }[] = [];
    (['R', 'L'] as HandSide[]).forEach(s => {
      ([1, 2, 3, 4, 5] as FingerNo[]).forEach(f => {
        const found = fingerPerformance[patient_code][s][f].find(m => m.month === monthLabel);
        if (found) {
          allFingersForMonth.push({ flex: found.avgFlexion, ext: found.avgExtension });
        }
      });
    });
    if (allFingersForMonth.length > 0) {
      const mFlex = +(
        allFingersForMonth.reduce((acc, item) => acc + item.flex, 0) / allFingersForMonth.length
      ).toFixed(1);
      const mExt = +(
        allFingersForMonth.reduce((acc, item) => acc + item.ext, 0) / allFingersForMonth.length
      ).toFixed(1);
      const mRow = iotPerformance[patient_code].find(m => m.month === monthLabel);
      if (mRow) {
        mRow.avgFlexion = mFlex;
        mRow.avgExtension = mExt;
      } else {
        iotPerformance[patient_code].push({ month: monthLabel, avgFlexion: mFlex, avgExtension: mExt });
      }
    }

    // 2) Simpan ke Supabase jika sudah dikonfigurasi
    if (db) {
      const { data: pRow } = await db
        .from('patients')
        .select('id')
        .eq('patient_code', patient_code)
        .single();

      if (pRow?.id) {
        const startedAtIso = new Date(`${measured_date}T09:00:00Z`).toISOString();
        const completedAtIso = new Date(`${measured_date}T09:15:00Z`).toISOString();
        const ym = measured_date.slice(0, 7).replace('-', '');

        const saveSessionAndTrials = async (type: 'fleksi' | 'ekstensi', values: number[]) => {
          const session_code = `${patient_code}-${hand_side}${finger_no}-${ym}-${type}-MANUAL-${Date.now()}`;
          const { data: sRow, error: sErr } = await db
            .from('assessment_sessions')
            .insert({
              session_code,
              patient_id: pRow.id,
              mode: 'pengukuran',
              measure_type: type,
              hand_side,
              finger_no,
              target_measurements: values.length,
              started_at: startedAtIso,
              completed_at: completedAtIso,
            })
            .select('id')
            .single();

          if (sErr || !sRow) return sErr;

          const rows = values.map((val, idx) => ({
            session_id: sRow.id,
            patient_id: pRow.id,
            measurement_no: idx + 1,
            measured_at: startedAtIso,
            force_value: val,
            heart_rate,
            spo2,
            temperature,
            raw_payload: { source: 'manual_web', trial: idx + 1 },
          }));

          const { error: mErr } = await db.from('measurements').insert(rows);
          return mErr;
        };

        const errMain = await saveSessionAndTrials(measure_type, trials);
        if (paired_value !== null && !Number.isNaN(paired_value)) {
          const otherType = measure_type === 'fleksi' ? 'ekstensi' : 'fleksi';
          await saveSessionAndTrials(otherType, [paired_value]);
        }

        if (!errMain) {
          return NextResponse.json({
            ok: true,
            savedTo: 'supabase',
            avgValue,
            month: monthLabel,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      savedTo: 'local',
      avgValue,
      month: monthLabel,
    });
  }

  // =========================================================================
  // 4. INPUT PENGUKURAN SEMUA JARI (JARI 1 - 5 SEKALIGUS) MANUAL KE DATABASE
  // =========================================================================
  if (action === 'add_all_fingers_measurement') {
    const patient_code = String(body.patient_code || '').trim();
    const hand_side = (body.hand_side === 'L' ? 'L' : 'R') as HandSide;
    const measured_date = String(body.measured_date || new Date().toISOString().slice(0, 10));
    const heart_rate = body.heart_rate ? Number(body.heart_rate) : 78;
    const spo2 = body.spo2 ? Number(body.spo2) : 98;
    const temperature = body.temperature ? Number(body.temperature) : 36.5;

    // fingersData: Array of { finger_no: 1..5, fleksi: number, ekstensi: number }
    const rawFingers = Array.isArray(body.fingers) ? body.fingers : [];
    if (!patient_code || rawFingers.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Data pasien dan nilai kelima jari wajib diisi' },
        { status: 400 }
      );
    }

    const monthLabel = toMonthName(measured_date);

    // 1) Update in-memory fallback untuk semua jari (1-5)
    if (!fingerPerformance[patient_code]) {
      const emptyHand = () => ({ 1: [], 2: [], 3: [], 4: [], 5: [] });
      fingerPerformance[patient_code] = { R: emptyHand(), L: emptyHand() };
    }

    const parsedFingers: { finger_no: FingerNo; fleksi: number; ekstensi: number }[] = [];

    for (const item of rawFingers) {
      const fNo = Math.min(5, Math.max(1, Number(item.finger_no || 1))) as FingerNo;
      const flexVal = Number(item.fleksi ?? 0);
      const extVal = Number(item.ekstensi ?? 0);
      parsedFingers.push({ finger_no: fNo, fleksi: flexVal, ekstensi: extVal });

      const fingerArr = fingerPerformance[patient_code][hand_side][fNo];
      const existingMonth = fingerArr.find(m => m.month === monthLabel);
      if (existingMonth) {
        existingMonth.avgFlexion = flexVal;
        existingMonth.avgExtension = extVal;
      } else {
        fingerArr.push({
          month: monthLabel,
          avgFlexion: flexVal,
          avgExtension: extVal,
        });
      }
    }

    // Update grafik rata-rata bulanan (iotPerformance)
    if (!iotPerformance[patient_code]) iotPerformance[patient_code] = [];
    const allFingersForMonth: { flex: number; ext: number }[] = [];
    (['R', 'L'] as HandSide[]).forEach(s => {
      ([1, 2, 3, 4, 5] as FingerNo[]).forEach(f => {
        const found = fingerPerformance[patient_code][s][f].find(m => m.month === monthLabel);
        if (found) {
          allFingersForMonth.push({ flex: found.avgFlexion, ext: found.avgExtension });
        }
      });
    });
    if (allFingersForMonth.length > 0) {
      const mFlex = +(
        allFingersForMonth.reduce((acc, item) => acc + item.flex, 0) / allFingersForMonth.length
      ).toFixed(1);
      const mExt = +(
        allFingersForMonth.reduce((acc, item) => acc + item.ext, 0) / allFingersForMonth.length
      ).toFixed(1);
      const mRow = iotPerformance[patient_code].find(m => m.month === monthLabel);
      if (mRow) {
        mRow.avgFlexion = mFlex;
        mRow.avgExtension = mExt;
      } else {
        iotPerformance[patient_code].push({ month: monthLabel, avgFlexion: mFlex, avgExtension: mExt });
      }
    }

    // 2) Simpan semua 5 jari ke Supabase jika sudah dikonfigurasi
    if (db) {
      const { data: pRow } = await db
        .from('patients')
        .select('id')
        .eq('patient_code', patient_code)
        .single();

      if (pRow?.id) {
        const startedAtIso = new Date(`${measured_date}T09:00:00Z`).toISOString();
        const completedAtIso = new Date(`${measured_date}T09:15:00Z`).toISOString();
        const ym = measured_date.slice(0, 7).replace('-', '');
        const batchTs = Date.now();

        let hasError = false;
        for (const fItem of parsedFingers) {
          for (const type of ['fleksi', 'ekstensi'] as const) {
            const val = type === 'fleksi' ? fItem.fleksi : fItem.ekstensi;
            const session_code = `${patient_code}-${hand_side}${fItem.finger_no}-${ym}-${type}-M5-${batchTs}`;

            const { data: sRow, error: sErr } = await db
              .from('assessment_sessions')
              .insert({
                session_code,
                patient_id: pRow.id,
                mode: 'pengukuran',
                measure_type: type,
                hand_side,
                finger_no: fItem.finger_no,
                target_measurements: 1,
                started_at: startedAtIso,
                completed_at: completedAtIso,
              })
              .select('id')
              .single();

            if (sErr || !sRow) {
              hasError = true;
              continue;
            }

            const { error: mErr } = await db.from('measurements').insert({
              session_id: sRow.id,
              patient_id: pRow.id,
              measurement_no: 1,
              measured_at: startedAtIso,
              force_value: val,
              heart_rate,
              spo2,
              temperature,
              raw_payload: { source: 'manual_all_fingers', finger_no: fItem.finger_no, measure_type: type },
            });

            if (mErr) hasError = true;
          }
        }

        if (body.functional_score !== undefined && body.functional_score !== '' && body.functional_score !== null) {
          const fsVal = Number(body.functional_score);
          if (!Number.isNaN(fsVal)) {
            await db.from('functional_scores').insert({
              patient_id: pRow.id,
              scored_at: measured_date,
              score: fsVal,
            });
          }
        }

        if (!hasError) {
          return NextResponse.json({
            ok: true,
            savedTo: 'supabase',
            month: monthLabel,
            count: parsedFingers.length,
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      savedTo: 'local',
      month: monthLabel,
      count: parsedFingers.length,
    });
  }

  return NextResponse.json({ ok: false, error: 'Action tidak dikenal' }, { status: 400 });
}

