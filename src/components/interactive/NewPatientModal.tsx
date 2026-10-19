"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPatientModal({ nextCode }: { nextCode: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [patientCode, setPatientCode] = useState(nextCode);
  const [name, setName] = useState('');
  const [age, setAge] = useState('60');
  const [sex, setSex] = useState<'L' | 'P'>('L');
  const [affectedSide, setAffectedSide] = useState<'R' | 'L'>('R');
  const [notes, setNotes] = useState('Fase pemulihan awal.');
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setPatientCode(nextCode);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const diagnosis = `Stroke (Hemiparese ${affectedSide === 'L' ? 'Kiri' : 'Kanan'})`;
      const res = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_patient',
          patient_code: patientCode,
          name,
          age: Number(age),
          sex,
          affected_side: affectedSide,
          diagnosis,
          notes,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setOpen(false);
        setName('');
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-[#213e8a] hover:bg-[#1a306c] text-white px-5 py-2.5 rounded-lg shadow-sm transition font-medium flex items-center"
      >
        <span className="mr-2">+</span> Pasien Baru (Manual)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Tambah Pasien Baru (Manual)</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Kode Pasien</label>
                  <input
                    type="text"
                    value={patientCode}
                    onChange={e => setPatientCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Umur (Tahun)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap Pasien</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Ahmad Sulaiman"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={sex}
                    onChange={e => setSex(e.target.value as 'L' | 'P')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sisi Hemiparese</label>
                  <select
                    value={affectedSide}
                    onChange={e => setAffectedSide(e.target.value as 'R' | 'L')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="R">Kanan (R)</option>
                    <option value="L">Kiri (L)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Medis Awal</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#213e8a] hover:bg-[#1a306c] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pasien'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
