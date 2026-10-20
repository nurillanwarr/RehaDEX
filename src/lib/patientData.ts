import { supabase, getAdminClient } from '@/lib/supabase';
import {
  patients as dummyPatients, iotPerformance, functionalScores, fingerPerformance,
  Patient, PerformanceSummary, FunctionalScore, FingerPerformance, FingerNo, HandSide,
} from '@/data/dummyData';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const toMonth = (d: string) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? 'Okt' : BULAN[dt.getUTCMonth()];
};

export interface PatientBundle {
  patient: Patient;
  monthly: PerformanceSummary[];
  scores: FunctionalScore[];
  fingers: FingerPerformance | undefined;
  source: 'supabase' | 'dummy';
}

/** Jika hanya ada 1 titik data, tambahkan titik 'Awal' agar grafik garis selalu terbentuk */
function ensureLinePoints(series: PerformanceSummary[]): PerformanceSummary[] {
  if (series.length === 1) {
    return [
      { month: 'Awal', avgFlexion: 0, avgExtension: 0 },
      series[0],
    ];
  }
  return series;
}

function dummyBundle(code: string): PatientBundle {
  const patient = dummyPatients.find(p => p.id === code) || dummyPatients[0];
  const rawFingers = fingerPerformance[patient.id];
  const fingers: FingerPerformance | undefined = rawFingers
    ? {
        R: {
          1: ensureLinePoints(rawFingers.R[1]),
          2: ensureLinePoints(rawFingers.R[2]),
          3: ensureLinePoints(rawFingers.R[3]),
          4: ensureLinePoints(rawFingers.R[4]),
          5: ensureLinePoints(rawFingers.R[5]),
        },
        L: {
          1: ensureLinePoints(rawFingers.L[1]),
          2: ensureLinePoints(rawFingers.L[2]),
          3: ensureLinePoints(rawFingers.L[3]),
          4: ensureLinePoints(rawFingers.L[4]),
          5: ensureLinePoints(rawFingers.L[5]),
        },
      }
    : undefined;

  return {
    patient,
    monthly: ensureLinePoints(iotPerformance[patient.id] || []),
    scores: functionalScores[patient.id] || [],
    fingers,
    source: 'dummy',
  };
}

