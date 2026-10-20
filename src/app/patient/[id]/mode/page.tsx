"use client";

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type FlowStep =
  | 'MAIN_MODE'
  | 'METHOD_SELECTION'
  | 'MANUAL_ALL_FINGERS'
  | 'PENGUKURAN_TYPE'
  | 'MOVEMENT_SELECTION'
  | 'SIDE_SELECTION'
  | 'FINGER_SELECTION'
  | 'IOT_WAITING';

type HandSide = 'R' | 'L';
type MeasureType = 'fleksi' | 'ekstensi';
type MovementNo = 1 | 2;
type FingerNo = 1 | 2 | 3 | 4 | 5;

const FINGER_LABELS: Record<FingerNo, string> = {
  1: 'Jari 1 (Ibu Jari)',
  2: 'Jari 2 (Telunjuk)',
  3: 'Jari 3 (Tengah)',
  4: 'Jari 4 (Manis)',
  5: 'Jari 5 (Kelingking)',
};

type FingerMatrix = Record<
  HandSide,
  Record<
    FingerNo,
    {
      fleksi_g1: string;
      fleksi_g2: string;
      ekstensi_g1: string;
      ekstensi_g2: string;
    }
  >
>;

function createInitialMatrix(): FingerMatrix {
  const buildHand = (offset: number) => ({
    1: { fleksi_g1: String(22 + offset), fleksi_g2: String(23 + offset), ekstensi_g1: String(15 + offset), ekstensi_g2: String(16 + offset) },
    2: { fleksi_g1: String(20 + offset), fleksi_g2: String(21 + offset), ekstensi_g1: String(14 + offset), ekstensi_g2: String(15 + offset) },
    3: { fleksi_g1: String(19 + offset), fleksi_g2: String(20 + offset), ekstensi_g1: String(13 + offset), ekstensi_g2: String(14 + offset) },
    4: { fleksi_g1: String(17 + offset), fleksi_g2: String(18 + offset), ekstensi_g1: String(12 + offset), ekstensi_g2: String(13 + offset) },
    5: { fleksi_g1: String(15 + offset), fleksi_g2: String(16 + offset), ekstensi_g1: String(10 + offset), ekstensi_g2: String(11 + offset) },
  });
  return {
    R: buildHand(0),
    L: buildHand(0),
  };
}

