"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FlowStep = 'MAIN_MODE' | 'PENGUKURAN_TYPE' | 'SIDE_SELECTION' | 'FINGER_SELECTION';

export default function ModePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const [step, setStep] = useState<FlowStep>('MAIN_MODE');
  const [selection, setSelection] = useState({
    mainMode: '',
    pengukuranType: '',
    side: '',
    finger: ''
  });

  const handleExercise = () => {
    alert('Mode Exercise diaktifkan!');
    router.push(`/patient/${params.id}`);
  };

  const handleSelect = (key: string, value: string, nextStep: FlowStep | 'DONE') => {
    setSelection(prev => ({ ...prev, [key]: value }));
    
    if (nextStep === 'DONE') {
      alert(`Selesai! Mode ${selection.mainMode} - ${selection.pengukuranType || value} - ${selection.side} - Jari: ${value} berjalan. Menyimpan data performa...`);
      router.push(`/patient/${params.id}`);
    } else {
      setStep(nextStep);
    }
  };

  const goBack = (prevStep: FlowStep) => {
    setStep(prevStep);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Pemilihan Mode Terapi</h1>
        <p className="text-gray-500">Ikuti alur untuk mengonfigurasi alat IoT.</p>
      </div>

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
              onClick={() => handleSelect('mainMode', 'Pengukuran', 'PENGUKURAN_TYPE')}
              className="bg-white p-10 rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-md transition group text-center"
            >
              <h3 className="text-2xl font-bold text-[#1e3a8a] group-hover:text-blue-600 mb-2">Pengukuran</h3>
              <p className="text-gray-500 text-sm">Ukur kekuatan statis</p>
            </button>
          </div>
        </div>
      )}

      {step === 'PENGUKURAN_TYPE' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => goBack('MAIN_MODE')} className="text-blue-500 hover:underline text-sm mb-4 font-medium">&larr; Kembali</button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">Pilih Jenis Pengukuran</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => handleSelect('pengukuranType', 'Fleksi', 'SIDE_SELECTION')}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-[#1e3a8a]">Fleksi</h3>
            </button>
            <button 
              onClick={() => handleSelect('pengukuranType', 'Ekstensi', 'SIDE_SELECTION')}
              className="bg-blue-50 p-8 rounded-xl shadow-sm border-2 border-blue-100 hover:border-blue-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-[#1e3a8a]">Ekstensi</h3>
            </button>
          </div>
        </div>
      )}

      {step === 'SIDE_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => goBack('PENGUKURAN_TYPE')} className="text-blue-500 hover:underline text-sm mb-4 font-medium">&larr; Kembali</button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">Pilih Sisi Tangan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => handleSelect('side', 'Kanan', 'FINGER_SELECTION')}
              className="bg-green-50 p-8 rounded-xl shadow-sm border-2 border-green-100 hover:border-green-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-green-800">Kanan</h3>
            </button>
            <button 
              onClick={() => handleSelect('side', 'Kiri', 'FINGER_SELECTION')}
              className="bg-green-50 p-8 rounded-xl shadow-sm border-2 border-green-100 hover:border-green-500 transition text-center"
            >
              <h3 className="text-xl font-bold text-green-800">Kiri</h3>
            </button>
          </div>
        </div>
      )}

      {step === 'FINGER_SELECTION' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={() => goBack('SIDE_SELECTION')} className="text-blue-500 hover:underline text-sm mb-4 font-medium">&larr; Kembali</button>
          <h2 className="text-lg font-semibold text-gray-700 text-center mb-6">Pilih Jari (Dst...)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Jari 1', 'Jari 2', 'Jari 3', 'Jari 4', 'Jari 5'].map(jari => (
              <button 
                key={jari}
                onClick={() => handleSelect('finger', jari, 'DONE')}
                className="bg-orange-50 py-6 rounded-xl shadow-sm border-2 border-orange-100 hover:border-orange-400 transition text-center font-bold text-orange-800"
              >
                {jari}
              </button>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 italic">Setelah memilih jari, data akan dihitung sebagai "Performa".</p>
          </div>
        </div>
      )}
    </div>
  );
}