/** Ambil data pasien dari Supabase; jika env kosong/gagal, kembali ke dummyData. */
export async function getPatientBundle(code: string): Promise<PatientBundle> {
  const db = getAdminClient() || supabase;
  if (!db) return dummyBundle(code);

  try {
    const { data: p, error } = await db.from('patients').select('*').eq('patient_code', code).single();
    if (error || !p) return dummyBundle(code);

    const [sessionsRes, fsRes] = await Promise.all([
      db
        .from('assessment_sessions')
        .select('id, session_code, measure_type, hand_side, finger_no, started_at, measurements(measurement_no, force_value)')
        .eq('patient_id', p.id)
        .eq('mode', 'pengukuran')
        .order('started_at', { ascending: true })
        .order('id', { ascending: true }),
      db.from('functional_scores').select('scored_at, score').eq('patient_id', p.id).order('scored_at'),
    ]);

    const sessions = sessionsRes.data ?? [];
    const distinctMonths = new Set(sessions.map(s => s.started_at?.slice(0, 7)));
    const groupBySessionBatch = distinctMonths.size <= 1;

    const empty = (): Record<FingerNo, PerformanceSummary[]> => ({ 1: [], 2: [], 3: [], 4: [], 5: [] });
    const fingers: FingerPerformance = { R: empty(), L: empty() };

    if (!groupBySessionBatch) {
      // Kelompokkan per bulan (Jul, Ags, Sep, Okt, dst.)
      for (const side of ['R', 'L'] as HandSide[]) {
        for (const fNo of [1, 2, 3, 4, 5] as FingerNo[]) {
          const fSessions = sessions.filter(s => s.hand_side === side && s.finger_no === fNo);
          const monthMap = new Map<string, { flex: number[]; ext: number[] }>();
          for (const s of fSessions) {
            const mLabel = toMonth(s.started_at);
            if (!monthMap.has(mLabel)) monthMap.set(mLabel, { flex: [], ext: [] });
            const vals = ((s.measurements as { force_value: number }[]) ?? []).map(m => Number(m.force_value ?? 0));
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
            if (s.measure_type === 'fleksi') monthMap.get(mLabel)!.flex.push(avg);
            else if (s.measure_type === 'ekstensi') monthMap.get(mLabel)!.ext.push(avg);
          }
          const arr: PerformanceSummary[] = [];
          monthMap.forEach((v, mLabel) => {
            const fAvg = v.flex.length ? +(v.flex.reduce((a, b) => a + b, 0) / v.flex.length).toFixed(1) : 0;
            const eAvg = v.ext.length ? +(v.ext.reduce((a, b) => a + b, 0) / v.ext.length).toFixed(1) : 0;
            arr.push({ month: mLabel, avgFlexion: fAvg, avgExtension: eAvg });
          });
          fingers[side][fNo] = ensureLinePoints(arr);
        }
      }
    } else {
      // Semua sesi di bulan yang sama: jika ada Gerakan 1 & Gerakan 2 di dalam sesi, tampilkan titiknya
      for (const side of ['R', 'L'] as HandSide[]) {
        for (const fNo of [1, 2, 3, 4, 5] as FingerNo[]) {
          const flexSessions = sessions.filter(
            s => s.hand_side === side && s.finger_no === fNo && s.measure_type === 'fleksi'
          );
          const extSessions = sessions.filter(
            s => s.hand_side === side && s.finger_no === fNo && s.measure_type === 'ekstensi'
          );
          const maxLen = Math.max(flexSessions.length, extSessions.length);
          const arr: PerformanceSummary[] = [];

          for (let i = 0; i < maxLen; i++) {
            const fs = flexSessions[i];
            const es = extSessions[i];
            const fMeas = ((fs?.measurements as { measurement_no: number; force_value: number }[]) ?? []).sort(
              (a, b) => (a.measurement_no ?? 1) - (b.measurement_no ?? 1)
            );
            const eMeas = ((es?.measurements as { measurement_no: number; force_value: number }[]) ?? []).sort(
              (a, b) => (a.measurement_no ?? 1) - (b.measurement_no ?? 1)
            );
            const mName = toMonth((fs || es)?.started_at);

            if (maxLen === 1 && (fMeas.length > 1 || eMeas.length > 1)) {
              // Tampilkan Gerakan 1 dan Gerakan 2 secara langsung pada grafik
              const count = Math.max(fMeas.length, eMeas.length);
              for (let mIdx = 0; mIdx < count; mIdx++) {
                arr.push({
                  month: `Gerakan ${mIdx + 1} (${mName})`,
                  avgFlexion: Number(fMeas[mIdx]?.force_value ?? fMeas[0]?.force_value ?? 0),
                  avgExtension: Number(eMeas[mIdx]?.force_value ?? eMeas[0]?.force_value ?? 0),
                });
              }
            } else {
              const fVals = fMeas.map(m => Number(m.force_value ?? 0));
              const eVals = eMeas.map(m => Number(m.force_value ?? 0));
              const fAvg = fVals.length ? +(fVals.reduce((a, b) => a + b, 0) / fVals.length).toFixed(1) : 0;
              const eAvg = eVals.length ? +(eVals.reduce((a, b) => a + b, 0) / eVals.length).toFixed(1) : 0;
              const label = maxLen === 1 ? mName : `${mName} #${i + 1}`;
              arr.push({ month: label, avgFlexion: fAvg, avgExtension: eAvg });
            }
          }
          fingers[side][fNo] = ensureLinePoints(arr);
        }
      }
    }

    // Hitung grafik bulanan / sesi dari seluruh jari
    const monthlyMap = new Map<string, { flex: number[]; ext: number[] }>();
    (['R', 'L'] as HandSide[]).forEach(side => {
      ([1, 2, 3, 4, 5] as FingerNo[]).forEach(fNo => {
        for (const pt of fingers[side][fNo]) {
          if (!monthlyMap.has(pt.month)) monthlyMap.set(pt.month, { flex: [], ext: [] });
          monthlyMap.get(pt.month)!.flex.push(pt.avgFlexion);
          monthlyMap.get(pt.month)!.ext.push(pt.avgExtension);
        }
      });
    });
    const monthly: PerformanceSummary[] = [];
    monthlyMap.forEach((v, label) => {
      const fAvg = v.flex.length ? +(v.flex.reduce((a, b) => a + b, 0) / v.flex.length).toFixed(1) : 0;
      const eAvg = v.ext.length ? +(v.ext.reduce((a, b) => a + b, 0) / v.ext.length).toFixed(1) : 0;
      monthly.push({ month: label, avgFlexion: fAvg, avgExtension: eAvg });
    });

    return {
      patient: {
        id: p.patient_code,
        name: p.name,
        age: p.age,
        gender: p.sex,
        diagnosis: p.diagnosis ?? '',
        joinDate: p.created_at,
        notes: p.notes ?? '',
      } as Patient,
      monthly: ensureLinePoints(monthly),
      scores: (fsRes.data ?? []).map(r => ({ date: toMonth(r.scored_at), score: r.score })),
      fingers,
      source: 'supabase',
    };
  } catch {
    return dummyBundle(code);
  }
}

/** Ambil daftar semua pasien dari Supabase; jika env kosong/gagal, kembali ke dummyData. */
export async function getPatientsList(): Promise<{ patients: Patient[]; source: 'supabase' | 'dummy' }> {
  const db = getAdminClient() || supabase;
  if (!db) return { patients: dummyPatients, source: 'dummy' };
  try {
    const { data, error } = await db.from('patients').select('*').order('patient_code');
    if (error || !data || data.length === 0) return { patients: dummyPatients, source: 'dummy' };
    return {
      patients: data.map(p => ({
        id: p.patient_code,
        name: p.name,
        age: p.age,
        gender: p.sex,
        diagnosis: p.diagnosis ?? '',
        joinDate: p.created_at,
        notes: p.notes ?? '',
      })),
      source: 'supabase',
    };
  } catch {
    return { patients: dummyPatients, source: 'dummy' };
  }
}