export default function ModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTemp = searchParams.get('temp') || '36.5';
  const initialMethod = searchParams.get('method');

  const [step, setStep] = useState<FlowStep>(
    initialMethod === 'manual' ? 'MANUAL_ALL_FINGERS' : 'MAIN_MODE'
  );

  // State untuk alur Otomatis (Alat IoT) — bisa pilih 1 atau 2 sisi tangan
  const [iotSelection, setIotSelection] = useState<{
    pengukuranType: string;
    movementNo: MovementNo;
    sides: HandSide[];
    fingerNo: number;
  }>({
    pengukuranType: 'Fleksi',
    movementNo: 1,
    sides: ['R'],
    fingerNo: 1,
  });

  // State untuk alur Manual — bisa pilih 1 sisi atau kedua sisi tangan sekaligus (['R'], ['L'], atau ['R', 'L'])
  const today = new Date().toISOString().slice(0, 10);
  const [movementNo, setMovementNo] = useState<MovementNo>(1);
  const [selectedSides, setSelectedSides] = useState<HandSide[]>(['R']);
  const [measureType, setMeasureType] = useState<MeasureType>('fleksi');
  const [measuredDate, setMeasuredDate] = useState(today);
  const [matrix, setMatrix] = useState<FingerMatrix>(createInitialMatrix);

  const [heartRate, setHeartRate] = useState('80');
  const [spo2, setSpo2] = useState('98');
  const [temperature, setTemperature] = useState(defaultTemp);
  const [functionalScore, setFunctionalScore] = useState('65');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleExercise = () => {
    alert('Mode Exercise diaktifkan!');
    router.push(`/patient/${id}`);
  };

  // Toggle pilih sisi tangan (bisa pilih 1 atau dua-duanya sekaligus)
  const toggleManualSide = (side: HandSide) => {
    setSelectedSides(prev => {
      if (prev.includes(side)) {
        // Jangan biarkan kosong sama sekali, minimal 1 terpilih
        return prev.length > 1 ? prev.filter(s => s !== side) : prev;
      }
      // Urutkan R dulu baru L
      const next = [...prev, side];
      return (['R', 'L'] as HandSide[]).filter(s => next.includes(s));
    });
  };

  const toggleIotSide = (side: HandSide) => {
    setIotSelection(prev => {
      const exists = prev.sides.includes(side);
      const nextSides = exists
        ? prev.sides.length > 1
          ? prev.sides.filter(s => s !== side)
          : prev.sides
        : (['R', 'L'] as HandSide[]).filter(s => [...prev.sides, side].includes(s));
      return { ...prev, sides: nextSides };
    });
  };

  const activeFieldKey = `${measureType}_g${movementNo}` as
    | 'fleksi_g1'
    | 'fleksi_g2'
    | 'ekstensi_g1'
    | 'ekstensi_g2';

  const updateFingerValue = (side: HandSide, fNo: FingerNo, val: string) => {
    setMatrix(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [fNo]: {
          ...prev[side][fNo],
          [activeFieldKey]: val,
        },
      },
    }));
  };

  const handleSaveAllFingers = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const allFingersPayload: {
        hand_side: HandSide;
        finger_no: FingerNo;
        fleksi_g1: number;
        fleksi_g2: number;
        ekstensi_g1: number;
        ekstensi_g2: number;
      }[] = [];

      // Simpan sesuai sisi tangan yang dipilih (1 tangan atau kedua tangan sekaligus)
      selectedSides.forEach(side => {
        ([1, 2, 3, 4, 5] as FingerNo[]).forEach(fNo => {
          const item = matrix[side][fNo];
          allFingersPayload.push({
            hand_side: side,
            finger_no: fNo,
            fleksi_g1: parseFloat(item.fleksi_g1) || 0,
            fleksi_g2: parseFloat(item.fleksi_g2) || 0,
            ekstensi_g1: parseFloat(item.ekstensi_g1) || 0,
            ekstensi_g2: parseFloat(item.ekstensi_g2) || 0,
          });
        });
      });

      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_all_fingers_measurement',
          patient_code: id,
          hand_side: selectedSides[0] || 'R',
          measured_date: measuredDate,
          heart_rate: parseFloat(heartRate),
          spo2: parseFloat(spo2),
          temperature: parseFloat(temperature),
          functional_score: functionalScore !== '' ? parseFloat(functionalScore) : null,
          fingers: allFingersPayload,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setFeedback(
          `Berhasil menyimpan data pengukuran (${selectedSides.map(s => (s === 'R' ? 'Kanan' : 'Kiri')).join(' & ')}) ke ${
            data.savedTo === 'supabase' ? 'Database Supabase' : 'Memori Lokal'
          }! Mengalihkan ke grafik...`
        );
        router.push(`/patient/${id}`);
        router.refresh();
      } else {
        setFeedback(`Gagal menyimpan: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch {
      setFeedback('Gagal menghubungi server.');
    } finally {
      setSaving(false);
    }
  };

  const bothManualSelected = selectedSides.length === 2;
  const bothIotSelected = iotSelection.sides.length === 2;

  return (
    <div className="max-w-4xl mx-auto bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pemilihan Mode Terapi &amp; Pengukuran</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pasien: <span className="font-semibold text-blue-900">{id}</span> • Pilih metode pengisian manual atau otomatis dari alat IoT.
        </p>
      </div>

      {/* STEP 1: PILIH EXERCISE ATAU PENGUKURAN */}
      {step === 'MAIN_MODE' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">Pilih Mode Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={handleExercise}
              className="bg-white p-10 rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition group text-center"
            >
              <h3 className="text-2xl font-bold text-[#1e3a8a] group-hover:text-blue-600 mb-2">Exercise</h3>
              <p className="text-gray-500 text-sm">Mode latihan dinamis</p>
            </button>
            <button
              onClick={() => setStep('METHOD_SELECTION')}
              className="bg-white p-10 rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition group text-center"
            >
              <h3 className="text-2xl font-bold text-[#1e3a8a] group-hover:text-blue-600 mb-2">Pengukuran</h3>
              <p className="text-gray-500 text-sm">Ukur kekuatan statis (Manual / Otomatis Alat)</p>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PILIH METODE MANUAL vs OTOMATIS ALAT */}
      {step === 'METHOD_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setStep('MAIN_MODE')}
            className="text-blue-500 hover:underline text-sm mb-4 font-medium"
          >
            &larr; Kembali ke Mode Utama
          </button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
            Pilih Metode Pengambilan Data Pengukuran
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setStep('MANUAL_ALL_FINGERS')}
              className="bg-teal-50 p-8 rounded-xl shadow-sm border-2 border-teal-200 hover:border-[#12aca7] hover:shadow-md transition text-center"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-wider bg-[#12aca7] text-white px-3 py-1 rounded-full mb-3">
                Siap Digunakan
              </span>
              <h3 className="text-xl font-bold text-teal-900 mb-2">Input Manual (Semua Jari)</h3>
              <p className="text-gray-600 text-sm">
                Pilih Gerakan 1 / Gerakan 2, Sisi Tangan (bisa pilih 1 atau keduanya), serta Fleksi / Ekstensi untuk Jari 1 s/d Jari 5.
              </p>
            </button>

            <button
              onClick={() => setStep('PENGUKURAN_TYPE')}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-200 hover:border-blue-600 hover:shadow-md transition text-center"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-wider bg-[#1e3a8a] text-white px-3 py-1 rounded-full mb-3">
                Mode Sensor IoT
              </span>
              <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">Otomatis dari Alat (ESP32)</h3>
              <p className="text-gray-600 text-sm">
                Pilih jenis pengukuran, Gerakan 1/2, sisi tangan, dan jari untuk menerima pembacaan sensor otomatis dari alat.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ALUR 1: INPUT MANUAL (GERAKAN 1 & 2 -> TANGAN -> FLEKSI / EKSTENSI)   */}
      {/* ===================================================================== */}
      {step === 'MANUAL_ALL_FINGERS' && (
        <form onSubmit={handleSaveAllFingers} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep('METHOD_SELECTION')}
              className="text-blue-500 hover:underline text-sm font-medium"
            >
              &larr; Ganti Metode (Manual / Otomatis Alat)
            </button>
            <span className="text-xs font-semibold bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
              Mode Pengisian Manual (5 Jari)
            </span>
          </div>

          <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 space-y-4">
            {/* 1. PILIH GERAKAN 1 / GERAKAN 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                1. Pilih Tahap Gerakan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMovementNo(1)}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    movementNo === 1
                      ? 'bg-[#12aca7] border-[#12aca7] text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#12aca7]'
                  }`}
                >
                  Gerakan 1
                </button>
                <button
                  type="button"
                  onClick={() => setMovementNo(2)}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    movementNo === 2
                      ? 'bg-[#12aca7] border-[#12aca7] text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#12aca7]'
                  }`}
                >
                  Gerakan 2
                </button>
              </div>
            </div>

            {/* 2. PILIH SISI TANGAN (BISA PILIH 1 ATAU KEDUANYA SEKALIGUS) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  2. Pilih Sisi Tangan yang Diukur (Bisa Pilih 1 atau Keduanya)
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedSides(['R', 'L'])}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition ${
                    bothManualSelected
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-blue-800 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {bothManualSelected ? '✓ Kedua Tangan Aktif (R & L)' : '+ Pilih Kedua Tangan (R & L)'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleManualSide('R')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    selectedSides.includes('R')
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#1e3a8a]'
                  }`}
                >
                  {selectedSides.includes('R') ? '✓ ' : ''}Tangan Kanan (R)
                </button>
                <button
                  type="button"
                  onClick={() => toggleManualSide('L')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    selectedSides.includes('L')
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#1e3a8a]'
                  }`}
                >
                  {selectedSides.includes('L') ? '✓ ' : ''}Tangan Kiri (L)
                </button>
              </div>
            </div>

            {/* 3. PILIH JENIS PENGUKURAN (FLEKSI / EKSTENSI) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                3. Pilih Jenis Pengukuran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMeasureType('fleksi')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    measureType === 'fleksi'
                      ? 'bg-red-600 border-red-600 text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-red-500'
                  }`}
                >
                  Fleksi
                </button>
                <button
                  type="button"
                  onClick={() => setMeasureType('ekstensi')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    measureType === 'ekstensi'
                      ? 'bg-lime-600 border-lime-600 text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-lime-600'
                  }`}
                >
                  Ekstensi
                </button>
              </div>
            </div>

            {/* 4. TANGGAL PENGUKURAN */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                4. Tanggal / Bulan Pengukuran
              </label>
              <input
                type="date"
                value={measuredDate}
                onChange={e => setMeasuredDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* 5. TABEL INPUT KELIMA JARI (Menampilkan 1 atau 2 Tangan sesuai yang dipilih) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-800">
              5. Input Nilai Kekuatan Kelima Jari •{' '}
              <span className="text-[#12aca7]">Gerakan {movementNo}</span> •{' '}
              <span className={measureType === 'fleksi' ? 'text-red-600' : 'text-lime-700'}>
                {measureType === 'fleksi' ? 'Fleksi' : 'Ekstensi'}
              </span>
            </h3>

            <div className={`grid grid-cols-1 ${bothManualSelected ? 'lg:grid-cols-2' : ''} gap-4`}>
              {selectedSides.map(side => (
                <div key={side} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-[#1e3a8a] text-white px-4 py-2.5 text-sm font-bold flex items-center justify-between">
                    <span>Tangan {side === 'R' ? 'Kanan (R)' : 'Kiri (L)'}</span>
                    <span className="text-xs font-normal text-blue-100">
                      Gerakan {movementNo} • {measureType === 'fleksi' ? 'Fleksi' : 'Ekstensi'}
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="py-2.5 px-4 font-semibold">Jari Tangan</th>
                        <th
                          className={`py-2.5 px-4 font-semibold ${
                            measureType === 'fleksi' ? 'text-red-700' : 'text-lime-700'
                          }`}
                        >
                          Nilai {measureType === 'fleksi' ? 'Fleksi (Merah)' : 'Ekstensi (Hijau)'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {([1, 2, 3, 4, 5] as FingerNo[]).map(fNo => (
                        <tr key={fNo} className="hover:bg-gray-50/80">
                          <td className="py-2.5 px-4 font-semibold text-gray-800">
                            {FINGER_LABELS[fNo]}
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="number"
                              step="0.1"
                              value={matrix[side][fNo][activeFieldKey]}
                              onChange={e => updateFingerValue(side, fNo, e.target.value)}
                              placeholder="0.0"
                              className={`w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none ${
                                measureType === 'fleksi'
                                  ? 'focus:border-red-500'
                                  : 'focus:border-lime-600'
                              }`}
                              required
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Tanda Vital & Skor Fungsional */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              6. Tanda Vital &amp; Skor Fungsional Pasien
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Skor Fungsional (0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={functionalScore}
                  onChange={e => setFunctionalScore(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Detak Jantung (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={e => setHeartRate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Saturasi Oksigen / SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Suhu Tubuh (&deg;C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-sm font-medium">
              {feedback}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-[#12aca7] hover:bg-[#0e8a86] text-white px-7 py-3 rounded-xl shadow font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan ke Database...' : 'Simpan Semua Jari ke Database & Lihat Grafik'}
            </button>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* ALUR 2: OTOMATIS DARI ALAT IoT (ESP32)                                */}
      {/* ===================================================================== */}
      {step === 'PENGUKURAN_TYPE' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setStep('METHOD_SELECTION')}
            className="text-blue-500 hover:underline text-sm mb-4 font-medium"
          >
            &larr; Kembali Pilih Metode
          </button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
            [Mode Alat IoT] Pilih Jenis Pengukuran
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, pengukuranType: 'Fleksi' }));
                setStep('MOVEMENT_SELECTION');
              }}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-[#1e3a8a]">Fleksi</h3>
            </button>
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, pengukuranType: 'Ekstensi' }));
                setStep('MOVEMENT_SELECTION');
              }}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-[#1e3a8a]">Ekstensi</h3>
            </button>
          </div>
        </div>
      )}

      {step === 'MOVEMENT_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setStep('PENGUKURAN_TYPE')}
            className="text-blue-500 hover:underline text-sm mb-4 font-medium"
          >
            &larr; Kembali
          </button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
            [Mode Alat IoT] Pilih Gerakan ({iotSelection.pengukuranType})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, movementNo: 1 }));
                setStep('SIDE_SELECTION');
              }}
              className="bg-teal-50 p-8 rounded-xl shadow-sm border-2 border-teal-100 hover:border-teal-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-teal-800">Gerakan 1</h3>
            </button>
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, movementNo: 2 }));
                setStep('SIDE_SELECTION');
              }}
              className="bg-teal-50 p-8 rounded-xl shadow-sm border-2 border-teal-100 hover:border-teal-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-teal-800">Gerakan 2</h3>
            </button>
          </div>
        </div>
      )}

      {step === 'SIDE_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setStep('MOVEMENT_SELECTION')}
            className="text-blue-500 hover:underline text-sm mb-4 font-medium"
          >
            &larr; Kembali
          </button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">
            [Mode Alat IoT] Pilih Sisi Tangan
          </h2>
          <p className="text-xs text-gray-500 text-center mb-4">
            Bisa pilih salah satu tangan atau kedua tangan sekaligus, lalu klik Lanjut.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => toggleIotSide('R')}
              className={`p-6 rounded-xl shadow-sm border-2 transition text-center font-bold ${
                iotSelection.sides.includes('R')
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-green-50 border-green-100 text-green-800 hover:border-green-500'
              }`}
            >
              {iotSelection.sides.includes('R') ? '✓ ' : ''}Kanan (R)
            </button>
            <button
              type="button"
              onClick={() => toggleIotSide('L')}
              className={`p-6 rounded-xl shadow-sm border-2 transition text-center font-bold ${
                iotSelection.sides.includes('L')
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-green-50 border-green-100 text-green-800 hover:border-green-500'
              }`}
            >
              {iotSelection.sides.includes('L') ? '✓ ' : ''}Kiri (L)
            </button>
            <button
              type="button"
              onClick={() => setIotSelection(prev => ({ ...prev, sides: ['R', 'L'] }))}
              className={`p-6 rounded-xl shadow-sm border-2 transition text-center font-bold ${
                bothIotSelected
                  ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white'
                  : 'bg-blue-50 border-blue-100 text-[#1e3a8a] hover:border-blue-500'
              }`}
            >
              {bothIotSelected ? '✓ ' : ''}Kedua Tangan (R &amp; L)
            </button>
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep('FINGER_SELECTION')}
              className="bg-[#1e3a8a] hover:bg-blue-800 text-white px-8 py-2.5 rounded-xl font-semibold shadow transition"
            >
              Lanjut Pilih Jari &rarr;
            </button>
          </div>
        </div>
      )}

      {step === 'FINGER_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setStep('SIDE_SELECTION')}
            className="text-blue-500 hover:underline text-sm mb-4 font-medium"
          >
            &larr; Kembali
          </button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
            [Mode Alat IoT] Pilih Jari ({iotSelection.pengukuranType} • Gerakan {iotSelection.movementNo} • Tangan{' '}
            {iotSelection.sides.map(s => (s === 'R' ? 'Kanan' : 'Kiri')).join(' & ')})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => {
                  setIotSelection(prev => ({ ...prev, fingerNo: num }));
                  setStep('IOT_WAITING');
                }}
                className="bg-orange-50 py-6 rounded-xl shadow-sm border-2 border-orange-100 hover:border-orange-400 transition text-center font-bold text-orange-800"
              >
                Jari {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'IOT_WAITING' && (
        <div className="space-y-6 text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border-4 border-blue-200 flex items-center justify-center animate-pulse">
            <span className="w-4 h-4 rounded-full bg-blue-600"></span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Menunggu Data Otomatis dari Alat IoT (ESP32)...
          </h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Konfigurasi aktif: <strong>{iotSelection.pengukuranType}</strong> •{' '}
            <strong>Gerakan {iotSelection.movementNo}</strong> • Tangan{' '}
            <strong>{iotSelection.sides.map(s => (s === 'R' ? 'Kanan' : 'Kiri')).join(' & ')}</strong> •{' '}
            <strong>Jari {iotSelection.fingerNo}</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-lg mx-auto text-xs text-amber-800">
            Karena alat IoT saat ini masih dalam tahap penyesuaian, Anda dapat beralih ke{' '}
            <strong>Input Manual (Semua Jari)</strong> untuk memasukkan data ke database sekarang.
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep('MANUAL_ALL_FINGERS')}
              className="bg-[#12aca7] hover:bg-[#0e8a86] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition"
            >
              Beralih ke Input Manual (Semua Jari)
            </button>
            <button
              type="button"
              onClick={() => router.push(`/patient/${id}`)}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg font-medium text-sm transition"
            >
              Kembali ke Profil Pasien
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
