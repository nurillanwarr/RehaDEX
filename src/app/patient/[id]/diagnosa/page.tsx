"use client";

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import BodySilhouette, { RegionKey, REGION_LABELS } from '@/components/interactive/BodySilhouette';

export default function DiagnosaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedRegions, setSelectedRegions] = useState<RegionKey[]>([]);

  const handleNext = () => {
    if (selectedRegions.length > 0) {
      const regionParam = selectedRegions.map(r => REGION_LABELS[r]).join(', ');
      router.push(`/patient/${id}/assesmen?region=${encodeURIComponent(regionParam)}`);
    }
  };

  const selectedLabelText =
    selectedRegions.length > 0
      ? selectedRegions.map(r => REGION_LABELS[r]).join(', ')
      : 'Belum ada';

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-gray-100 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Diagnosa: Stroke</h1>
      <p className="text-gray-500 mb-4 text-sm sm:text-base">
        Silakan pilih bagian tubuh yang mengalami Hemiparese (bisa pilih lebih dari 1 bagian).
      </p>

      <BodySilhouette onSelectRegions={regions => setSelectedRegions(regions)} />

      <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-gray-600 text-sm">
          Region terpilih:{' '}
          <span className="font-semibold text-blue-900">{selectedLabelText}</span>
        </p>
        <button
          onClick={handleNext}
          disabled={selectedRegions.length === 0}
          className={`w-full sm:w-auto px-8 py-2.5 rounded-lg shadow font-semibold transition ${
            selectedRegions.length > 0
              ? 'bg-[#1e3a8a] text-white hover:bg-blue-800'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Oke ({selectedRegions.length} dipilih)
        </button>
      </div>
    </div>
  );
}
