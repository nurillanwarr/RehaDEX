"use client";

import { useRouter } from 'next/navigation';

export default function AssesmenPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/patient/${params.id}/mode`);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Input Data Pemeriksaan</h1>
      
      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sejak (Kalender)</label>
          <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Rasa</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" required>
            <option value="">Pilih Keluhan...</option>
            <option value="kaku">Otot Terasa Kaku / Berat</option>
            <option value="lemas">Otot Lemas / Tidak Bertenaga</option>
            <option value="nyeri">Nyeri saat digerakkan</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tekanan Darah (mmHg)</label>
            <input type="text" placeholder="120/80" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suhu Tubuh (&deg;C)</label>
            <input type="number" step="0.1" placeholder="36.5" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Asworth Scale (Spastisitas)</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500">
            <option value="0">0 - Tidak ada peningkatan tonus otot</option>
            <option value="1">1 - Sedikit peningkatan tonus otot</option>
            <option value="2">2 - Peningkatan tonus otot lebih nyata</option>
            <option value="3">3 - Peningkatan tonus otot cukup bermakna</option>
            <option value="4">4 - Bagian yang terkena kaku (rigid)</option>
          </select>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Kuisioner Aktivitas Fungsional (Skor Total)</label>
          <input type="number" placeholder="0-100" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500" required />
        </div>

        <div className="pt-6 flex justify-end">
          <button type="submit" className="bg-[#1e3a8a] text-white px-8 py-2 rounded shadow font-semibold hover:bg-blue-800 transition">
            Lanjut ke Mode
          </button>
        </div>
      </form>
    </div>
  );
}
