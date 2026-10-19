// src/data/dummyData.ts

export type Gender = 'L' | 'P';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  diagnosis: string;
  joinDate: string;
  notes: string;
}

export interface FunctionalScore {
  date: string;
  score: number; // 0-100
}

export interface IotMeasurement {
  id: number;
  session_id: string;
  timestamp: string;
  heart_rate: number;
  spo2: number;
  temperature: number;
  flexion_strength: number;
  extension_strength: number;
}

export interface SessionData {
  id: string;
  patient_id: string;
  date: string;
  measurements: IotMeasurement[];
}

export interface PerformanceSummary {
  month: string;
  avgFlexion: number;
  avgExtension: number;
}

// Data Dummy Pasien
export const patients: Patient[] = [
  { id: 'STK-001', name: 'Budi Santoso', age: 62, gender: 'L', diagnosis: 'Stroke (Hemiparese Kanan)', joinDate: '2026-07-01', notes: 'Fase pemulihan awal.' },
  { id: 'STK-002', name: 'Siti Aminah', age: 58, gender: 'P', diagnosis: 'Stroke (Hemiparese Kiri)', joinDate: '2026-08-15', notes: 'Progres sangat baik.' },
  { id: 'STK-003', name: 'Rahmat Hidayat', age: 65, gender: 'L', diagnosis: 'Stroke (Hemiparese Kanan)', joinDate: '2026-09-02', notes: 'Perlu latihan ekstensi intensif.' },
];

// Data Dummy Tren Fungsional
export const functionalScores: Record<string, FunctionalScore[]> = {
  'STK-001': [
    { date: 'Jul', score: 40 },
    { date: 'Ags', score: 55 },
    { date: 'Sep', score: 65 },
  ],
  'STK-002': [
    { date: 'Ags', score: 50 },
    { date: 'Sep', score: 70 },
  ]
};

// Data Dummy IoT (Sesi dengan 20 Pengukuran)
// Kita buat ringkasan performa per bulan (rata-rata dari sesi di bulan tersebut) untuk keperluan grafik.
export const iotPerformance: Record<string, PerformanceSummary[]> = {
  'STK-001': [
    { month: 'Jul', avgFlexion: 12.5, avgExtension: 8.2 },
    { month: 'Ags', avgFlexion: 18.0, avgExtension: 12.5 },
    { month: 'Sep', avgFlexion: 24.5, avgExtension: 17.8 },
  ],
  'STK-002': [
    { month: 'Ags', avgFlexion: 15.0, avgExtension: 10.0 },
    { month: 'Sep', avgFlexion: 28.5, avgExtension: 22.0 },
  ]
};

// ===== Data Performa per Jari (sesuai Video 2) =====
// Struktur: pasien -> sisi tangan (R/L) -> jari (1-5) -> daftar ringkasan per bulan
export type HandSide = 'R' | 'L';
export type FingerNo = 1 | 2 | 3 | 4 | 5;
export type FingerPerformance = Record<HandSide, Record<FingerNo, PerformanceSummary[]>>;

const MONTHS = ['Jul', 'Ags', 'Sep', 'Okt', 'Nov'];

// Generator deterministik agar tampilan konsisten (tanpa Math.random)
const buildFingerSeries = (baseFlex: number, baseExt: number, seed: number): PerformanceSummary[] =>
  MONTHS.map((month, i) => {
    const dip = i === 2 ? -3 : 0; // penurunan kecil di tengah, seperti sketsa video
    const wobble = ((seed * (i + 3)) % 5) * 0.4;
    return {
      month,
      avgFlexion: +(baseFlex + i * 3.2 + dip + wobble).toFixed(1),
      avgExtension: +(baseExt + i * 2.1 + dip / 2 + wobble / 2).toFixed(1),
    };
  });

const buildHand = (flex: number, ext: number, seedBase: number): Record<FingerNo, PerformanceSummary[]> => ({
  1: buildFingerSeries(flex + 2, ext + 1, seedBase + 1),
  2: buildFingerSeries(flex + 1, ext + 1.5, seedBase + 2),
  3: buildFingerSeries(flex, ext, seedBase + 3),
  4: buildFingerSeries(flex - 1.5, ext - 1, seedBase + 4),
  5: buildFingerSeries(flex - 3, ext - 2, seedBase + 5),
});

export const fingerPerformance: Record<string, FingerPerformance> = {
  // Hemiparese kanan -> tangan kanan lebih lemah
  'STK-001': { R: buildHand(8, 5, 1), L: buildHand(20, 15, 7) },
  // Hemiparese kiri -> tangan kiri lebih lemah
  'STK-002': { R: buildHand(22, 16, 3), L: buildHand(10, 6, 9) },
  'STK-003': { R: buildHand(6, 3, 5), L: buildHand(19, 14, 2) },
};

// Contoh data mentah 1 sesi (20 pengukuran) untuk STK-001
export const generateSessionMeasurements = (sessionId: string, baseFlex: number, baseExt: number): IotMeasurement[] => {
  const measurements: IotMeasurement[] = [];
  for (let i = 1; i <= 20; i++) {
    measurements.push({
      id: i,
      session_id: sessionId,
      timestamp: `2026-09-20T10:${String(i).padStart(2, '0')}:00Z`,
      heart_rate: 75 + Math.floor(Math.random() * 10),
      spo2: 96 + Math.floor(Math.random() * 4),
      temperature: 36.5 + (Math.random() * 0.5),
      flexion_strength: baseFlex + (Math.random() * 5),
      extension_strength: baseExt + (Math.random() * 3),
    });
  }
  return measurements;
};

export const latestSession: SessionData = {
  id: 'SES-005',
  patient_id: 'STK-001',
  date: '2026-09-20',
  measurements: generateSessionMeasurements('SES-005', 20, 15),
};
