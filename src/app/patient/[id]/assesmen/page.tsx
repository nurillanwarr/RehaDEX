"use client";

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AssesmenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || '';

  const today = new Date().toISOString().slice(0, 10);
  const [scoredAt, setScoredAt] = useState(today);
  const [complaint, setComplaint] = useState('');
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [temperature, setTemperature] = useState('36.5');
  const [ashworth, setAshworth] = useState('1');
  const [score, setScore] = useState('65');
  const [saving, setSaving] = useState(false);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_assessment',
          patient_code: id,
          scored_at: scoredAt,
          complaint,
          blood_pressure: bloodPressure,
          temperature: Number(temperature),
          ashworth,
          score: Number(score),
          region,
        }),
      });
    } catch {
      // tetap lanjut walau offline
    } finally {
      setSaving(false);
      router.push(`/patient/${id}/mode?temp=${encodeURIComponent(temperature)}&region=${encodeURIComponent(region)}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-100">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Input Data Pemeriksaan (Manual)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pasien: <span className="font-semibold text-blue-900">{id}</span>
          {region && (
            <>
              {' '}• Area Terpilih: <span className="font-semibold text-blue-900">{region}</span>
            </>
          )}
        </p>
      </div>
      
      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pemeriksaan / Sejak (Kalender)</label>
          <input
            type="date"
            value={scoredAt}
            onChange={e => setScoredAt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Rasa / Keluhan</label>
          <select
            value={complaint}
            onChange={e => setComplaint(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Pilih Keluhan...</option>
            <option value="Otot Terasa Kaku / Berat">Otot Terasa Kaku / Berat</option>
            <option value="Otot Lemas / Tidak Bertenaga">Otot Lemas / Tidak Bertenaga</option>
            <option value="Nyeri saat digerakkan">Nyeri saat digerakkan</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tekanan Darah (mmHg)</label>
            <input
              type="text"
              value={bloodPressure}
              onChange={e => setBloodPressure(e.target.value)}
              placeholder="120/80"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suhu Tubuh (&deg;C)</label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(e.target.value)}
              placeholder="36.5"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ashworth Scale (Spastisitas)</label>
          <select
            value={ashworth}
            onChange={e => setAshworth(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="0">0 - Tidak ada peningkatan tonus otot</option>
            <option value="1">1 - Sedikit peningkatan tonus otot</option>
            <option value="2">2 - Peningkatan tonus otot lebih nyata</option>
            <option value="3">3 - Peningkatan tonus otot cukup bermakna</option>
            <option value="4">4 - Bagian yang terkena kaku (rigid)</option>
          </select>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kuisioner Aktivitas Fungsional (Skor Total 0–100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={e => setScore(e.target.value)}
            placeholder="0-100"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Skor ini akan langsung disimpan ke Tabel Tren Skor Fungsional pasien (Supabase).
          </p>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-lg shadow font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan & Lanjut ke Mode Terapi'}
          </button>
        </div>
      </form>
    </div>
  );
}
