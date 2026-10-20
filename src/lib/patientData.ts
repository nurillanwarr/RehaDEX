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

function enrichPoint(pt: PerformanceSummary): PerformanceSummary {
  return {
    ...pt,
    flexionG1: pt.flexionG1 ?? pt.avgFlexion,
    flexionG2: pt.flexionG2 ?? +(pt.avgFlexion + 1.0).toFixed(1),
    extensionG1: pt.extensionG1 ?? pt.avgExtension,
    extensionG2: pt.extensionG2 ?? +(pt.avgExtension + 0.8).toFixed(1),
  };
}

/** Jika hanya ada 1 titik data, tambahkan titik 'Awal' agar grafik garis selalu terbentuk */
function ensureLinePoints(series: PerformanceSummary[]): PerformanceSummary[] {
  const enriched = series.map(enrichPoint);
  if (enriched.length === 1) {
    return [
      {
        month: 'Awal',
        avgFlexion: 0,
        avgExtension: 0,
        flexionG1: 0,
        flexionG2: 0,
        extensionG1: 0,
        extensionG2: 0,
      },
      enriched[0],
    ];
  }
  return enriched;
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
          const monthMap = new Map<
            string,
            { flexG1: number[]; flexG2: number[]; extG1: number[]; extG2: number[] }
          >();
          for (const s of fSessions) {
            const mLabel = toMonth(s.started_at);
            if (!monthMap.has(mLabel)) {
              monthMap.set(mLabel, { flexG1: [], flexG2: [], extG1: [], extG2: [] });
            }
            const meas = ((s.measurements as { measurement_no: number; force_value: number }[]) ?? []).sort(
              (a, b) => (a.measurement_no ?? 1) - (b.measurement_no ?? 1)
            );
            const g1 = Number(meas[0]?.force_value ?? 0);
            const g2 = Number(meas[1]?.force_value ?? meas[0]?.force_value ?? 0);
            if (s.measure_type === 'fleksi') {
              monthMap.get(mLabel)!.flexG1.push(g1);
              monthMap.get(mLabel)!.flexG2.push(g2);
            } else if (s.measure_type === 'ekstensi') {
              monthMap.get(mLabel)!.extG1.push(g1);
              monthMap.get(mLabel)!.extG2.push(g2);
            }
          }
          const arr: PerformanceSummary[] = [];
          const avgArr = (a: number[]) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : 0);
          monthMap.forEach((v, mLabel) => {
            const fg1 = avgArr(v.flexG1);
            const fg2 = avgArr(v.flexG2);
            const eg1 = avgArr(v.extG1);
            const eg2 = avgArr(v.extG2);
            arr.push({
              month: mLabel,
              avgFlexion: +((fg1 + fg2) / 2).toFixed(1),
              avgExtension: +((eg1 + eg2) / 2).toFixed(1),
              flexionG1: fg1,
              flexionG2: fg2,
              extensionG1: eg1,
              extensionG2: eg2,
            });
          });
          fingers[side][fNo] = ensureLinePoints(arr);
        }
      }
    } else {
      // Semua sesi di bulan yang sama
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
            const fg1 = Number(fMeas[0]?.force_value ?? 0);
            const fg2 = Number(fMeas[1]?.force_value ?? fMeas[0]?.force_value ?? 0);
            const eg1 = Number(eMeas[0]?.force_value ?? 0);
            const eg2 = Number(eMeas[1]?.force_value ?? eMeas[0]?.force_value ?? 0);
            const label = maxLen === 1 ? mName : `${mName} #${i + 1}`;

            arr.push({
              month: label,
              avgFlexion: +((fg1 + fg2) / 2).toFixed(1),
              avgExtension: +((eg1 + eg2) / 2).toFixed(1),
              flexionG1: fg1,
              flexionG2: fg2,
              extensionG1: eg1,
              extensionG2: eg2,
            });
          }
          fingers[side][fNo] = ensureLinePoints(arr);
        }
      }
    }

    // Hitung grafik bulanan / sesi dari seluruh jari
    const monthlyMap = new Map<
      string,
      { flex: number[]; ext: number[]; fg1: number[]; fg2: number[]; eg1: number[]; eg2: number[] }
    >();
    (['R', 'L'] as HandSide[]).forEach(side => {
      ([1, 2, 3, 4, 5] as FingerNo[]).forEach(fNo => {
        for (const pt of fingers[side][fNo]) {
          if (!monthlyMap.has(pt.month)) {
            monthlyMap.set(pt.month, { flex: [], ext: [], fg1: [], fg2: [], eg1: [], eg2: [] });
          }
          const entry = monthlyMap.get(pt.month)!;
          entry.flex.push(pt.avgFlexion);
          entry.ext.push(pt.avgExtension);
          entry.fg1.push(pt.flexionG1 ?? pt.avgFlexion);
          entry.fg2.push(pt.flexionG2 ?? pt.avgFlexion);
          entry.eg1.push(pt.extensionG1 ?? pt.avgExtension);
          entry.eg2.push(pt.extensionG2 ?? pt.avgExtension);
        }
      });
    });
    const avgArr = (a: number[]) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : 0);
    const monthly: PerformanceSummary[] = [];
    monthlyMap.forEach((v, label) => {
      monthly.push({
        month: label,
        avgFlexion: avgArr(v.flex),
        avgExtension: avgArr(v.ext),
        flexionG1: avgArr(v.fg1),
        flexionG2: avgArr(v.fg2),
        extensionG1: avgArr(v.eg1),
        extensionG2: avgArr(v.eg2),
      });
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
