"use client";

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type FlowStep =
  | 'MAIN_MODE'
  | 'METHOD_SELECTION'
  | 'MANUAL_ALL_FINGERS'
  | 'PENGUKURAN_TYPE'
  | 'SIDE_SELECTION'
  | 'FINGER_SELECTION'
  | 'IOT_WAITING';

interface FingerInputRow {
  finger_no: 1 | 2 | 3 | 4 | 5;
  label: string;
  fleksi: string;
  ekstensi: string;
}

const DEFAULT_FINGERS: FingerInputRow[] = [
  { finger_no: 1, label: 'Jari 1 (Ibu Jari)', fleksi: '22.0', ekstensi: '15.0' },
  { finger_no: 2, label: 'Jari 2 (Telunjuk)', fleksi: '20.5', ekstensi: '14.5' },
  { finger_no: 3, label: 'Jari 3 (Tengah)', fleksi: '19.0', ekstensi: '13.5' },
  { finger_no: 4, label: 'Jari 4 (Manis)', fleksi: '17.0', ekstensi: '12.0' },
  { finger_no: 5, label: 'Jari 5 (Kelingking)', fleksi: '15.0', ekstensi: '10.5' },
];

export default function ModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTemp = searchParams.get('temp') || '36.5';
  const defaultRegion = searchParams.get('region') || '';
  const initialMethod = searchParams.get('method');

  const [step, setStep] = useState<FlowStep>(
    initialMethod === 'manual' ? 'MANUAL_ALL_FINGERS' : 'MAIN_MODE'
  );

  // State untuk alur Otomatis (Alat IoT)
  const [iotSelection, setIotSelection] = useState({
    pengukuranType: 'Fleksi',
    side: defaultRegion.toLowerCase().includes('left') ? 'Kiri' : 'Kanan',
    fingerNo: 1,
  });

  // State untuk alur Manual (Semua 5 Jari Sekaligus)
  const today = new Date().toISOString().slice(0, 10);
  const [manualSide, setManualSide] = useState<'R' | 'L'>(
    defaultRegion.toLowerCase().includes('left') ? 'L' : 'R'
  );
  const [measuredDate, setMeasuredDate] = useState(today);
  const [fingersData, setFingersData] = useState<FingerInputRow[]>(DEFAULT_FINGERS);
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

  const updateFingerField = (fingerNo: number, field: 'fleksi' | 'ekstensi', value: string) => {
    setFingersData(prev =>
      prev.map(row => (row.finger_no === fingerNo ? { ...row, [field]: value } : row))
    );
  };

  const avgFlexAll = +(
    fingersData.reduce((acc, r) => acc + (parseFloat(r.fleksi) || 0), 0) / fingersData.length
  ).toFixed(1);

  const avgExtAll = +(
    fingersData.reduce((acc, r) => acc + (parseFloat(r.ekstensi) || 0), 0) / fingersData.length
  ).toFixed(1);

  const handleSaveAllFingers = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_all_fingers_measurement',
          patient_code: id,
          hand_side: manualSide,
          measured_date: measuredDate,
          heart_rate: parseFloat(heartRate),
          spo2: parseFloat(spo2),
          temperature: parseFloat(temperature),
          functional_score: functionalScore !== '' ? parseFloat(functionalScore) : null,
          fingers: fingersData.map(r => ({
            finger_no: r.finger_no,
            fleksi: parseFloat(r.fleksi) || 0,
            ekstensi: parseFloat(r.ekstensi) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setFeedback(
          `Berhasil menyimpan kelima jari ke ${
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

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Pemilihan Mode Terapi & Pengukuran</h1>
        <p className="text-gray-500">
          Pasien: <span className="font-semibold text-blue-900">{id}</span> • Pilih metode pengisian manual (semua jari) atau otomatis dari alat IoT.
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
                Masukkan nilai Fleksi &amp; Ekstensi untuk Jari 1 s/d Jari 5 sekaligus, lalu simpan langsung ke database Supabase.
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
                Pilih jenis pengukuran, sisi tangan, dan jari untuk menerima pembacaan sensor secara otomatis dari alat.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ALUR 1: INPUT MANUAL SEMUA 5 JARI SEKALIGUS -> SIMPAN KE DATABASE     */}
      {/* ===================================================================== */}
      {step === 'MANUAL_ALL_FINGERS' && (
        <form onSubmit={handleSaveAllFingers} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
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

          {/* Pilih Sisi Tangan & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                1. Pilih Sisi Tangan yang Diukur
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setManualSide('R')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    manualSide === 'R'
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#1e3a8a]'
                  }`}
                >
                  Tangan Kanan (R)
                </button>
                <button
                  type="button"
                  onClick={() => setManualSide('L')}
                  className={`py-2.5 px-4 rounded-lg font-bold text-sm border-2 transition ${
                    manualSide === 'L'
                      ? 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-[#1e3a8a]'
                  }`}
                >
                  Tangan Kiri (L)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                2. Tanggal / Bulan Pengukuran
              </label>
              <input
                type="date"
                value={measuredDate}
                onChange={e => setMeasuredDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Data akan dikelompokkan berdasarkan bulan pada grafik pasien.
              </p>
            </div>
          </div>

          {/* Tabel Input Kelima Jari */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-gray-800">
                3. Input Nilai Kekuatan Kelima Jari — Tangan {manualSide === 'R' ? 'Kanan (R)' : 'Kiri (L)'}
              </h3>
              <div className="flex gap-3 text-xs font-semibold">
                <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200">
                  Rata-rata Fleksi: {avgFlexAll}
                </span>
                <span className="px-2.5 py-1 rounded bg-lime-50 text-lime-800 border border-lime-200">
                  Rata-rata Ekstensi: {avgExtAll}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="py-3 px-4 font-semibold">Jari Tangan</th>
                    <th className="py-3 px-4 font-semibold text-red-700">Nilai Fleksi (Merah)</th>
                    <th className="py-3 px-4 font-semibold text-green-700">Nilai Ekstensi (Hijau)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {fingersData.map(row => (
                    <tr key={row.finger_no} className="hover:bg-gray-50/80">
                      <td className="py-3 px-4 font-semibold text-gray-800">{row.label}</td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.1"
                          value={row.fleksi}
                          onChange={e => updateFingerField(row.finger_no, 'fleksi', e.target.value)}
                          placeholder="0.0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
                          required
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.1"
                          value={row.ekstensi}
                          onChange={e => updateFingerField(row.finger_no, 'ekstensi', e.target.value)}
                          placeholder="0.0"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-600"
                          required
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tanda Vital & Skor Fungsional */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">4. Tanda Vital &amp; Skor Fungsional Pasien</h4>
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
              className="bg-[#12aca7] hover:bg-[#0e8a86] text-white px-7 py-3 rounded-xl shadow font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan Semua Jari ke Database...' : 'Simpan Semua 5 Jari ke Database & Lihat Grafik'}
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
                setStep('SIDE_SELECTION');
              }}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-[#1e3a8a]">Fleksi</h3>
            </button>
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, pengukuranType: 'Ekstensi' }));
                setStep('SIDE_SELECTION');
              }}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-[#1e3a8a]">Ekstensi</h3>
            </button>
          </div>
        </div>
      )}

      {step === 'SIDE_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setStep('PENGUKURAN_TYPE')}
            className="text-blue-500 hover:underline text-sm mb-4 font-medium"
          >
            &larr; Kembali
          </button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">
            [Mode Alat IoT] Pilih Sisi Tangan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, side: 'Kanan' }));
                setStep('FINGER_SELECTION');
              }}
              className="bg-green-50 p-8 rounded-xl shadow-sm border-2 border-green-100 hover:border-green-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-green-800">Kanan (R)</h3>
            </button>
            <button
              onClick={() => {
                setIotSelection(prev => ({ ...prev, side: 'Kiri' }));
                setStep('FINGER_SELECTION');
              }}
              className="bg-green-50 p-8 rounded-xl shadow-sm border-2 border-green-100 hover:border-green-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-green-800">Kiri (L)</h3>
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
            [Mode Alat IoT] Pilih Jari
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
            Konfigurasi aktif: <strong>{iotSelection.pengukuranType}</strong> • Tangan{' '}
            <strong>{iotSelection.side}</strong> • <strong>Jari {iotSelection.fingerNo}</strong>.
            <br />
            Alat akan mengirimkan 20x pembacaan ke endpoint <code>POST /api/measurements</code>.
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
