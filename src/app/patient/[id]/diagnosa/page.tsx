"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BodySilhouette from '@/components/interactive/BodySilhouette';

export default function DiagnosaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedRegion) {
      router.push(`/patient/${params.id}/assesmen?region=${selectedRegion}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Diagnosa: Stroke</h1>
      <p className="text-gray-500 mb-8">Silakan pilih bagian tubuh yang mengalami Hemiprase.</p>
      
      <BodySilhouette onSelectRegion={(region) => setSelectedRegion(region)} />

      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
        <p className="text-gray-600">
          Region terpilih: <span className="font-semibold text-blue-900">{selectedRegion || 'Belum ada'}</span>
        </p>
        <button 
          onClick={handleNext}
          disabled={!selectedRegion}
          className={`px-8 py-2 rounded shadow font-semibold transition ${selectedRegion ? 'bg-[#1e3a8a] text-white hover:bg-blue-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Oke
        </button>
      </div>
    </div>
  );
}
